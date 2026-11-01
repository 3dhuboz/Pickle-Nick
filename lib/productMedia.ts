import type { Product } from '../types';

export type ProductMedia = {
  src: string;
  art: boolean;
  label: string;
};

type MediaProduct = Pick<Product, 'id' | 'image'>;
type ProductRefresh = { previousImage: string; images: readonly ProductMedia[] };
const oldImage = (name: string) => `https://picklenick.au/api/r2/file/client-images/${name}.jpg`;
const photo = (name: string, label = 'Studio photo'): ProductMedia => ({ src: `/brand/products/${name}.webp`, art: false, label });
const artwork = (name: string): ProductMedia => ({ src: `/brand/products/${name}-label.webp`, art: true, label: 'Updated artwork' });

// Only replace the recorded old image. A later upload in Inventory takes priority.
const REFRESH: Readonly<Record<string, ProductRefresh>> = {
  prod_roast_habanero: { previousImage: oldImage('cb377e4e-f8e0-4c53-8b3a-51f41db7166d'), images: [photo('roast-habanero-studio-v2'), artwork('roast-habanero'), photo('fresh-habaneros', 'Fresh habaneros')] },
  prod_bourbon_glaze: { previousImage: oldImage('30fdb2bf-c21c-4297-89bb-f5765f23a3ea'), images: [photo('bourbon-glaze-studio-v2'), artwork('bourbon-glaze')] },
  prod_sweet_smokey: { previousImage: oldImage('d3173781-0963-4956-b2a7-684e4b8b26a8'), images: [photo('sweet-smokey-studio-v2'), artwork('sweet-smokey')] },
  prod_roast_jalapeno: { previousImage: oldImage('278a4c73-f615-44d9-b974-6213e87ff240'), images: [photo('roast-jalapeno-studio-v2'), artwork('roast-jalapeno'), photo('fresh-jalapenos', 'Fresh jalapeños')] },
  prod_carrot: { previousImage: oldImage('1277677b-6b66-4984-a35a-052b5560e3f4'), images: [artwork('carrots')] },
  prod_cauliflower: { previousImage: oldImage('24945307-4890-4e00-9310-f66cee13965d'), images: [artwork('cauliflower')] },
  prod_burger_onions: { previousImage: oldImage('df2b8a84-cd79-47db-b4a1-2f476289e587'), images: [artwork('red-onions')] },
  prod_cucumbers: { previousImage: oldImage('f6b182ca-0930-4d88-ae18-ff1936e5b23e'), images: [artwork('cucumbers')] },
};

export const resolveProductMedia = (product: MediaProduct): ProductMedia => {
  const refresh = REFRESH[product.id];
  if (refresh && (!product.image || product.image === refresh.previousImage)) return refresh.images[0];
  const approved = refresh?.images.find(media => product.image === media.src || product.image === `https://picklenick.au${media.src}`);
  if (approved) return approved;
  if (product.image) return { src: product.image, art: false, label: 'Product photo' };
  return { src: '/brand/pickle-nick-logo.jpg', art: true, label: 'Pickle Nick' };
};

export const getProductGallery = (product: MediaProduct): readonly ProductMedia[] => {
  const primary = resolveProductMedia(product);
  const images = [primary, ...(REFRESH[product.id]?.images || [])];
  return images.filter((image, index) => images.findIndex(item => item.src === image.src) === index);
};
