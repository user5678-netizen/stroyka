#!/usr/bin/env node
/**
 * One-off maintenance script: puts the product images that were uploaded into
 * the flat folder `stroyka/products` into per-product folders and tops the
 * short folders up to three images.
 *
 *   stroyka/products/<product-slug>/1-..., 2-..., 3-...
 *
 * Order matters: ImageCarousel takes the first three URLs, so the ordinal
 * prefix is the slide order.
 *
 * Usage (from backend/):
 *   node scripts/cloudinary-organize.js            # dry run, prints the plan
 *   node scripts/cloudinary-organize.js --apply    # performs rename + upload
 *
 * Writes scripts/product-images.json with the final URLs per product.
 *
 * New photos: Unsplash (Unsplash License) and Wikimedia Commons
 * (CC BY-SA), see IMAGE_SOURCES.md.
 */

'use strict';

const fs = require('fs');
const path = require('path');

function loadEnv() {
  const file = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(file)) return;
  for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[2].trim().replace(/^["']|["']$/g, '');
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
  }
}
loadEnv();

const { v2: cloudinary } = require('cloudinary');

const APPLY = process.argv.includes('--apply');
const ROOT = 'stroyka/products';
const UNUSED = 'stroyka/unused';

const PLAN = [
  {
    slug: 'exterior-paint-set',
    moves: [
      ['stroyka/products/tjnsle1ydk4heyogtqvu', '1-paint-can'],
      ['stroyka/products/g67xbpu2lcedf0mgngbz', '2-paint-roller'],
      ['stroyka/products/m9aedpcs6bicihs6azqb', '3-painted-interior'],
      ['stroyka/products/rghmpjnx3reyxledlm7j', '4-painted-interior-alt'],
    ],
  },
  {
    slug: 'plywood-sheets',
    moves: [['stroyka/products/eg0rwdtgvecwr00qdpyj', '1-plywood-board']],
    uploads: [
      {
        from: 'https://images.unsplash.com/photo-1704167674713-649193461719?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=85&w=1600',
        to: '2-plywood-sheets',
      },
      {
        file: path.join(process.env.TEMP || '/tmp', 'stroyka_new_images', 'plywood-panels.jpg'),
        to: '3-plywood-panels',
      },
    ],
  },
  {
    slug: 'premium-cement-bags',
    moves: [
      ['stroyka/products/obdiswgwovw5ntdwjhzp', '1-cement-warehouse'],
      ['stroyka/products/rfwhet0hl3bupsdhqfvl', '2-concrete-site'],
    ],
    uploads: [
      {
        file: path.join(process.env.TEMP || '/tmp', 'stroyka_new_images', 'cement-bags.jpg'),
        to: '3-cement-bags',
      },
    ],
  },
  {
    slug: 'premium-lumber-planks',
    moves: [
      ['stroyka/products/vqvw29lkd3lkezpr2orb', '1-lumber-stack'],
      ['stroyka/products/xpjylge9nqwatnuglvgt', '2-carpentry-workshop'],
      ['stroyka/products/b348kzzjpvbzokszsxpm', '3-miter-saw'],
    ],
  },
  {
    slug: 'red-clay-bricks',
    moves: [
      ['stroyka/products/bb1txlsois8jseqz6ovz', '1-brick-stack'],
      ['stroyka/products/rrydwrra8qhjgpdsbziy', '2-brick-renovation'],
    ],
    uploads: [
      {
        from: 'https://images.pexels.com/photos/38179174/pexels-photo-38179174.jpeg?auto=compress&cs=tinysrgb&w=1600',
        to: '3-brick-pallet',
      },
    ],
  },
  {
    slug: 'steel-i-beams',
    moves: [
      ['stroyka/products/eljajhvmtpzxsk8qsbe0', '1-steel-pipes'],
      ['stroyka/products/rehc0frn1d3f7qarpnk0', '2-metalwork'],
      ['stroyka/products/wdv1gtdfldl8h0aej0yw', '3-welding'],
    ],
  },
];

const PARKED = [
  ['stroyka/products/cfcv0wbjgfrkoma8ql7p', 'laptop'],
  ['stroyka/products/nzxcpaeydxdeelsqfnpz', 'desk'],
  ['stroyka/products/ugfryshe9zjvq4teltlp', 'crane'],
];

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

function log(...args) {
  console.log(...args);
}

async function uploadWithRetry(source, options, attempts = 3) {
  let lastError;
  for (let i = 1; i <= attempts; i += 1) {
    try {
      const target =
        source.file && fs.existsSync(source.file) ? source.file : source.from;
      if (!target) {
        throw new Error('no local file and no remote URL for ' + options.public_id);
      }
      return await cloudinary.uploader.upload(target, options);
    } catch (error) {
      lastError = error;
      log(`      attempt ${i}/${attempts} failed: ${error.message}`);
      await new Promise((r) => setTimeout(r, 4000 * i));
    }
  }
  throw lastError;
}

(async () => {
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    throw new Error('CLOUDINARY_* is not configured in backend/.env');
  }

  const result = { generated_at: new Date().toISOString(), products: [] };

  for (const product of PLAN) {
    const folder = `${ROOT}/${product.slug}`;
    log(`\n${product.slug}  ->  ${folder}`);

    for (const [from, name] of product.moves || []) {
      const to = `${folder}/${name}`;
      log(`  move ${from.split('/').pop()} -> ${name}`);
      if (APPLY) {
        let done = false;
        try {
          await cloudinary.api.resource(`${folder}/${name}`);
          done = true;
        } catch {
          done = false;
        }
        if (done) {
          log('       уже на месте, пропуск');
          continue;
        }
        const res = await cloudinary.uploader.rename(from, to, {
          overwrite: false,
          invalidate: true,
          resource_type: 'image',
        });
        log(`       ${res.secure_url}`);
      }
    }

    for (const upload of product.uploads || []) {
      log(`  upload ${upload.to} (${upload.file ? 'local file' : upload.from.slice(0, 60) + '...'})`);
      if (APPLY) {
        let exists = false;
        try {
          await cloudinary.api.resource(`${folder}/${upload.to}`);
          exists = true;
        } catch {
          exists = false;
        }
        if (exists) {
          log('       уже загружено, пропуск');
          continue;
        }
        const res = await uploadWithRetry(upload, {
          folder,
          public_id: upload.to,
          overwrite: true,
          invalidate: true,
          tags: [`product:${product.slug}`],
        });
        log(`       ${res.secure_url}`);
      }
    }
  }

  log(`\nСлужебные кадры -> ${UNUSED}`);
  for (const [from, name] of PARKED) {
    log(`  move ${from.split('/').pop()} -> ${UNUSED}/${name}`);
    if (APPLY) {
      let done = false;
      try {
        await cloudinary.api.resource(`${UNUSED}/${name}`);
        done = true;
      } catch {
        done = false;
      }
      if (done) {
        log('       уже на месте, пропуск');
        continue;
      }
      await cloudinary.uploader.rename(from, `${UNUSED}/${name}`, {
        overwrite: false,
        invalidate: true,
        resource_type: 'image',
      });
    }
  }

  if (!APPLY) {
    log('\nDry run. Повторите с --apply, чтобы выполнить.');
    return;
  }

  // Collect final URLs, ordered by the numeric prefix.
  for (const product of PLAN) {
    const res = await cloudinary.api.resources({
      resource_type: 'image',
      type: 'upload',
      prefix: `${ROOT}/${product.slug}/`,
      max_results: 50,
    });
    const items = (res.resources || [])
      .sort((a, b) => a.public_id.localeCompare(b.public_id))
      .map((r) => ({ public_id: r.public_id, url: r.secure_url, width: r.width, height: r.height }));
    result.products.push({ slug: product.slug, count: items.length, images: items });
    log(`\n${product.slug}: ${items.length} image(s)`);
    for (const i of items) log(`  ${i.public_id.split('/').pop()}  ${i.width}x${i.height}`);
  }

  const out = path.join(__dirname, 'product-images.json');
  fs.writeFileSync(out, JSON.stringify(result, null, 2), 'utf8');
  log(`\nЗаписано: ${out}`);
})().catch((error) => {
  console.error('\nОшибка: ' + (error.message || error));
  process.exit(1);
});
