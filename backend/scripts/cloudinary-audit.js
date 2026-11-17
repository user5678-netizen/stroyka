#!/usr/bin/env node
/**
 * Cloudinary product-image audit (Admin API, cloudinary v2).
 *
 * Answers the questions:
 *   - what is actually stored in the Cloudinary account;
 *   - how the images are grouped (folders / public_id prefixes / upload batches / tags);
 *   - which groups have fewer than N (default 3) images;
 *   - what is missing and how to upload it.
 *
 * Usage (from the backend/ directory):
 *   node scripts/cloudinary-audit.js
 *   node scripts/cloudinary-audit.js --prefix=stroyka/products --min=3
 *   node scripts/cloudinary-audit.js --strategy=time --batch-gap=300
 *   node scripts/cloudinary-audit.js --all --json=audit.json --csv=audit.csv
 *   node scripts/cloudinary-audit.js --api=http://localhost:3000 --strict
 *
 * Credentials come from env or backend/.env:
 *   CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET
 */

'use strict';

const fs = require('fs');
const path = require('path');

/* ------------------------------------------------------------------ */
/* .env loader (no extra dependency required)                          */
/* ------------------------------------------------------------------ */
function loadEnvFiles() {
  const candidates = [
    path.join(__dirname, '..', '.env'),
    path.join(__dirname, '..', '..', '.env'),
  ];
  for (const file of candidates) {
    if (!fs.existsSync(file)) continue;
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
    for (const raw of lines) {
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

/* ------------------------------------------------------------------ */
/* CLI arguments                                                       */
/* ------------------------------------------------------------------ */
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
  if (eq === -1) continue;
  opts[arg.slice(2, eq)] = arg.slice(eq + 1);
}

const PREFIX = opts.prefix === undefined ? 'stroyka/products' : opts.prefix;
const MIN = Number(opts.min || 3);
const STRATEGY = opts.strategy || 'folder';
const DEPTH = Number(opts.depth || 3);
const BATCH_GAP = Number(opts['batch-gap'] || 300);
const INCLUDE_ALL = flags.has('all');
const SHOW_URLS = flags.has('urls') || flags.has('verbose');
const STRICT = flags.has('strict');
const JSON_OUT = opts.json || '';
const CSV_OUT = opts.csv || '';
const API_URL = opts.api || '';

const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};
const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const c = (code, text) => (useColor ? code + text + C.reset : text);

/* ------------------------------------------------------------------ */
/* Cloudinary setup                                                    */
/* ------------------------------------------------------------------ */
const CFG = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
};

function assertCredentials() {
  const missing = Object.entries({
    CLOUDINARY_CLOUD_NAME: CFG.cloud_name,
    CLOUDINARY_API_KEY: CFG.api_key,
    CLOUDINARY_API_SECRET: CFG.api_secret,
  })
    .filter(([, v]) => !v || /^your_/.test(v))
    .map(([k]) => k);

  if (missing.length) {
    console.error(
      c(C.red, `Missing Cloudinary credentials: ${missing.join(', ')}`) +
        '\nSet them in backend/.env (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET).',
    );
    process.exit(2);
  }

  cloudinary.config({ ...CFG, secure: true });
}

/* ------------------------------------------------------------------ */
/* Data fetching                                                       */
/* ------------------------------------------------------------------ */
async function fetchAllImages() {
  const all = [];
  let cursor;
  do {
    const res = await cloudinary.api.resources({
      resource_type: 'image',
      type: 'upload',
      max_results: 500,
      ...(cursor ? { next_cursor: cursor } : {}),
    });
    for (const r of res.resources || []) all.push(r);
    cursor = res.next_cursor;
  } while (cursor);
  return all;
}

async function fetchFolders(parent) {
  try {
    const res = parent
      ? await cloudinary.api.sub_folders(parent)
      : await cloudinary.api.root_folders();
    return res.folders || [];
  } catch (err) {
    console.log(c(C.yellow, `   [warn] folder listing failed: ${err.message}`));
    return [];
  }
}

/* ------------------------------------------------------------------ */
/* Grouping strategies                                                 */
/* ------------------------------------------------------------------ */
const RANDOM_SUFFIX = /[-_ ]?[a-z0-9]{12,}$/i;

function folderOf(asset) {
  // public_id — источник истины: путь в URL всегда совпадает с ним,
  // asset_folder в Admin API может отставать после переноса файлов.
  const id = asset.public_id || '';
  const idx = id.lastIndexOf('/');
  if (idx !== -1) return id.slice(0, idx);
  return asset.asset_folder || '';
}

function folderKey(asset) {
  const folder = folderOf(asset);
  if (DEPTH <= 0) return folder || '(root)';
  return folder.split('/').slice(0, DEPTH).join('/') || '(root)';
}

function prefixKey(asset) {
  const folder = folderOf(asset);
  const name = (asset.public_id || '').split('/').pop() || '';
  const stem = name.replace(RANDOM_SUFFIX, '') || name;
  return [folder, stem].filter(Boolean).join('/') || '(root)';
}

function timeKey(asset, batches) {
  const ts = new Date(asset.created_at).getTime();
  for (const b of batches) {
    if (ts >= b.start && ts <= b.end) return b.key;
  }
  return '(unknown)';
}

function tagKey(asset) {
  const tags = asset.tags || [];
  if (!tags.length) return '(no tags)';
  return tags.find((t) => /product|sku|item/i.test(t)) || tags[0];
}

function buildTimeBatches(assets) {
  const sorted = assets
    .map((a) => ({ a, ts: new Date(a.created_at).getTime() }))
    .sort((x, y) => x.ts - y.ts);

  const batches = [];
  for (const { ts } of sorted) {
    const last = batches[batches.length - 1];
    if (last && ts - last.end <= BATCH_GAP * 1000) {
      last.end = ts;
      last.count += 1;
    } else {
      batches.push({ start: ts, end: ts, count: 1 });
    }
  }
  for (const b of batches) {
    const from = new Date(b.start).toISOString().replace('T', ' ').slice(0, 19);
    const to = new Date(b.end).toISOString().replace('T', ' ').slice(0, 19);
    b.key = `${from} .. ${to}`;
  }
  return batches;
}

function groupAssets(assets) {
  const batches = STRATEGY === 'time' ? buildTimeBatches(assets) : [];
  const keyOf = (a) => {
    if (STRATEGY === 'prefix') return prefixKey(a);
    if (STRATEGY === 'time') return timeKey(a, batches);
    if (STRATEGY === 'tag') return tagKey(a);
    return folderKey(a);
  };

  const map = new Map();
  for (const a of assets) {
    const key = keyOf(a);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(a);
  }

  return [...map.entries()]
    .map(([key, items]) => {
      items.sort((x, y) => new Date(x.created_at) - new Date(y.created_at));
      const fingerprints = new Set(
        items.map((i) => `${i.bytes}:${i.width}x${i.height}`),
      );
      return {
        key,
        assets: items,
        count: items.length,
        unique: fingerprints.size,
        urls: items.map((i) => i.secure_url),
        missing: Math.max(0, MIN - items.length),
      };
    })
    .sort((a, b) => a.count - b.count || a.key.localeCompare(b.key));
}

/* ------------------------------------------------------------------ */
/* Rendering                                                           */
/* ------------------------------------------------------------------ */
function printFolderTree(allAssets) {
  const byFolder = new Map();
  for (const a of allAssets) {
    const f = folderOf(a) || '(root)';
    byFolder.set(f, (byFolder.get(f) || 0) + 1);
  }
  console.log(c(C.bold, '\n1) FOLDERS / RESOURCES IN CLOUDINARY'));
  console.log(c(C.dim, '   folder'.padEnd(34) + 'images'));
  for (const [folder, count] of [...byFolder.entries()].sort((a, b) =>
    a[0].localeCompare(b[0]),
  )) {
    console.log(`   ${folder.padEnd(34)}${String(count).padStart(6)}`);
  }
}

function printGroupTable(groups) {
  const keyW = Math.max(12, ...groups.map((g) => g.key.length));
  const line = (l, m, r) => l + '-'.repeat(keyW + 2) + m + '-'.repeat(7) + m + '-'.repeat(7) + m + '-'.repeat(9) + m + '-'.repeat(8) + r;

  console.log(c(C.bold, '\n2) GROUPS (strategy: ' + STRATEGY + ', min: ' + MIN + ')'));
  console.log(line('+', '+', '+'));
  console.log(
    '| ' + 'group'.padEnd(keyW) + ' | ' + 'count'.padStart(5) + ' | ' + 'unique'.padStart(5) + ' | ' + 'missing'.padStart(7) + ' | ' + '<3?'.padEnd(6) + ' |',
  );
  console.log(line('+', '+', '+'));
  for (const g of groups) {
    const short = g.count < MIN;
    console.log(
      '| ' +
        (short ? c(C.red, g.key.padEnd(keyW)) : g.key.padEnd(keyW)) +
        ' | ' +
        String(g.count).padStart(5) +
        ' | ' +
        String(g.unique).padStart(5) +
        ' | ' +
        String(g.missing).padStart(7) +
        ' | ' +
        (short ? c(C.red, 'YES  ') : c(C.green, 'no   ')) +
        ' |',
    );
  }
  console.log(line('+', '+', '+'));
}

function printUrls(groups) {
  console.log(c(C.bold, '\n3) URLS PER GROUP'));
  for (const g of groups) {
    console.log(`\n  ${c(C.cyan, g.key)}  (${g.count} images, ${g.unique} unique)`);
    const urls = SHOW_URLS ? g.urls : g.urls.slice(0, 5);
    for (const u of urls) console.log('    - ' + u);
    if (!SHOW_URLS && g.urls.length > 5) {
      console.log(c(C.dim, `    ... ${g.urls.length - 5} more (use --urls to print all)`));
    }
  }
}

function printShortages(groups) {
  const short = groups.filter((g) => g.count < MIN);
  console.log(c(C.bold, '\n4) GROUPS WITH FEWER THAN ' + MIN + ' IMAGES'));
  if (!short.length) {
    console.log(c(C.green, '   none - every group has at least ' + MIN + ' images'));
    return;
  }
  for (const g of short) {
    const rel = PREFIX ? g.key.replace(PREFIX, '').replace(/^\/+/, '') : g.key;
    const slug = slugify(rel || g.key);
    console.log(
      `\n   ${c(C.red, g.key)}: ${g.count} image(s), need ${g.missing} more`,
    );
    console.log(
      c(
        C.dim,
        `   suggested folder: ${PREFIX}/${slug}` +
          `\n   command: node scripts/cloudinary-upload-by-url.js --product=${slug} --urls=<url1>,<url2>` +
          (g.missing > 1 ? `,<url${g.missing}>` : ''),
      ),
    );
  }
}

function slugify(input) {
  return String(input)
    .replace(/\(root\)/g, 'root')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 60) || 'group';
}

/* ------------------------------------------------------------------ */
/* Optional: cross-check against the live catalog API                  */
/* ------------------------------------------------------------------ */
async function compareWithApi(images) {
  if (!API_URL) return null;
  const base = API_URL.replace(/\/+$/, '');
  let products;
  try {
    const res = await fetch(`${base}/api/products?limit=100`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    products = body.items || body.data || body;
  } catch (err) {
    console.log(c(C.yellow, `\n   [warn] cannot read ${base}/api/products: ${err.message}`));
    return null;
  }

  const known = new Set(images.map((i) => i.public_id));
  const rows = [];
  for (const p of products) {
    const urls = Array.isArray(p.images) ? p.images : [];
    const distinct = new Set(urls);
    const onCloudinary = urls.filter((u) => /res\.cloudinary\.com/.test(u));
    const missingInCloudinary = onCloudinary.filter((u) => {
      const m = u.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-z0-9]+)?$/i);
      return m ? !known.has(m[1]) : true;
    });
    rows.push({
      id: p.id,
      title: p.title || p.name,
      count: urls.length,
      distinct: distinct.size,
      cloudinary: onCloudinary.length,
      missingInCloudinary: missingInCloudinary.length,
      needs: Math.max(0, MIN - distinct.size),
    });
  }
  return rows;
}

function printApiComparison(rows) {
  if (!rows) return;
  console.log(c(C.bold, '\n5) CATALOG CROSS-CHECK (' + API_URL + ')'));
  console.log(c(C.dim, '   product'.padEnd(34) + 'imgs  distinct  cloudinary  broken  need'));
  let bad = 0;
  for (const r of rows) {
    const flag = r.needs > 0 || r.broken > 0 || r.missingInCloudinary > 0;
    if (flag) bad += 1;
    const label = `${r.title || r.id}`.slice(0, 32).padEnd(34);
    console.log(
      '   ' +
        (flag ? c(C.red, label) : label) +
        String(r.count).padStart(4) +
        String(r.distinct).padStart(10) +
        String(r.cloudinary).padStart(12) +
        String(r.missingInCloudinary).padStart(8) +
        String(r.needs).padStart(6),
    );
  }
  console.log(
    `\n   products: ${rows.length}, with problems: ${bad}, total images: ${rows.reduce((s, r) => s + r.count, 0)}`,
  );
}

/* ------------------------------------------------------------------ */
/* Export                                                              */
/* ------------------------------------------------------------------ */
function writeJson(groups, allImages, apiRows) {
  if (!JSON_OUT) return;
  const report = {
    generated_at: new Date().toISOString(),
    cloud_name: CFG.cloud_name,
    prefix: PREFIX || '(all)',
    strategy: STRATEGY,
    min_images: MIN,
    totals: {
      images_in_account: allImages.length,
      images_in_scope: allImages.filter((a) =>
        PREFIX ? (a.public_id || '').startsWith(PREFIX) : true,
      ).length,
      groups: groups.length,
      groups_below_min: groups.filter((g) => g.count < MIN).length,
    },
    folders: Object.fromEntries(
      [...new Set(allImages.map((a) => folderOf(a) || '(root)'))].map((f) => [
        f,
        allImages.filter((a) => (folderOf(a) || '(root)') === f).length,
      ]),
    ),
    groups: groups.map((g) => ({
      group: g.key,
      count: g.count,
      unique: g.unique,
      missing: g.missing,
      below_min: g.count < MIN,
      urls: g.urls,
      public_ids: g.assets.map((a) => a.public_id),
    })),
    catalog: apiRows || undefined,
  };
  fs.writeFileSync(JSON_OUT, JSON.stringify(report, null, 2), 'utf8');
  console.log(c(C.dim, `\n   report written: ${JSON_OUT}`));
}

function writeCsv(groups) {
  if (!CSV_OUT) return;
  const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = ['group,count,unique,below_min,missing,urls'];
  for (const g of groups) {
    lines.push(
      [
        esc(g.key),
        g.count,
        g.unique,
        g.count < MIN ? 'yes' : 'no',
        g.missing,
        esc(g.urls.join(' ')),
      ].join(','),
    );
  }
  fs.writeFileSync(CSV_OUT, lines.join('\n'), 'utf8');
  console.log(c(C.dim, `   csv written: ${CSV_OUT}`));
}

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */
(async () => {
  assertCredentials();

  const allImages = await fetchAllImages();
  const scoped = PREFIX
    ? allImages.filter((a) => (a.public_id || '').startsWith(PREFIX))
    : allImages;

  console.log(c(C.bold, '\n=== CLOUDINARY IMAGE AUDIT ==='));
  console.log(` cloud:     ${CFG.cloud_name}`);
  console.log(` prefix:    ${PREFIX || '(whole account)'}`);
  console.log(` strategy:  ${STRATEGY}${STRATEGY === 'folder' ? ` (depth=${DEPTH})` : ''}`);
  console.log(` min images per group: ${MIN}`);
  console.log(
    ` images:    ${allImages.length} in account, ${scoped.length} in scope`,
  );

  if (flags.has('folders')) {
    for (const f of await fetchFolders('')) {
      console.log(`   folder ok: ${f.path} (${f.name})`);
    }
  }

  printFolderTree(allImages);

  const groups = groupAssets(scoped);
  printGroupTable(groups);
  printUrls(groups);
  printShortages(groups);

  const apiRows = await compareWithApi(allImages);
  printApiComparison(apiRows);

  const short = groups.filter((g) => g.count < MIN);
  console.log(c(C.bold, '\nSUMMARY'));
  console.log(
    `   groups: ${groups.length} | with >= ${MIN}: ${groups.length - short.length} | below ${MIN}: ${short.length}`,
  );
  if (short.length) {
    const totalMissing = short.reduce((s, g) => s + g.missing, 0);
    console.log(
      c(C.yellow, `   images to add: ${totalMissing} across ${short.length} group(s)`),
    );
  }

  writeJson(groups, allImages, apiRows);
  writeCsv(groups);

  if (STRICT && (short.length > 0 || (apiRows || []).some((r) => r.needs > 0))) {
    process.exit(1);
  }
})().catch((err) => {
  console.error(c(C.red, '\nAudit failed: ' + (err.message || err)));
  if (err.http_code === 401) {
    console.error('Cloudinary rejected the credentials (check key/secret/cloud name).');
  }
  process.exit(2);
});
