import React, { useMemo } from 'react';

export default function DriftingCloud({
  speed = 50,
  delay = 0,
  top = '10%',
  scale = 1,
  opacity = 0.15,
  className = ''
}) {
  // Add randomized delay offset (0 to 5s)
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
      className={`ambient-primitive ambient-cloud ${className}`}
      style={animationStyle}
      aria-hidden="true"
    >
      <svg viewBox="0 0 32 16" className="ambient-svg">
        <path 
          fill="currentColor" 
          d="M26 12A4 4 0 0 0 26 4 6 6 0 0 0 15 2.5 5.5 5.5 0 0 0 6 7.5 4.5 4.5 0 0 0 6.5 16H26z"
        />
      </svg>
    </div>
  );
}
