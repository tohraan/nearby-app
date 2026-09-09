import React, { useEffect, useState } from 'react';
import { Sparkles, Flame, MapPin } from 'lucide-react';
import { FALLBACK_PLACES } from '../lib/fallbackData.js';
import { CATEGORY_EMOJI, getPlaceImage } from '../lib/geo.js';

export default function TrendingTicker({ onNavigateToPlace, onNavigateToGroup }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    // Select top trending places & activities
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

  // Duplicate items array to create seamless 100% infinite scroll loop
  const loopItems = [...items, ...items, ...items];

  return (
    <div className="trending-ticker">
      <div className="trending-ticker__badge">
        <Flame size={14} color="var(--color-black)" />
        <span>TRENDING NOW</span>
      </div>

      <div className="trending-ticker__track-container">
        <div className="trending-ticker__track">
          {loopItems.map((item, idx) => {
            const place = FALLBACK_PLACES.find(p => p.id === item.id) || item;
            return (
              <div
                key={`${item.id}-${idx}`}
                className="trending-ticker__item"
                onClick={() => onNavigateToPlace?.(item.id)}
              >
                <img
                  src={getPlaceImage(place)}
                  alt={item.name}
                  className="trending-ticker__img"
                />
                <span className="trending-ticker__tag">{item.tag}</span>
                <span className="trending-ticker__name">{item.name}</span>
                <span className="trending-ticker__divider">•</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
