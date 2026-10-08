import React from 'react';

/**
 * Logo Resmi Dell (Vektor SVG Asli Wikimedia / Dell Technologies)
 * Biru Resmi: #0076CE
 */
export const DellLogo = ({ size = 18, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 300 300"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    aria-label="Dell Logo"
  >
    <g transform="translate(-318.33375,-439.74274)">
      <g transform="matrix(4.579965,0,0,-4.579965,468.34291,456.8459)">
        <path
          fill="#0076CE"
          d="m 0,0 c -8.01,0 -15.264,-3.249 -20.516,-8.505 -5.254,-5.244 -8.501,-12.502 -8.501,-20.516 0,-8.008 3.247,-15.261 8.501,-20.507 5.252,-5.249 12.506,-8.504 20.516,-8.504 8.012,0 15.27,3.255 20.514,8.504 5.252,5.246 8.492,12.499 8.492,20.507 0,8.014 -3.24,15.272 -8.492,20.516 C 15.27,-3.249 8.012,0 0,0 m 0,3.516 c 17.965,0 32.531,-14.568 32.531,-32.537 0,-17.963 -14.566,-32.529 -32.531,-32.529 -17.963,0 -32.535,14.566 -32.535,32.529 0,17.969 14.572,32.537 32.535,32.537"
        />
      </g>
      <g transform="matrix(4.579965,0,0,-4.579965,397.87238,588.54693)">
        <path
          fill="#0076CE"
          d="m 0,0 c 0,1.896 -1.258,2.973 -3.039,2.973 l -1.09,0 0,-5.948 1.059,0 C -1.414,-2.975 0,-2.075 0,0 M 19.389,-2.14 11.359,-8.463 4.02,-2.685 C 2.961,-5.229 0.402,-6.996 -2.545,-6.996 l -6.281,0 0,13.992 6.281,0 c 3.293,0 5.666,-2.094 6.563,-4.325 l 7.341,5.772 2.719,-2.14 -6.728,-5.288 1.293,-1.012 6.726,5.285 2.723,-2.134 -6.727,-5.294 1.291,-1.014 6.733,5.295 0,4.855 4.881,0 0,-9.908 4.869,0 0,-4.101 -9.75,0 0,4.873 z m 15.933,-0.774 4.867,0 0,-4.099 -9.753,0 0,14.009 4.886,0 0,-9.91 z"
        />
      </g>
    </g>
  </svg>
);

/**
 * Logo Resmi HP (Vektor SVG Asli Wikimedia / Hewlett-Packard)
 * Cyan/Biru Resmi: #0096D6
 */
export const HpLogo = ({ size = 18, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    aria-label="HP Logo"
  >
    <g transform="matrix(1.25,0,0,-1.25,-67.822513,702.43127)">
      <g transform="matrix(1.5180439,0,0,1.5180439,-28.149474,-249.71011)">
        <g transform="translate(106.93201,508.32201)">
          <path
            fill="#0096D6"
            d="m 0,0 c 0,14.524 -11.773,26.297 -26.297,26.297 -0.396,0 -0.79,-0.01 -1.182,-0.028 l -5.379,-14.784 4.685,0 c 2.787,0 4.289,-2.146 3.335,-4.767 l -6.635,-18.234 -5.571,10e-4 7.12,19.544 -4.189,0 -7.12,-19.544 -5.573,0 8.372,23 10e-4,0 5.036,13.841 C -44.471,22.228 -52.594,12.063 -52.594,0 c 0,-12.421 8.613,-22.83 20.192,-25.583 l 4.88,13.411 0.004,0 8.609,23.657 10.261,0 c 2.79,0 4.291,-2.146 3.337,-4.767 l -5.83,-16.015 c -0.444,-1.22 -1.869,-2.218 -3.167,-2.218 l -7.396,0 -5.374,-14.77 c 0.259,-0.007 0.52,-0.012 0.781,-0.012 C -11.773,-26.297 0,-14.523 0,0"
          />
        </g>
        <g transform="translate(96.546997,516.36501)">
          <path fill="#0096D6" d="m 0,0 -4.187,0 -5.864,-16.089 4.187,0 L 0,0" />
        </g>
      </g>
    </g>
  </svg>
);

/**
 * Komponen Brand Badge terpadu dengan Logo Asli
 * @param {{ brand: string, size?: number, showLabel?: boolean, className?: string }} props
 */
export default function BrandLogo({ brand = '', size = 18, showLabel = true, className = '' }) {
  const normBrand = String(brand || '').trim().toUpperCase();
  const logoOnlyClass = !showLabel ? 'logo-only' : '';

  if (normBrand === 'DELL') {
    return (
      <span className={`brand-badge-item brand-dell ${logoOnlyClass} ${className}`.trim()} title="Brand: DELL">
        <DellLogo size={size} />
        {showLabel && <span className="brand-badge-name">DELL</span>}
      </span>
    );
  }

  if (normBrand === 'HP') {
    return (
      <span className={`brand-badge-item brand-hp ${logoOnlyClass} ${className}`.trim()} title="Brand: HP">
        <HpLogo size={size} />
        {showLabel && <span className="brand-badge-name">HP</span>}
      </span>
    );
  }

  if (normBrand === 'DELL LAINNYA') {
    return (
      <span className={`brand-badge-item brand-other ${logoOnlyClass} ${className}`.trim()} title="Brand: DELL (Lainnya / Aksesoris)">
        <DellLogo size={size} />
        {showLabel && <span className="brand-badge-name">DELL LAINNYA</span>}
      </span>
    );
  }

  // Fallback brand lain jika ada
  return (
    <span className={`brand-badge-item brand-generic ${logoOnlyClass} ${className}`.trim()} title={`Brand: ${brand}`}>
      <span style={{ width: size - 8, height: size - 8, borderRadius: '50%', background: '#64748B', display: 'inline-block' }} />
      {showLabel && <span className="brand-badge-name">{brand || '-'}</span>}
    </span>
  );
}
