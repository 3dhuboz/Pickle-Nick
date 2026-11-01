import React, { useState } from 'react';
import type { Product } from '../../types';
import { NICK_LOGO_SRC } from './NickLogo';
import { getProductGallery, resolveProductMedia } from '../../lib/productMedia';

export { resolveProductMedia } from '../../lib/productMedia';

type BrandedProductImageProps = {
  product: Pick<Product, 'id' | 'name' | 'image' | 'category'>;
  className?: string;
  imageClassName?: string;
  variant?: 'card' | 'detail';
  forceBrandBackdrop?: boolean;
  lineOnly?: boolean;
  hideLabel?: boolean;
  children?: React.ReactNode;
};

const BrandedProductImage = ({
  product,
  className = '',
  imageClassName = '',
  variant = 'card',
  children,
}: BrandedProductImageProps) => {
  const [selection, setSelection] = useState<{ productId: string; src: string } | null>(null);
  const gallery = getProductGallery(product);
  const media = variant === 'detail' && selection?.productId === product.id
    ? gallery.find(image => image.src === selection.src) || gallery[0]
    : resolveProductMedia(product);
  const hasGallery = variant === 'detail' && gallery.length > 1;

  return (
    <figure className={`product-visual ${media.art ? 'product-visual--art' : ''} ${variant === 'detail' ? 'product-visual--detail' : ''} ${className}`}>
      <div className="product-visual__stage">
        <img
          src={media.src}
          alt={product.name}
          className={`product-visual__image ${imageClassName}`}
          loading={variant === 'detail' ? 'eager' : 'lazy'}
          decoding="async"
        />
        <img className="product-visual__logo" src={NICK_LOGO_SRC} alt="" aria-hidden="true" />
      </div>
      {hasGallery && (
        <figcaption className="product-gallery">
          <div className="product-gallery__thumbnails" aria-label={`${product.name} images`}>
            {gallery.map(image => (
              <button
                type="button"
                key={image.src}
                aria-label={`View ${image.label.toLowerCase()} for ${product.name.trim()}`}
                aria-pressed={media.src === image.src}
                onClick={() => setSelection({ productId: product.id, src: image.src })}
              >
                <img src={image.src} alt="" loading="lazy" decoding="async" />
              </button>
            ))}
          </div>
          <span className="product-gallery__caption" aria-live="polite">{media.label}</span>
        </figcaption>
      )}
      {children}
    </figure>
  );
};

export default BrandedProductImage;
