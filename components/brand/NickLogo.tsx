import React from 'react';
import { Link } from 'react-router-dom';

type NickLogoProps = {
  className?: string;
  imageClassName?: string;
  labelClassName?: string;
  showName?: boolean;
  subtitle?: string;
  to?: string;
  size?: 'sm' | 'md' | 'lg';
};

const sizeClasses = {
  sm: 'h-10 w-10',
  md: 'h-14 w-14',
  lg: 'h-20 w-20',
};

const NICK_LOGO_SRC = '/brand/pickle-nick-seal-made-to-bite-back.png';

const NickLogo = ({
  className = '',
  imageClassName = '',
  labelClassName = '',
  showName = false,
  subtitle,
  to,
  size = 'md',
}: NickLogoProps) => {
  const content = (
    <>
      <span className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#f4c56d]/35 bg-[#f1dfb8] p-1 shadow-[0_0_32px_rgba(244,197,109,0.18)] ${sizeClasses[size]} ${imageClassName}`}>
        <img src={NICK_LOGO_SRC} alt="Pickle Nick Logo" className="h-full w-full rounded-full object-cover sepia-[.12]" />
      </span>
      {showName && (
        <span className={labelClassName}>
          <span className="block font-display text-[#f4c56d]">Pickle Nick</span>
          {subtitle && (
            <span className="mt-1 block font-tribal text-[10px] font-bold uppercase tracking-[0.24em] text-native-clay">
              {subtitle}
            </span>
          )}
        </span>
      )}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={`inline-flex items-center gap-3 ${className}`}>
        {content}
      </Link>
    );
  }

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {content}
    </div>
  );
};

export default NickLogo;
