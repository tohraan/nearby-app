import React, { useState } from 'react';
import { getPlaceImage, hasRealImage, getVerticalForCategory, CATEGORY_EMOJI } from '../lib/geo.js';

/**
 * VenueImage.jsx — Data-driven Venue Imagery Component
 * Renders verified real venue photos with skeleton shimmer loading & corner attribution.
 * When no real photo exists or image load fails, renders an honest, vertical-tinted category placeholder.
 */
export default function VenueImage({
  place,
  alt,
  style = {},
  className = '',
  aspectRatio = '16/9',
  height = '100%',
  width = '100%',
  showAttribution = true,
  onClick,
}) {
  const realUrl = getPlaceImage(place);
  const isReal = hasRealImage(place) && realUrl != null;

  const [loading, setLoading] = useState(isReal);
  const [error, setError] = useState(!isReal);

  const vertical = getVerticalForCategory(place?.category);
  const categoryEmoji = CATEGORY_EMOJI[place?.category] || '📍';

  const attributionLabel = place?.photoAttribution || (place?.sourceType === 'official' ? 'Official Photo' : 'via Google');

  return (
    <div
      className={`venue-image-container ${className}`}
      onClick={onClick}
      style={{
        position: 'relative',
        width: width,
        height: height,
        overflow: 'hidden',
        backgroundColor: `var(--tint-${vertical === 'eat_drink' ? 'eat' : vertical}-bg, var(--color-cream))`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
    >
      {/* 1. Real Photo Rendering */}
      {!error && realUrl ? (
        <>
          {/* Skeleton Shimmer Loading Overlay */}
          {loading && (
            <div
              className="skeleton"
              style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                zIndex: 2,
                borderRadius: 0,
              }}
            />
          )}

          <img
            src={realUrl}
            alt={alt || place?.name || 'Venue'}
            onLoad={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setError(true);
            }}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              opacity: loading ? 0 : 1,
              transition: 'opacity 200ms ease-out',
            }}
          />

          {/* Unobtrusive Corner Attribution Label */}
          {showAttribution && !loading && (
            <div
              style={{
                position: 'absolute',
                bottom: '6px',
                right: '6px',
                backgroundColor: 'rgba(0, 0, 0, 0.65)',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '10px',
                fontWeight: 600,
                padding: '2px 6px',
                borderRadius: '4px',
                fontFamily: 'var(--font-secondary)',
                backdropFilter: 'blur(4px)',
                letterSpacing: '0.02em',
                zIndex: 3,
                pointerEvents: 'none',
              }}
            >
              {attributionLabel}
            </div>
          )}
        </>
      ) : (
        /* 2. Honest Fallback Placeholder State (Vertical Tint + Large Category Icon) */
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            backgroundColor: `var(--tint-${vertical === 'eat_drink' ? 'eat' : vertical}-bg, var(--color-cream))`,
            border: `1.5px solid var(--tint-${vertical === 'eat_drink' ? 'eat' : vertical}-border, var(--border-default))`,
            borderRadius: 'inherit',
            userSelect: 'none',
          }}
        >
          <span style={{ fontSize: '42px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>
            {categoryEmoji}
          </span>
        </div>
      )}
    </div>
  );
}
