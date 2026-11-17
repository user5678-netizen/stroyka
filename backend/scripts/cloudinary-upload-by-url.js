#!/usr/bin/env node
/**
 * Upload missing product images to Cloudinary into a per-product folder.
 *
 * Works two ways:
 *   1) from remote URLs (Cloudinary fetches them itself) - same as
 *      CloudinaryService.uploadFromUrl() in src/shared/services/cloudinary.service.ts;
 *   2) from local files.
 *
 * Images land in:  stroyka/products/<product-slug>/
 * public_id:      <product-slug>-1, <product-slug>-2, ...  (overwrite=true, rerun-safe)
 * tag:            product:<product-slug>
 *
 * Usage:
 *   node scripts/cloudinary-upload-by-url.js --product=exterior-paint \
 *        --urls=https://site/a.jpg,https://site/b.jpg,https://site/c.jpg
 *
 *   node scripts/cloudinary-upload-by-url.js --product=plywood --urls-file=urls.txt
 *   node scripts/cloudinary-upload-by-url.js --product=bricks --files=./a.jpg,./b.jpg --dry-run
 *
 * Prints a JSON array of the resulting secure_url values - paste it straight
 * into the product `images` field (PUT /api/products/:id) or into seed data.
 */

'use strict';

const fs = require('fs');
const path = require('path');

function loadEnvFiles() {
  for (const file of [
    path.join(__dirname, '..', '.env'),
    path.join(__dirname, '..', '..', '.env'),
  ]) {
    if (!fs.existsSync(file)) continue;
    for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (!m) continue;
      let value = m[2].trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[m[1]] === undefined) process.env[m[1]] = value;
    }
  }
}
loadEnvFiles();

const cloudinary = require('cloudinary').v2;

const argv = process.argv.slice(2);
const flags = new Set(
  argv
    .filter((a) => a.startsWith('--') && !a.includes('='))
    .map((a) => a.slice(2)),
);
const opts = {};
for (const arg of argv) {
  if (!arg.startsWith('--')) continue;
  const eq = arg.indexOf('=');
  if (eq !== -1) opts[arg.slice(2, eq)] = arg.slice(eq + 1);
}

const ROOT_FOLDER = opts.folder || 'stroyka/products';
const MIN = Number(opts.min || 3);
const DRY = flags.has('dry-run');
const EXTRA_TAGS = (opts.tag || '')
  .split(',')
  .map((t) => t.trim())
  .filter(Boolean);

function slugify(input) {
  return String(input)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

const product = opts.product ? slugify(opts.product) : '';
if (!product) {
  console.error(
    'Usage: node scripts/cloudinary-upload-by-url.js --product=<slug> --urls=<u1>,<u2>,<u3>\n' +
      '       (or --urls-file=urls.txt / --files=./a.jpg,./b.jpg)',
  );
  process.exit(2);
}

const folder = `${ROOT_FOLDER}/${product}`;

function readList() {
  if (opts.urls) {
    return opts.urls
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((value) => ({ kind: 'url', value }));
  }
  if (opts['urls-file']) {
    return fs
      .readFileSync(opts['urls-file'], 'utf8')
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter((s) => s && !s.startsWith('#'))
      .map((value) => ({ kind: 'url', value }));
  }
  if (opts.files) {
    return opts.files
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((value) => ({ kind: 'file', value }));
  }
  return [];
}

const items = readList();
if (!items.length) {
  console.error('No sources given: pass --urls=... or --urls-file=... or --files=...');
  process.exit(2);
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

(async () => {
  if (!process.env.CLOUDINARY_CLOUD_NAME || /^your_/.test(process.env.CLOUDINARY_CLOUD_NAME)) {
    throw new Error('CLOUDINARY_* variables are not configured in backend/.env');
  }

  console.log(`product: ${product}`);
  console.log(`folder:  ${folder}`);
  console.log(`sources: ${items.length}${DRY ? ' (dry run)' : ''}\n`);

  if (items.length < MIN) {
    console.log(
      `! only ${items.length} source(s) given, carousel needs at least ${MIN} distinct images\n`,
    );
  }

  if (DRY) {
    items.forEach((it, i) => {
      console.log(
        `  would upload  ${it.kind.padEnd(4)} ${it.value}\n` +
          `                -> ${folder}/${product}-${i + 1}`,
      );
    });
    return;
  }

  const urls = [];
  for (let i = 0; i < items.length; i += 1) {
    const it = items[i];
    const publicId = `${product}-${i + 1}`;
    const common = {
      folder,
      public_id: publicId,
      overwrite: true,
      invalidate: true,
      tags: [`product:${product}`, ...EXTRA_TAGS],
      context: { product, source: it.kind },
    };

    try {
      const res =
        it.kind === 'url'
          ? await cloudinary.uploader.upload(it.value, common)
          : await cloudinary.uploader.upload(path.resolve(it.value), common);
      urls.push(res.secure_url);
      console.log(`  ok  ${String(i + 1).padStart(2)}. ${res.secure_url}`);
    } catch (err) {
      console.error(`  ERR ${String(i + 1).padStart(2)}. ${it.value}`);
      console.error(`      ${err.message || err}`);
    }
  }

  console.log(`\nuploaded: ${urls.length}/${items.length}`);
  console.log('\nimages array for the product (JSON):');
  console.log(JSON.stringify(urls, null, 2));

  // Verify what Cloudinary actually holds in the product folder.
  try {
    const res = await cloudinary.api.resources({
      resource_type: 'image',
      type: 'upload',
      prefix: `${folder}/`,
      max_results: 100,
    });
    const total = (res.resources || []).length;
    console.log(
      `\nfolder now holds ${total} image(s) ${total < MIN ? '(still below ' + MIN + ')' : '(ok for carousel)'}`,
    );
  } catch (err) {
    console.error('could not verify folder contents: ' + err.message);
  }

  if (urls.length < MIN) process.exitCode = 1;
})().catch((err) => {
  console.error('Upload failed: ' + (err.message || err));
  process.exit(2);
});
