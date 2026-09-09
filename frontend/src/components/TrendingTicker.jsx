import React, { useEffect, useState } from 'react';
import { Flame, Star, Sparkles, MapPin, ExternalLink, ChevronRight } from 'lucide-react';
import { FALLBACK_PLACES } from '../lib/fallbackData.js';
import { getPlaceImage, getActionableUrl } from '../lib/geo.js';

export default function TrendingTicker({ onNavigateToPlace }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const trending = [
      { id: 'fallback_burj_khalifa', name: 'Burj Khalifa', category: 'attraction', tag: '🔥 #1 POPULAR SPOT', rating: 4.9, city: 'Dubai' },
      { id: 'fallback_museum_future', name: 'Museum of the Future', category: 'culture', tag: '⭐ MUST VISIT', rating: 4.8, city: 'Dubai' },
      { id: 'fallback_kite_beach', name: 'Kite Beach Sunset & Cafes', category: 'outdoor', tag: '🌿 TRENDING OUTDOOR', rating: 4.8, city: 'Dubai' },
      { id: 'fallback_dubai_frame', name: 'Dubai Frame Scenic View', category: 'attraction', tag: '📷 ICONIC PHOTO SPOT', rating: 4.7, city: 'Dubai' },
      { id: 'fallback_louvre_ad', name: 'Louvre Abu Dhabi', category: 'culture', tag: '🏛️ ART & CULTURE', rating: 4.9, city: 'Abu Dhabi' },
      { id: 'fallback_jebel_jais', name: 'Jebel Jais Peak Zipline', category: 'outdoor', tag: '⛰️ ROAD TRIP ADVENTURE', rating: 4.9, city: 'Ras Al Khaimah' },
      { id: 'fallback_tom_serge', name: 'Tom & Serg Specialty Coffee', category: 'cafe', tag: '☕ TOP ARTISAN CAFE', rating: 4.5, city: 'Dubai' },
      { id: 'fallback_atlantis', name: 'Atlantis Aquaventure', category: 'entertainment', tag: '🌊 WATERPARK PASS', rating: 4.7, city: 'Dubai' },
    ];
    setItems(trending);
  }, []);

  if (items.length === 0) return null;

  // Duplicate items array for seamless 100% infinite marquee loop
  const loopItems = [...items, ...items, ...items];

  return (
    <div
      className="trending-header-container"
      style={{
        width: '100%',
        backgroundColor: 'var(--color-cream)',
        border: '3px solid var(--color-black)',
        borderRadius: '16px',
        boxShadow: '6px 6px 0 var(--color-black)',
        overflow: 'hidden',
        marginBottom: '24px',
        position: 'relative',
        boxSizing: 'border-box'
      }}
    >
      {/* Top Banner Title Strip */}
      <div
        style={{
          backgroundColor: 'var(--color-yellow)',
          borderBottom: '3px solid var(--color-black)',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between',
          flexWrap: 'wrap',
          gap: '8px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              backgroundColor: 'var(--color-pink)',
              color: 'var(--color-black)',
              border: '2px solid var(--color-black)',
              borderRadius: '6px',
              padding: '2px 8px',
              fontSize: '11px',
              fontWeight: 900,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '2px 2px 0 var(--color-black)'
            }}
          >
            <Flame size={14} fill="var(--color-black)" /> FEATURED SPOTS
          </div>
          <span style={{ fontWeight: 900, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '-0.01em' }}>
            WHAT'S POPPING & TRENDING NOW
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800 }}>
          <Sparkles size={14} color="var(--color-black)" />
          <span>Live UAE Highlights</span>
        </div>
      </div>

      {/* Marquee Track Container */}
      <div
        style={{
          padding: '14px 0',
          overflow: 'hidden',
          position: 'relative',
          width: '100%',
          background: 'linear-gradient(90deg, var(--color-black) 0%, rgba(0,0,0,0.85) 100%)'
        }}
      >
        <div
          className="marquee-track"
          style={{
            display: 'flex',
            gap: '16px',
            width: 'max-content',
            animation: 'headerMarquee 35s linear infinite',
            willChange: 'transform'
          }}
        >
          {loopItems.map((item, idx) => {
            const place = FALLBACK_PLACES.find(p => p.id === item.id) || item;
            const bgImg = getPlaceImage(place);
            const actionUrl = getActionableUrl(place);

            return (
              <div
                key={`${item.id}-${idx}`}
                className="trending-card"
                onClick={() => onNavigateToPlace?.(item.id)}
                style={{
                  width: '240px',
                  height: '130px',
                  flexShrink: 0,
                  borderRadius: '12px',
                  border: '2.5px solid var(--color-paper)',
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  boxShadow: '4px 4px 0 var(--color-black)',
                  transition: 'transform 0.2s ease, boxShadow 0.2s ease'
                }}
              >
                {/* Background Image */}
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

                {/* Dark Gradient Overlay */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.1) 100%)'
                  }}
                />

                {/* Top Tag Badge */}
                <div
                  style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    backgroundColor: 'var(--color-yellow)',
                    color: 'var(--color-black)',
                    border: '1.5px solid var(--color-black)',
                    borderRadius: '4px',
                    padding: '2px 6px',
                    fontSize: '9px',
                    fontWeight: 900,
                    boxShadow: '1.5px 1.5px 0 var(--color-black)',
                    textTransform: 'uppercase'
                  }}
                >
                  {item.tag}
                </div>

                {/* Bottom Content */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '8px',
                    right: '8px',
                    color: 'var(--color-paper)'
                  }}
                >
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 900,
                      lineHeight: 1.2,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      textShadow: '0 2px 4px rgba(0,0,0,0.8)'
                    }}
                  >
                    {item.name}
                  </div>
                  <div
                    style={{
                      fontSize: '10px',
                      color: 'var(--color-yellow)',
                      marginTop: '2px',
                      display: 'flex',
                      alignItems: 'center',
                      justify: 'space-between'
                    }}
                  >
                    <span>⭐ {item.rating} • {item.city}</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', textDecoration: 'underline', fontWeight: 800 }}>
                      EXPLORE <ChevronRight size={10} />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Marquee Animation Styles */}
      <style>{`
        @keyframes headerMarquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
        .trending-header-container:hover .marquee-track {
          animation-play-state: paused;
        }
        .trending-card:hover {
          transform: translateY(-2px) scale(1.02);
          border-color: var(--color-yellow) !important;
        }
      `}</style>
    </div>
  );
}
