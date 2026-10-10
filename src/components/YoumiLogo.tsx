import React from 'react';

interface YoumiLogoProps {
  variant?: 'full' | 'header' | 'icon' | 'badge';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isDark?: boolean;
  className?: string;
  showTagline?: boolean;
}

export const YoumiLogo: React.FC<YoumiLogoProps> = ({
  variant = 'header',
  size = 'md',
  isDark = false,
  className = '',
  showTagline = true,
}) => {
  // Color tokens matching the official brand logo
  const navyColor = isDark ? '#FFFFFF' : '#002B66';
  const orangeColor = '#FF7000';
  const subtextColor = isDark ? '#E2E8F0' : '#002B66';

  // Size configurations
  const heightMap = {
    sm: 'h-7',
    md: 'h-10',
    lg: 'h-14',
    xl: 'h-20',
  };

  if (variant === 'icon') {
    return (
      <svg
        viewBox="0 0 140 140"
        className={`${heightMap[size]} w-auto ${className}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <g transform="translate(5, 5)">
          {/* Cart Base Line & Handle */}
          <path
            d="M 15 25 L 32 25 C 37 25, 40 28, 42 34 L 56 81 C 58 87, 63 91, 70 91 L 109 91 C 116 91, 121 86, 122 79 L 126 50"
            fill="none"
            stroke={navyColor}
            strokeWidth="12"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Basket Goods */}
          <g fill={orangeColor}>
            <circle cx="60" cy="37" r="7.5" />
            <circle cx="76" cy="33" r="8.5" />
            <circle cx="93" cy="37" r="8" />
            <circle cx="54" cy="52" r="8.5" />
            <circle cx="72" cy="50" r="9.5" />
            <circle cx="90" cy="52" r="7.5" />
            <circle cx="106" cy="47" r="6.5" />
            <circle cx="64" cy="67" r="8" />
            <circle cx="81" cy="68" r="8.5" />
            <circle cx="98" cy="66" r="7.5" />
          </g>
          {/* Wheels */}
          <circle cx="62" cy="113" r="11" fill={orangeColor} />
          <circle cx="108" cy="113" r="11" fill={orangeColor} />
        </g>
      </svg>
    );
  }

  return (
    <div className={`flex items-center justify-center ${className} select-none dir-ltr`}>
      <img
        src="/logo.png"
        alt="Youmi B2B - منصة التجارة بين الشركات"
        className={`${heightMap[size]} w-auto max-w-full object-contain`}
        loading="eager"
        decoding="async"
      />
    </div>
  );
};
