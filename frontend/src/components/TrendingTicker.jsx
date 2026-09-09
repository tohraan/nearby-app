import React, { useEffect, useState } from 'react';
import { Star, MapPin, ChevronRight, ExternalLink } from 'lucide-react';
import { FALLBACK_PLACES } from '../lib/fallbackData.js';
import { getPlaceImage, getActionLabel } from '../lib/geo.js';

const CATEGORY_COLORS = {
  attraction: '#FCF3CF',
  culture: '#E8DAEF',
  outdoor: '#D4EFDF',
  cafe: '#E8D5C4',
  food: '#FFE8D6',
  entertainment: '#E8F8F5',
  shopping: '#FADBD8',
};

export default function TrendingTicker({ onNavigateToPlace }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const trending = [
      { id: 'fallback_burj_khalifa', name: 'Burj Khalifa', category: 'attraction', rating: 4.9, city: 'Dubai' },
      { id: 'fallback_museum_future', name: 'Museum of the Future', category: 'culture', rating: 4.8, city: 'Dubai' },
      { id: 'fallback_kite_beach', name: 'Kite Beach Sunset', category: 'outdoor', rating: 4.8, city: 'Dubai' },
      { id: 'fallback_dubai_frame', name: 'Dubai Frame Scenic View', category: 'attraction', rating: 4.7, city: 'Dubai' },
      { id: 'fallback_louvre_ad', name: 'Louvre Abu Dhabi', category: 'culture', rating: 4.9, city: 'Abu Dhabi' },
      { id: 'fallback_tom_serge', name: 'Tom & Serg Specialty Coffee', category: 'cafe', rating: 4.5, city: 'Dubai' },
    ];
    setItems(trending);
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="trending-section" style={{ marginBottom: '28px' }}>
      {/* Consolidated Section Header */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '12px' }}>
        <h2 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>
          Featured & Trending Spots
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--state-success)', display: 'inline-block' }} />
          <span>Updated 5m ago</span>
        </div>
      </div>

      {/* Horizontally Scrollable Featured Card Row */}
      <div
        style={{
          display: 'flex',
          gap: '14px',
          overflowX: 'auto',
          paddingBottom: '8px',
          scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none'
        }}
      >
        {items.map((item) => {
          const place = FALLBACK_PLACES.find(p => p.id === item.id) || item;
          const bgImg = getPlaceImage(place);
          const catBg = CATEGORY_COLORS[item.category] || '#F2F2EF';
          const ctaLabel = getActionLabel(place);

          return (
            <div
              key={item.id}
              onClick={() => onNavigateToPlace?.(item.id)}
              style={{
                width: '260px',
                height: '160px',
                flexShrink: 0,
                scrollSnapAlign: 'start',
                borderRadius: '12px',
                border: '2px solid var(--color-black)',
                position: 'relative',
                overflow: 'hidden',
                cursor: 'pointer',
                boxShadow: '4px 4px 0 var(--color-black)',
                transition: 'transform 0.2s ease, boxShadow 0.2s ease'
              }}
            >
              {/* Background Photo */}
              <img
                src={bgImg}
                alt={item.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block'
                }}
              />

              {/* Gradient Vignette Overlay */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(28,26,23,0.92) 0%, rgba(28,26,23,0.3) 60%, rgba(28,26,23,0.1) 100%)'
                }}
              />

              {/* Top Category Tag Badge */}
              <div
                style={{
                  position: 'absolute',
                  top: '10px',
                  left: '10px',
                  backgroundColor: catBg,
                  color: 'var(--color-black)',
                  border: '1.5px solid var(--color-black)',
                  borderRadius: '5px',
                  padding: '2px 8px',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'capitalize'
                }}
              >
                {item.category}
              </div>

              {/* Bottom Card Content */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '10px',
                  left: '12px',
                  right: '12px',
                  color: 'var(--color-white)'
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '17px',
                    fontWeight: 700,
                    lineHeight: 1.2,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {item.name}
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    color: 'rgba(255,255,255,0.85)',
                    marginTop: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'space-between'
                  }}
                >
                  <span>⭐ {item.rating} • {item.city}</span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-yellow)' }}>
                    {ctaLabel} →
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

