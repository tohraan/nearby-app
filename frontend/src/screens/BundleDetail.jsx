import React from 'react';
import { ArrowLeft, Clock, MapPin, Navigation, ExternalLink, ChevronRight, Compass } from 'lucide-react';
import { CATEGORY_EMOJI, CATEGORY_LABELS } from '../lib/geo.js';
import VenueImage from '../components/VenueImage.jsx';

export default function BundleDetail({ bundle, onBack, onSelectPlace }) {
  if (!bundle) return null;

  // Find stop 1 coordinates or address for external directions link
  const stop1 = bundle.stops?.[0];
  const firstStopDirectionsUrl = stop1
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stop1.name + ' ' + (bundle.city || 'Dubai'))}`
    : `https://www.google.com/maps`;

  return (
    <div className="bundle-detail-screen">
      {/* Header Bar */}
      <div className="bundle-detail-header">
        <button onClick={onBack} className="bundle-back-btn" aria-label="Go back">
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
        <span className="bundle-detail-badge">Trip Itinerary</span>
      </div>

      {/* Main Container */}
      <div className="bundle-detail-content">
        
        {/* Hero Section */}
        <div className="bundle-detail-hero">
          <div className="bundle-detail-meta">
            <span className="bundle-total-badge">
              <Clock className="w-4 h-4 inline mr-1" />
              Total: {bundle.totalTime}
            </span>
            <span className="bundle-location-badge">
              <MapPin className="w-4 h-4 inline mr-1" />
              {bundle.city}
            </span>
          </div>

          <h1 className="bundle-detail-title">{bundle.title}</h1>
          <p className="bundle-detail-desc">{bundle.description}</p>

          {/* Primary Action Button */}
          <div className="bundle-detail-actions">
            <a 
              href={firstStopDirectionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bundle-start-trip-btn"
            >
              <Navigation className="w-5 h-5" />
              <span>Start trip (Directions to Stop 1)</span>
              <ExternalLink className="w-4 h-4 ml-1 opacity-80" />
            </a>
          </div>
        </div>

        {/* Sequenced Stops Timeline */}
        <div className="bundle-stops-timeline">
          <h2 className="bundle-timeline-heading">
            <Compass className="w-5 h-5 inline mr-2 text-stone-700" />
            {bundle.stops?.length || 0}-Stop Itinerary
          </h2>

          <div className="stops-list">
            {bundle.stops && bundle.stops.map((stop, idx) => (
              <React.Fragment key={stop.placeId || idx}>
                
                {/* Stop Card */}
                <div 
                  className="stop-timeline-card"
                  onClick={() => onSelectPlace && onSelectPlace(stop.placeId || stop)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="stop-number-badge">{idx + 1}</div>

                  {/* Compact Icon Badge */}
                  <div className="stop-badge-slot">
                    <VenueImage 
                      place={{ id: stop.placeId, name: stop.name, category: stop.category }} 
                      className="stop-badge-img"
                    />
                  </div>

                  <div className="stop-info-column">
                    <div className="stop-header-row">
                      <span className="stop-category-tag">
                        {CATEGORY_EMOJI[stop.category] || '📍'} {CATEGORY_LABELS[stop.category] || stop.category}
                      </span>
                      {stop.duration && (
                        <span className="stop-duration-tag">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {stop.duration}
                        </span>
                      )}
                    </div>

                    <h3 className="stop-name">{stop.name}</h3>
                    <p className="stop-click-prompt">
                      Tap to view details <ChevronRight className="w-3.5 h-3.5 inline ml-0.5" />
                    </p>
                  </div>
                </div>

                {/* Travel Time Connecting Segment */}
                {idx < bundle.stops.length - 1 && (
                  <div className="stop-travel-segment">
                    <div className="travel-line" />
                    <div className="travel-pill">
                      {stop.travelToNext || '🚗 10 min drive'}
                    </div>
                  </div>
                )}

              </React.Fragment>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
