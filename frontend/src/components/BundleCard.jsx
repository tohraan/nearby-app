import React from 'react';
import { Clock, ArrowRight, MapPin, Compass } from 'lucide-react';
import { CATEGORY_EMOJI } from '../lib/geo.js';

export default function BundleCard({ bundle, onSelect }) {
  if (!bundle) return null;

  return (
    <div 
      className="bundle-card"
      onClick={() => onSelect && onSelect(bundle)}
      role="button"
      tabIndex={0}
    >
      {/* Top Metadata Badge */}
      <div className="bundle-card-header">
        <span className="bundle-time-badge">
          <Clock className="w-3.5 h-3.5" />
          {bundle.totalTime}
        </span>
        <span className="bundle-city-badge">
          <MapPin className="w-3.5 h-3.5" />
          {bundle.city}
        </span>
      </div>

      {/* Title & Tagline */}
      <div className="bundle-card-body">
        <h3 className="bundle-card-title">{bundle.title}</h3>
        <p className="bundle-card-tagline">{bundle.tagline || bundle.description}</p>
      </div>

      {/* Sequenced Multi-Stop Preview Bar */}
      <div className="bundle-stops-preview">
        {bundle.stops && bundle.stops.map((stop, idx) => (
          <React.Fragment key={stop.placeId || idx}>
            <div className="bundle-stop-item">
              <div className="bundle-stop-icon">
                {CATEGORY_EMOJI[stop.category] || '📍'}
              </div>
              <span className="bundle-stop-name" title={stop.name}>
                {stop.name}
              </span>
            </div>
            {idx < bundle.stops.length - 1 && (
              <div className="bundle-stop-connector">
                <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Action Button */}
      <div className="bundle-card-footer">
        <button 
          className="bundle-action-btn"
          onClick={(e) => {
            e.stopPropagation();
            if (onSelect) onSelect(bundle);
          }}
        >
          <span>View itinerary</span>
          <Compass className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
