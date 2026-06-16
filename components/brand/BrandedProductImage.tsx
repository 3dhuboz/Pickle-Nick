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

const getPosterTheme = (product: Pick<Product, 'name' | 'image' | 'category'>) => {
  const signature = `${product.category || ''} ${product.name}`.toLowerCase();

  const themes = [
    {
      match: ['habanero', 'roast'],
      accent: 'rgba(159,59,46,0.3)',
      ember: 'rgba(214,102,68,0.2)',
      wash: 'rgba(106,46,29,0.3)',
      line: '#cf6a49',
      highlight: '#f2c27a',
      objectPosition: '72% 48%',
      sealRotate: '-7deg',
      sealOpacity: 0.13,
    },
    {
      match: ['jalapeno', 'cowboy', 'sweet', 'smokey', 'bourbon'],
      accent: 'rgba(111,74,44,0.28)',
      ember: 'rgba(203,140,87,0.19)',
      wash: 'rgba(81,43,24,0.26)',
      line: '#b06f48',
      highlight: '#f5d39b',
      objectPosition: '58% 48%',
      sealRotate: '4deg',
      sealOpacity: 0.11,
    },
    {
      match: ['cucumber', 'pickle', 'mango', 'veg', 'carrot', 'cauliflower'],
      accent: 'rgba(96,111,66,0.22)',
      ember: 'rgba(176,148,93,0.18)',
      wash: 'rgba(52,56,35,0.24)',
      line: '#8f9c60',
      highlight: '#dfcb88',
      objectPosition: '46% 50%',
      sealRotate: '-4deg',
      sealOpacity: 0.12,
    },
  ];

  return themes.find(theme => theme.match.some(term => signature.includes(term))) || {
    accent: 'rgba(122,78,45,0.26)',
    ember: 'rgba(222,182,114,0.17)',
    wash: 'rgba(62,39,25,0.24)',
    line: '#b68857',
    highlight: '#f1d1a0',
    objectPosition: '50% 50%',
    sealRotate: '-2deg',
    sealOpacity: 0.11,
  };
};

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
  const theme = getPosterTheme(product);
  const mediaStyle = useBrandBackdrop ? { objectPosition: theme.objectPosition } : undefined;

  return (
    <div
      className={`relative h-full w-full overflow-hidden bg-[#160f0c] ${className}`}
      data-pickle-nick-branded-media
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(245,236,218,0.12),transparent_24%),radial-gradient(circle_at_78%_24%,rgba(111,74,44,0.16),transparent_22%),repeating-linear-gradient(180deg,transparent_0_18px,rgba(245,236,218,0.035)_19px_20px),#160f0c]" />
      <div
        className="absolute inset-0 z-[1] mix-blend-screen"
        style={{
          backgroundImage: `radial-gradient(circle at 18% 22%, ${theme.accent}, transparent 22%), radial-gradient(circle at 82% 78%, ${theme.ember}, transparent 26%), linear-gradient(145deg, rgba(7,4,2,0.08), ${theme.wash} 54%, rgba(7,4,2,0.22))`,
        }}
      />
      <img
        src={sealSrc}
        alt=""
        aria-hidden="true"
        className={`pointer-events-none absolute z-[1] rounded-full opacity-[0.09] mix-blend-screen ${variant === 'detail' ? 'right-4 top-5 w-24 sm:w-32' : 'right-3 top-3 w-16 sm:w-20'}`}
        style={{ transform: `rotate(${theme.sealRotate})`, opacity: theme.sealOpacity }}
      />
      <img
        src={imageSrc}
        alt={product.name}
        className={`relative h-full w-full object-cover opacity-92 sepia-[.08] saturate-[.96] transition duration-700 group-hover:scale-[1.08] group-hover:sepia-0 group-hover:saturate-105 ${hasImage ? '' : 'object-[72%_50%]'} ${imageClassName}`}
        style={mediaStyle}
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

      <div
        className={`pointer-events-none absolute inset-x-8 bottom-0 z-10 rounded-full ${lineOnly ? 'h-px' : 'h-[3px]'}`}
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(159,59,46,0.08), ${theme.line}, ${theme.highlight}, rgba(159,59,46,0.08))`,
        }}
      />
      {children}
    </div>
  );
};

export default BrandedProductImage;
