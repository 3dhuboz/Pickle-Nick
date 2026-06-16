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

const logoSrc = '/brand/pickle-nick-logo.jpg';
const fallbackSrc = '/brand/pickle-nick-product-card-backdrop.png';

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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(244,197,109,0.14),transparent_28%),linear-gradient(135deg,rgba(244,197,109,0.08)_1px,transparent_1px),#160f0c] bg-[auto,24px_24px,auto]" />
      <img
        src={imageSrc}
        alt={product.name}
        className={`relative h-full w-full object-cover opacity-92 sepia-[.08] saturate-[.96] transition duration-700 group-hover:scale-[1.08] group-hover:sepia-0 group-hover:saturate-105 ${hasImage ? '' : 'object-[72%_50%]'} ${imageClassName}`}
        style={useBrandBackdrop ? { objectPosition: '50% 50%' } : undefined}
      />

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(5,3,2,0.1),rgba(5,3,2,0.18)_45%,rgba(5,3,2,0.72)),radial-gradient(circle_at_22%_18%,rgba(244,197,109,0.18),transparent_22%)]" />
      <div className={`pointer-events-none absolute inset-0 ${lineOnly ? 'shadow-[inset_0_-70px_90px_rgba(0,0,0,0.5)]' : 'border border-[#f4c56d]/18 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.035),inset_0_-70px_90px_rgba(0,0,0,0.5)]'}`} />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-14 bg-[linear-gradient(180deg,rgba(5,3,2,0.62),transparent)]" />
      <div className="pointer-events-none absolute -right-6 bottom-24 z-10 rotate-[-12deg] font-display text-[7rem] leading-none text-[#f4c56d]/[0.055] sm:text-[8.5rem]">
        PN
      </div>
      <div className={`pointer-events-none absolute inset-y-8 left-0 z-10 rounded-full bg-[linear-gradient(180deg,#bc4b35,#f4c56d,#5f7f32,#bc4b35)] opacity-70 ${lineOnly ? 'w-px' : 'w-2'}`} />

      <div className="absolute left-3 top-3 z-20 sm:left-4 sm:top-4">
        <div className={`rounded-full border border-[#f4c56d]/45 bg-[#0b0807] p-1 shadow-[0_14px_32px_rgba(0,0,0,0.45),0_0_0_4px_rgba(244,197,109,0.06)] ${styles.seal}`}>
          <img
            src={logoSrc}
            alt="Pickle Nick logo"
            className="h-full w-full rounded-full object-cover"
          />
        </div>
      </div>

      {styles.cornerTag && (
        <div className="absolute right-3 top-3 z-20 hidden rounded-full border border-[#f4c56d]/24 bg-[#090605]/72 px-4 py-2 text-right backdrop-blur-sm sm:block">
          <span className="block font-tribal text-[10px] font-bold uppercase tracking-[0.24em] text-[#f4c56d]/76">
            Pickle Nick
          </span>
          <span className="block font-tribal text-[9px] font-bold uppercase tracking-[0.18em] text-[#f5f0e6]/48">
            Brine House
          </span>
        </div>
      )}

      {!hideLabel && (
        <div className={`absolute z-20 text-[#f5f0e6] backdrop-blur-sm ${lineOnly ? 'bg-[#090605]/58 shadow-[0_18px_44px_rgba(0,0,0,0.32),inset_0_0_0_1px_rgba(244,197,109,0.08)]' : 'border border-[#f4c56d]/26 bg-[#090605]/86 shadow-[0_18px_44px_rgba(0,0,0,0.42)]'} ${styles.label}`}>
          <p className="font-tribal text-[10px] font-bold uppercase tracking-[0.24em] text-native-clay">
            {product.category || 'Small Batch'}
          </p>
          <p className={`mt-1 line-clamp-2 font-display leading-none text-[#f4c56d] ${styles.title}`}>
            {product.name}
          </p>
          <p className="mt-2 font-tribal text-[10px] font-bold uppercase tracking-[0.22em] text-[#f5f0e6]/62">
            Made to bite back
          </p>
        </div>
      )}

      <div className={`pointer-events-none absolute inset-x-8 bottom-0 z-10 rounded-full bg-[linear-gradient(90deg,#bc4b35,#f4c56d,#5f7f32,#bc4b35)] ${lineOnly ? 'h-px' : 'h-1'}`} />
      {children}
    </div>
  );
};

export default BrandedProductImage;
