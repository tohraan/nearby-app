import React, { useMemo } from 'react';

export default function MovingVehicle({
  speed = 20,
  direction = 'ltr',
  delay = 0,
  scale = 1,
  opacity = 0.3,
  bottom = '11%',
  className = ''
}) {
  // Add a small randomized delay offset on mount (0 to 4s) so loops are staggered cleanly
  const randomizedDelay = useMemo(() => {
    const offset = Math.random() * 4;
    return (delay + offset).toFixed(2);
  }, [delay]);

  const animationStyle = {
    bottom,
    opacity,
    transform: `scale(${scale}) ${direction === 'rtl' ? 'scaleX(-1)' : ''}`,
    animationDuration: `${speed}s`,
    animationDelay: `${randomizedDelay}s`,
    animationDirection: direction === 'rtl' ? 'reverse' : 'normal'
  };

  return (
    <div 
      className={`ambient-primitive ambient-car ${className}`}
      style={animationStyle}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 12" className="ambient-svg">
        <path 
          fill="currentColor" 
          d="M19 4h-3.5L13 1.5A1.5 1.5 0 0 0 11.8 1H6.2a1.5 1.5 0 0 0-1.2.6L2.5 4H2a2 2 0 0 0-2 2v3h1.5a2.5 2.5 0 0 0 4.8 0h9.4a2.5 2.5 0 0 0 4.8 0H22V6a2 2 0 0 0-2-2zM4.8 8.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm14.4 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2zM5.3 4l1.8-2h4.8l1.8 2H5.3z"
        />
      </svg>
    </div>
  );
}
