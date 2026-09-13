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
    <div className={`flex flex-col items-start justify-center ${className} select-none dir-ltr`}>
      <svg
        viewBox="0 0 470 165"
        className={`${heightMap[size]} w-auto drop-shadow-xs`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@800;900&family=Comfortaa:wght@700&display=swap');
            .youmi-wordmark { font-family: 'Comfortaa', 'Fredoka', 'Quicksand', sans-serif; font-weight: 700; }
            .youmi-arabic { font-family: 'Cairo', sans-serif; font-weight: 800; }
            .youmi-b2b { font-family: 'Cairo', 'Comfortaa', sans-serif; font-weight: 900; }
          `}</style>
        </defs>

        {/* 1. CART ICON & INTEGRATED 'Y' HANDLE */}
        <g transform="translate(5, 10)">
          {/* Cart Frame Line */}
          <path
            d="M 12 30 L 28 30 C 33 30, 36 33, 38 39 L 52 86 C 54 92, 59 96, 66 96 L 105 96 C 112 96, 117 91, 118 84 L 122 55"
            fill="none"
            stroke={navyColor}
            strokeWidth="12"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Cart Contents in Orange */}
          <g fill={orangeColor}>
            <circle cx="56" cy="42" r="7" />
            <circle cx="72" cy="38" r="8" />
            <circle cx="89" cy="42" r="7.5" />
            <circle cx="50" cy="57" r="8" />
            <circle cx="68" cy="55" r="9" />
            <circle cx="86" cy="57" r="7" />
            <circle cx="102" cy="52" r="6" />
            <circle cx="60" cy="72" r="7.5" />
            <circle cx="77" cy="73" r="8" />
            <circle cx="94" cy="71" r="7" />
          </g>

          {/* Cart Wheels in Orange */}
          <circle cx="58" cy="118" r="11" fill={orangeColor} />
          <circle cx="104" cy="118" r="11" fill={orangeColor} />
        </g>

        {/* 2. WORDMARK "Youmi" */}
        <g transform="translate(102, 10)">
          {/* Y */}
          <path
            d="M 28 20 L 52 58 L 52 98 L 72 98 L 72 58 L 96 20 L 71 20 L 62 40 L 53 20 Z"
            fill={navyColor}
          />
          {/* o */}
          <path
            d="M 132 38 C 114 38, 100 52, 100 69 C 100 86, 114 100, 132 100 C 150 100, 164 86, 164 69 C 164 52, 150 38, 132 38 Z M 132 57 C 139 57, 145 62, 145 69 C 145 76, 139 81, 132 81 C 125 81, 119 76, 119 69 C 119 62, 125 57, 132 57 Z"
            fill={navyColor}
          />
          {/* u */}
          <path
            d="M 175 40 L 175 78 C 175 84, 180 88, 186 88 C 192 88, 197 84, 197 78 L 197 40 L 216 40 L 216 78 C 216 93, 203 100, 186 100 C 169 100, 156 93, 156 78 L 156 40 Z"
            fill={navyColor}
          />
          {/* m */}
          <path
            d="M 226 40 L 226 98 L 244 98 L 244 62 C 248 57, 254 56, 258 60 L 258 98 L 276 98 L 276 62 C 280 57, 286 56, 290 60 L 290 98 L 308 98 L 308 56 C 308 44, 296 38, 283 42 C 275 45, 270 51, 267 55 C 263 48, 257 42, 246 42 C 238 42, 230 46, 226 53 L 226 40 Z"
            fill={navyColor}
          />
          {/* i stem */}
          <path d="M 318 40 L 318 98 L 338 98 L 338 40 Z" fill={navyColor} />
          {/* i dot (Navy ring + Orange core) */}
          <circle cx="328" cy="22" r="11" fill={navyColor} />
          <circle cx="328" cy="22" r="6.5" fill={orangeColor} />
        </g>

        {/* 3. TAGLINE ARABIC & B2B BADGE */}
        {(variant === 'full' || showTagline) && (
          <g transform="translate(85, 126)">
            {/* Arabic Tagline */}
            <text x="0" y="24" className="youmi-arabic" fill={subtextColor} fontSize="25" direction="rtl">
              منصة التجارة بين الشركات
            </text>
            {/* Orange B2B Badge */}
            <rect x="295" y="0" width="62" height="34" rx="10" fill={orangeColor} />
            <text x="326" y="23" className="youmi-b2b" fill="#FFFFFF" fontSize="18" textAnchor="middle">
              B2B
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};
