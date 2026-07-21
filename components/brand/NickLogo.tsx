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

export const NICK_LOGO_SRC = '/brand/pickle-nick-logo.jpg';

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
      <span className={`nick-logo__mark ${imageClassName}`}>
        <img src={NICK_LOGO_SRC} alt="Pickle Nick" />
      </span>
      {showName ? (
        <span className={labelClassName}>
          <span className="nick-logo__name">Pickle Nick</span>
          {subtitle ? <span className="nick-logo__subtitle">{subtitle}</span> : null}
        </span>
      ) : null}
    </>
  );

  const classes = `nick-logo nick-logo--${size} ${className}`;

  return to ? (
    <Link to={to} className={classes} aria-label="Pickle Nick home">
      {content}
    </Link>
  ) : (
    <div className={classes}>{content}</div>
  );
};

export default NickLogo;
