import React, { useMemo } from 'react';

export default function FlyingPlane({
  speed = 45,
  delay = 5,
  top = '14%',
  scale = 1,
  opacity = 0.2,
  className = ''
}) {
  // Bounded random offset on mount
  const randomizedDelay = useMemo(() => {
    const offset = Math.random() * 5;
    return (delay + offset).toFixed(2);
  }, [delay]);

  const animationStyle = {
    top,
    opacity,
    transform: `scale(${scale})`,
    animationDuration: `${speed}s`,
    animationDelay: `${randomizedDelay}s`
  };

  return (
    <div 
      className={`ambient-primitive ambient-plane ${className}`}
      style={animationStyle}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" className="ambient-svg">
        <path 
          fill="currentColor" 
          d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L14 19v-5.5l8 2.5z" 
          transform="rotate(90 12 12)"
        />
      </svg>
    </div>
  );
}
