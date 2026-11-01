(async () => {
  const expected = {
    prod_roast_habanero: '/brand/products/roast-habanero-studio-v2.webp',
    prod_bourbon_glaze: '/brand/products/bourbon-glaze-studio-v2.webp',
    prod_sweet_smokey: '/brand/products/sweet-smokey-studio-v2.webp',
    prod_roast_jalapeno: '/brand/products/roast-jalapeno-studio-v2.webp',
    prod_carrot: '/brand/products/carrots-label.webp',
    prod_cauliflower: '/brand/products/cauliflower-label.webp',
    prod_burger_onions: '/brand/products/red-onions-label.webp',
    prod_cucumbers: '/brand/products/cucumbers-label.webp',
  };
  const elements = [...document.querySelectorAll('.product-card')];
  for (const card of elements) {
    card.scrollIntoView({ block: 'center', behavior: 'instant' });
    const image = card.querySelector('.product-visual__image');
    if (image) await Promise.race([image.decode().catch(() => {}), new Promise(resolve => setTimeout(resolve, 5000))]);
    const revealStarted = performance.now();
    while (Number(getComputedStyle(card).opacity) < 0.99 && performance.now() - revealStarted < 2500) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
  const cards = elements.map(card => {
    const link = card.querySelector('a[href*="/product/"]');
    const image = card.querySelector('.product-visual__image');
    const id = link?.getAttribute('href')?.split('/').at(-1);
    return { id, path: image ? new URL(image.currentSrc || image.src).pathname : null, loaded: !!image?.complete && image.naturalWidth > 0, revealed: Number(getComputedStyle(card).opacity) >= 0.99 };
  });
  const failures = cards.filter(card => !card.loaded || !card.revealed || (expected[card.id] && card.path !== expected[card.id]));
  const missing = Object.keys(expected).filter(id => !cards.some(card => card.id === id));
  return JSON.stringify({ pass: cards.length === 9 && failures.length === 0 && missing.length === 0, cards, failures, missing, url: location.href });
})()
