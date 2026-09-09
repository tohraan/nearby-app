import React, { useEffect, useState } from 'react';
import { Flame, Star, Sparkles, MapPin, ExternalLink, ChevronRight, Compass } from 'lucide-react';
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
        border: '3.5px solid var(--color-black)',
        borderRadius: '16px',
        boxShadow: '6px 6px 0 var(--color-black)',
        overflow: 'hidden',
        marginBottom: '28px',
        position: 'relative',
        boxSizing: 'border-box'
      }}
    >
      {/* Top Banner Title Bar */}
      <div
        style={{
          backgroundColor: 'var(--color-yellow)',
          borderBottom: '3.5px solid var(--color-black)',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between',
          flexWrap: 'wrap',
          gap: '10px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              backgroundColor: 'var(--color-pink)',
              color: 'var(--color-black)',
              border: '2px solid var(--color-black)',
              borderRadius: '8px',
              padding: '4px 10px',
              fontSize: '12px',
              fontWeight: 900,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '2.5px 2.5px 0 var(--color-black)'
            }}
          >
            <Flame size={16} fill="var(--color-black)" /> FEATURED SPOTS
          </div>
          <span style={{ fontWeight: 900, fontSize: '15px', textTransform: 'uppercase', letterSpacing: '-0.01em' }}>
            WHAT'S POPPING & TRENDING IN THE UAE
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 900 }}>
          <Sparkles size={16} color="var(--color-black)" />
          <span className="neo-badge neo-badge--mint" style={{ padding: '2px 8px', fontSize: '10px' }}>LIVE HIGHLIGHTS</span>
        </div>
      </div>

      {/* Marquee Track Container */}
      <div
        style={{
          padding: '18px 0',
          overflow: 'hidden',
          position: 'relative',
          width: '100%',
          background: 'linear-gradient(90deg, #111111 0%, #1A1A1A 100%)'
        }}
      >
        <div
          className="marquee-track"
          style={{
            display: 'flex',
            gap: '20px',
            width: 'max-content',
            animation: 'headerMarquee 38s linear infinite',
            willChange: 'transform'
          }}
        >
          {loopItems.map((item, idx) => {
            const place = FALLBACK_PLACES.find(p => p.id === item.id) || item;
            const bgImg = getPlaceImage(place);

            return (
              <div
                key={`${item.id}-${idx}`}
                className="trending-card"
                onClick={() => onNavigateToPlace?.(item.id)}
                style={{
                  width: '270px',
                  height: '155px',
                  flexShrink: 0,
                  borderRadius: '14px',
                  border: '3px solid var(--color-paper)',
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  boxShadow: '5px 5px 0 var(--color-black)',
                  transition: 'transform 0.25s ease, boxShadow 0.25s ease'
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
                    background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.4) 55%, rgba(0,0,0,0.15) 100%)'
                  }}
                />

                {/* Top Tag Badge */}
                <div
                  style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    backgroundColor: 'var(--color-yellow)',
                    color: 'var(--color-black)',
                    border: '2px solid var(--color-black)',
                    borderRadius: '6px',
                    padding: '3px 8px',
                    fontSize: '10px',
                    fontWeight: 900,
                    boxShadow: '2px 2px 0 var(--color-black)',
                    textTransform: 'uppercase'
                  }}
                >
                  {item.tag}
                </div>

                {/* Bottom Card Content */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '10px',
                    left: '10px',
                    right: '10px',
                    color: 'var(--color-paper)'
                  }}
                >
                  <div
                    style={{
                      fontSize: '15px',
                      fontWeight: 900,
                      lineHeight: 1.15,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      textShadow: '0 2px 4px rgba(0,0,0,0.9)'
                    }}
                  >
                    {item.name}
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: 'var(--color-yellow)',
                      marginTop: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justify: 'space-between',
                      fontWeight: 800
                    }}
                  >
                    <span>⭐ {item.rating} • {item.city}</span>
                    <span
                      style={{
                        backgroundColor: 'var(--color-pink)',
                        color: 'var(--color-black)',
                        border: '1.5px solid var(--color-black)',
                        borderRadius: '4px',
                        padding: '1px 6px',
                        fontSize: '9px',
                        fontWeight: 900,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '2px'
                      }}
                    >
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
          transform: translateY(-4px) scale(1.03);
          border-color: var(--color-yellow) !important;
          box-shadow: 7px 7px 0 var(--color-black) !important;
        }
      `}</style>
    </div>
  );
}
