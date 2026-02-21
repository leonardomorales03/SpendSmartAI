import React from 'react';

export function AppLogo({ className = "w-10 h-10", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      viewBox="0 0 512 512" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id="brand_gradient_logo" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4F46E5"/>
          <stop offset="1" stopColor="#312E81"/>
        </linearGradient>

        <linearGradient id="card_gradient_logo" x1="180" y1="120" x2="340" y2="300" gradientUnits="userSpaceOnUse">
          <stop stopColor="#34D399"/>
          <stop offset="1" stopColor="#10B981"/>
        </linearGradient>

        <filter id="shadow_soft_logo" x="0" y="0" width="512" height="512" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="12" stdDeviation="16" floodColor="#000000" floodOpacity="0.25"/>
        </filter>
      </defs>

      <rect width="512" height="512" rx="128" fill="url(#brand_gradient_logo)"/>

      <g transform="translate(0, -20)">
        <rect x="146" y="140" width="220" height="140" rx="16" fill="url(#card_gradient_logo)" filter="url(#shadow_soft_logo)">
           <animateTransform attributeName="transform" type="translate" values="0 0; 0 -10; 0 0" dur="4s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1"/>
        </rect>
        <rect x="170" y="165" width="40" height="30" rx="4" fill="#FFFFFF" fillOpacity="0.3"/>
        <circle cx="330" cy="180" r="12" fill="#FFFFFF" fillOpacity="0.3"/>
      </g>

      <path d="M116 220C116 197.909 133.909 180 156 180H356C378.091 180 396 197.909 396 220V340C396 362.091 378.091 380 356 380H156C133.909 380 116 362.091 116 340V220Z" fill="#6366F1"/>
      
      <path d="M116 220C116 197.909 133.909 180 156 180H356C378.091 180 396 197.909 396 220V260C396 260 300 240 256 240C212 240 116 260 116 260V220Z" fill="#818CF8" fillOpacity="0.4"/>

      <g transform="translate(340, 320)">
         <path d="M20 0L24 10L34 14L24 18L20 28L16 18L6 14L16 10L20 0Z" fill="#FBBF24">
           <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite"/>
           <animateTransform attributeName="transform" type="scale" values="1;1.2;1" dur="2s" repeatCount="indefinite"/>
         </path>
         <path d="M-10 20L-8 25L-3 27L-8 29L-10 34L-12 29L-17 27L-12 25L-10 20Z" fill="#FBBF24" fillOpacity="0.7">
           <animate attributeName="opacity" values="0;1;0" dur="3s" repeatCount="indefinite" begin="0.5s"/>
         </path>
      </g>
    </svg>
  );
}
