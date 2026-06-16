import React from 'react';
import type { Product } from '../../types';

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

const fallbackSrc = '/brand/pickle-nick-product-card-backdrop.png';
const sealSrc = '/brand/pickle-nick-seal-made-to-bite-back.png';

const variantStyles = {
  card: {
    seal: 'h-16 w-16 sm:h-[4.6rem] sm:w-[4.6rem]',
    label: 'left-3 right-3 bottom-3 rounded-[1.35rem] px-4 py-3',
    title: 'text-xl sm:text-2xl',
    cornerTag: false,
  },
  detail: {
    seal: 'h-20 w-20 sm:h-24 sm:w-24',
    label: 'left-4 right-4 bottom-4 rounded-[1.55rem] px-5 py-4 sm:left-6 sm:right-6 sm:bottom-6',
    title: 'text-2xl sm:text-4xl',
    cornerTag: true,
  },
};

const BrandedProductImage = ({
  product,
  className = '',
  imageClassName = '',
  variant = 'card',
  forceBrandBackdrop = false,
  lineOnly = false,
  hideLabel = false,
  children,
}: BrandedProductImageProps) => {
  const styles = variantStyles[variant];
  const hasImage = Boolean(product.image);
  const useBrandBackdrop = forceBrandBackdrop || !hasImage;
  const imageSrc = useBrandBackdrop ? fallbackSrc : product.image;

  return (
    <div
      className={`relative h-full w-full overflow-hidden bg-[#160f0c] ${className}`}
      data-pickle-nick-branded-media
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(245,236,218,0.12),transparent_24%),radial-gradient(circle_at_78%_24%,rgba(111,74,44,0.16),transparent_22%),repeating-linear-gradient(180deg,transparent_0_18px,rgba(245,236,218,0.035)_19px_20px),#160f0c]" />
      <img
        src={sealSrc}
        alt=""
        aria-hidden="true"
        className={`pointer-events-none absolute z-[1] rounded-full opacity-[0.09] mix-blend-screen ${variant === 'detail' ? 'right-4 top-5 w-24 sm:w-32' : 'right-3 top-3 w-16 sm:w-20'}`}
      />
      <img
        src={imageSrc}
        alt={product.name}
        className={`relative h-full w-full object-cover opacity-92 sepia-[.08] saturate-[.96] transition duration-700 group-hover:scale-[1.08] group-hover:sepia-0 group-hover:saturate-105 ${hasImage ? '' : 'object-[72%_50%]'} ${imageClassName}`}
        style={useBrandBackdrop ? { objectPosition: '50% 50%' } : undefined}
      />

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(5,3,2,0.08),rgba(5,3,2,0.16)_44%,rgba(5,3,2,0.68)),radial-gradient(circle_at_22%_18%,rgba(245,236,218,0.12),transparent_22%)]" />
      <div className={`pointer-events-none absolute inset-0 ${lineOnly ? 'shadow-[inset_0_-70px_90px_rgba(0,0,0,0.5)]' : 'border border-[#f4c56d]/18 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.035),inset_0_-70px_90px_rgba(0,0,0,0.5)]'}`} />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-14 bg-[linear-gradient(180deg,rgba(5,3,2,0.62),transparent)]" />

      {styles.cornerTag && (
        <div className="absolute right-3 top-3 z-20 hidden rounded-full border border-[#f5ecda]/18 bg-[#090605]/72 px-4 py-2 text-right backdrop-blur-sm sm:block">
          <span className="block font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-[#f5ecda]/82">
            Pickle Nick
          </span>
          <span className="block font-sans text-[9px] font-medium uppercase tracking-[0.18em] text-[#b69273]">
            Made to bite back
          </span>
        </div>
      )}

      {!hideLabel && (
        <div className={`absolute z-20 text-[#f5f0e6] backdrop-blur-sm ${lineOnly ? 'bg-[#090605]/58 shadow-[0_18px_44px_rgba(0,0,0,0.32),inset_0_0_0_1px_rgba(244,197,109,0.08)]' : 'border border-[#f4c56d]/26 bg-[#090605]/86 shadow-[0_18px_44px_rgba(0,0,0,0.42)]'} ${styles.label}`}>
          <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.22em] text-[#b69273]">
            {product.category || 'Small Batch'}
          </p>
          <p className={`mt-1 line-clamp-2 font-display leading-none text-[#f4c56d] ${styles.title}`}>
            {product.name}
          </p>
          <p className="mt-2 font-sans text-[10px] font-medium uppercase tracking-[0.18em] text-[#f5f0e6]/58">
            Made to bite back
          </p>
        </div>
      )}

      <div className={`pointer-events-none absolute inset-x-8 bottom-0 z-10 rounded-full bg-[linear-gradient(90deg,rgba(159,59,46,0.1),#6f4a2c,#e8d7b2,rgba(159,59,46,0.1))] ${lineOnly ? 'h-px' : 'h-[3px]'}`} />
      {children}
    </div>
  );
};

export default BrandedProductImage;
