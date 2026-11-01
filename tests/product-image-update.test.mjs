import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/product-image-update-20261102.json', import.meta.url), 'utf8'));
const operations = new URL('../ops/product-media-20261102/', import.meta.url);
const update = readFileSync(new URL('update-images.sql', operations), 'utf8');
const rollback = readFileSync(new URL('rollback-images.sql', operations), 'utf8');
const assignments = JSON.parse(readFileSync(new URL('assignments.json', operations), 'utf8'));
const catalogue = db => db.prepare('SELECT * FROM products ORDER BY id').all().map(row => ({ ...row }));

function realCatalogueCopy() {
  const db = new DatabaseSync(':memory:');
  db.exec(fixture.createSql);
  const fields = Object.keys(fixture.products[0]);
  const insert = db.prepare(`INSERT INTO products (${fields.map(field => `"${field}"`).join(',')}) VALUES (${fields.map(() => '?').join(',')})`);
  for (const product of fixture.products) insert.run(...fields.map(field => product[field]));
  return db;
}

test('image-only update changes exactly eight real products and preserves every other field', () => {
  const db = realCatalogueCopy();
  try {
    const before = catalogue(db);
    db.exec(update);
    assert.equal(db.prepare('SELECT changes() AS count').get().count, 8);
    for (const product of catalogue(db)) {
      const original = before.find(item => item.id === product.id);
      const assignment = assignments.find(item => item.id === product.id);
      assert.equal(product.image, assignment?.after || original.image);
      assert.deepEqual({ ...product, image: original.image }, original);
    }
  } finally { db.close(); }
});

test('a changed or missing expected image prevents the entire eight-product update', () => {
  const db = realCatalogueCopy();
  try {
    db.prepare('UPDATE products SET image = ? WHERE id = ?').run('https://picklenick.au/api/r2/file/client-images/later-upload.webp', 'prod_roast_habanero');
    const before = catalogue(db);
    db.exec(update);
    assert.equal(db.prepare('SELECT changes() AS count').get().count, 0);
    assert.deepEqual(catalogue(db), before);
  } finally { db.close(); }
});

test('the guarded rollback restores the exact real catalogue', () => {
  const db = realCatalogueCopy();
  try {
    const before = catalogue(db);
    db.exec(update);
    db.exec(rollback);
    assert.equal(db.prepare('SELECT changes() AS count').get().count, 8);
    assert.deepEqual(catalogue(db), before);
  } finally { db.close(); }
});
