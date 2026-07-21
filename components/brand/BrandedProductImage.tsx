import React from 'react';
import type { Product } from '../../types';
import { NICK_LOGO_SRC } from './NickLogo';

type BrandedProductImageProps = {
  product: Pick<Product, 'name' | 'image' | 'category'>;
  className?: string;
  imageClassName?: string;
  variant?: 'card' | 'detail';
  forceBrandBackdrop?: boolean;
  lineOnly?: boolean;
  hideLabel?: boolean;
  children?: React.ReactNode;
};

type ProductMedia = {
  src: string;
  art: boolean;
};

const PRODUCT_MEDIA: Array<{ terms: string[]; media: ProductMedia }> = [
  { terms: ['jalapeno', 'jalapeño'], media: { src: '/brand/pickle-art-roast-jalapeno.jpg', art: true } },
  { terms: ['habanero'], media: { src: '/brand/pickle-art-roast-habanero.jpg', art: true } },
  { terms: ['bourbon'], media: { src: '/brand/pickle-art-bourbon-glaze.jpg', art: true } },
  { terms: ['sweet', 'smokey', 'smoky', 'smoked'], media: { src: '/brand/pickle-art-sweet-smokey.jpg', art: true } },
  { terms: ['bread & butter', 'bread and butter'], media: { src: '/brand/pickle-art-onions.jpg', art: true } },
  { terms: ['garlic gunpowder', 'garlic'], media: { src: '/brand/pickle-art-cauliflower.jpg', art: true } },
  { terms: ['mixed veg', 'battle brine'], media: { src: '/brand/pickle-art-carrots.jpg', art: true } },
  { terms: ['carrot'], media: { src: '/brand/pickle-art-carrots.jpg', art: true } },
  { terms: ['cauliflower', 'cabbage'], media: { src: '/brand/pickle-art-cauliflower.jpg', art: true } },
  { terms: ['onion'], media: { src: '/brand/pickle-art-onions.jpg', art: true } },
  { terms: ['bundle'], media: { src: '/brand/pickle-nick-firepit-lineup.jpg', art: false } },
  { terms: ['cucumber', 'dill', 'pickle', 'brine'], media: { src: '/brand/pickle-art-cucumbers.jpg', art: true } },
];

export const resolveProductMedia = (product: Pick<Product, 'name' | 'image' | 'category'>): ProductMedia => {
  if (product.image) return { src: product.image, art: false };

  const signature = `${product.name} ${product.category || ''}`.toLowerCase();
  return PRODUCT_MEDIA.find(entry => entry.terms.some(term => signature.includes(term)))?.media
    || { src: '/brand/pickle-nick-hand-bottles.jpg', art: false };
};

const BrandedProductImage = ({
  product,
  className = '',
  imageClassName = '',
  children,
}: BrandedProductImageProps) => {
  const media = resolveProductMedia(product);

  return (
    <figure className={`product-visual ${media.art ? 'product-visual--art' : ''} ${className}`}>
      <img
        src={media.src}
        alt={product.name}
        className={`product-visual__image ${imageClassName}`}
        loading="lazy"
        decoding="async"
      />
      <img className="product-visual__logo" src={NICK_LOGO_SRC} alt="" aria-hidden="true" />
      {children}
    </figure>
  );
};

export default BrandedProductImage;
