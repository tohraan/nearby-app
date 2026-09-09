import React, { useEffect, useState } from 'react';
import { Flame } from 'lucide-react';
import { FALLBACK_PLACES } from '../lib/fallbackData.js';
import { getPlaceImage } from '../lib/geo.js';

export default function TrendingTicker({ onNavigateToPlace }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const trending = [
      { id: 'fallback_burj_khalifa', name: 'Burj Khalifa', category: 'attraction', tag: '🔥 POPULAR SPOT' },
      { id: 'fallback_kite_beach', name: 'Kite Beach Sunset & Cafes', category: 'outdoor', tag: '🌿 TRENDING OUTDOOR' },
      { id: 'fallback_museum_future', name: 'Museum of the Future', category: 'culture', tag: '⭐ MUST VISIT' },
      { id: 'fallback_dubai_frame', name: 'Dubai Frame Scenic View', category: 'attraction', tag: '📷 ICONIC PHOTO SPOT' },
      { id: 'fallback_jebel_jais', name: 'Jebel Jais Drive & Peak', category: 'outdoor', tag: '⛰️ ADVENTURE ROAD TRIP' },
      { id: 'fallback_al_serkal', name: 'Alserkal Avenue Art & Coffee', category: 'cafe', tag: '☕ ARTISAN COFFEE' },
    ];
    setItems(trending);
  }, []);

  if (items.length === 0) return null;

  const loopItems = [...items, ...items, ...items];

  return (
    <div
      className="trending-ticker"
      style={{
        width: '100%',
        height: '44px',
        maxHeight: '44px',
        backgroundColor: 'var(--color-black)',
        color: 'var(--color-paper)',
        border: '3px solid var(--color-black)',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        position: 'relative',
        boxShadow: '4px 4px 0 var(--color-black)',
        marginBottom: '16px',
        boxSizing: 'border-box'
      }}
    >
      <div
        className="trending-ticker__badge"
        style={{
          backgroundColor: 'var(--color-yellow)',
          color: 'var(--color-black)',
          fontSize: '11px',
          fontWeight: 900,
          letterSpacing: '0.08em',
          padding: '0 12px',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          whiteSpace: 'nowrap',
          borderRight: '2px solid var(--color-black)',
          zIndex: 2,
          flexShrink: 0
        }}
      >
        <Flame size={14} color="var(--color-black)" />
        <span>TRENDING NOW</span>
      </div>

      <div
        className="trending-ticker__track-container"
        style={{ flex: 1, overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', height: '100%' }}
      >
        <div
          className="trending-ticker__track"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            whiteSpace: 'nowrap',
            height: '100%',
            animation: 'tickerScroll 25s linear infinite',
            willChange: 'transform'
          }}
        >
          {loopItems.map((item, idx) => {
            const place = FALLBACK_PLACES.find(p => p.id === item.id) || item;
            return (
              <div
                key={`${item.id}-${idx}`}
                className="trending-ticker__item"
                onClick={() => onNavigateToPlace?.(item.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  height: '100%',
                  flexShrink: 0,
                  padding: '2px 8px',
                  whiteSpace: 'nowrap'
                }}
              >
                <img
                  src={getPlaceImage(place)}
                  alt={item.name}
                  style={{
                    width: '26px',
                    height: '26px',
                    minWidth: '26px',
                    minHeight: '26px',
                    maxWidth: '26px',
                    maxHeight: '26px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '1.5px solid var(--color-yellow)',
                    flexShrink: 0,
                    display: 'block'
                  }}
                />
                <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--color-yellow)', textTransform: 'uppercase' }}>{item.tag}</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-paper)' }}>{item.name}</span>
                <span style={{ color: 'var(--color-gray-500)', fontSize: '12px', marginLeft: '8px' }}>•</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
