import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolveProductMedia, getProductGallery } from '../lib/productMedia.ts';

const products = JSON.parse(readFileSync(new URL('./fixtures/catalogue-media.json', import.meta.url), 'utf8'));
const expected = {
  prod_roast_habanero: 'roast-habanero-photo',
  prod_bourbon_glaze: 'bourbon-glaze-photo',
  prod_sweet_smokey: 'sweet-smokey-photo',
  prod_roast_jalapeno: 'roast-jalapeno-photo',
  prod_carrot: 'carrots-label',
  prod_cauliflower: 'cauliflower-label',
  prod_burger_onions: 'red-onions-label',
  prod_cucumbers: 'cucumbers-label',
};

for (const product of products) {
  test(`${product.id}: uses its own approved replacement or keeps its real image`, () => {
    const media = resolveProductMedia(product);
    assert.equal(media.src, expected[product.id] ? `/brand/products/${expected[product.id]}.webp` : product.image);
  });
}

test('later administrator uploads take priority over the recorded replacements', () => {
  for (const product of products) {
    const uploaded = { ...product, image: 'https://picklenick.au/api/r2/file/client-images/later-upload.webp' };
    assert.equal(resolveProductMedia(uploaded).src, uploaded.image);
  }
});

test('gallery images are unique and every local asset exists', () => {
  for (const product of products) {
    const gallery = getProductGallery(product);
    assert.equal(new Set(gallery.map(image => image.src)).size, gallery.length);
    assert.equal(gallery[0].src, resolveProductMedia(product).src);
    for (const image of gallery) {
      if (image.src.startsWith('/')) assert.ok(existsSync(new URL(`../public${image.src}`, import.meta.url)), image.src);
    }
  }
});

test('all supplied photos and artwork have a visible consumer', () => {
  const home = readFileSync(new URL('../pages/Home.tsx', import.meta.url), 'utf8');
  const assets = JSON.parse(readFileSync(new URL('../assets/media-sources.json', import.meta.url), 'utf8'));
  const media = products.flatMap(getProductGallery).map(image => image.src);
  assert.equal(assets.length, 19);
  for (const asset of assets) {
    const slug = asset.output.split('/').at(-1).replace('.webp', '');
    assert.ok(media.includes(`/${asset.output.replace('public/', '')}`) || home.includes(slug), slug);
  }
});

test('missing images never borrow an unrelated product label', () => {
  const cowboy = products.find(product => product.id === 'prod_cowboy_candy');
  assert.equal(resolveProductMedia({ ...cowboy, image: '' }).src, '/brand/pickle-nick-logo.jpg');
});
