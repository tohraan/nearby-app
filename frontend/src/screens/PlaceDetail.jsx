import { useState, useEffect } from 'react';
import { MapPin, ChevronLeft, Star, Heart, CheckCircle2 } from 'lucide-react';
import { getCachedPlaceById, getSavedPlaceIds, savePlaceLocally, unsavePlaceLocally, getVisitedPlaceIds, addVisitedPlaceLocally, removeVisitedPlaceLocally } from '../lib/db.js';
import { api } from '../lib/api.js';
import { useOnlineStatus } from '../hooks/useOnlineStatus.js';
import { CATEGORY_EMOJI, formatDistance, haversineKm } from '../lib/geo.js';
import { useGeolocation } from '../hooks/useGeolocation.js';
import { queueAction } from '../lib/offlineSync.js';
import { FALLBACK_PLACES } from '../lib/fallbackData.js';

export default function PlaceDetail({ placeId, onBack }) {
  const [place, setPlace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isVisited, setIsVisited] = useState(false);
  const isOnline = useOnlineStatus();
  const { lat, lng } = useGeolocation();

  useEffect(() => {
    async function load() {
      let p = await getCachedPlaceById(placeId);
      if (!p) {
        p = FALLBACK_PLACES.find(fp => fp.id === placeId);
      }
      if (p) {
        setPlace(p);
      }
      const savedIds = await getSavedPlaceIds();
      setIsSaved(savedIds.includes(placeId));
      
      const visitedIds = await getVisitedPlaceIds();
      setIsVisited(visitedIds.includes(placeId));
      
      setLoading(false);
    }
    load();
  }, [placeId]);

  const handleToggleSave = async () => {
    const newState = !isSaved;
    setIsSaved(newState);
    if (newState) {
      await savePlaceLocally(placeId);
      if (isOnline) {
        try { await api.savePlace(placeId); } catch { queueAction({ type: 'save', placeId }); }
      } else {
        queueAction({ type: 'save', placeId });
      }
    } else {
      await unsavePlaceLocally(placeId);
      if (isOnline) {
        try { await api.unsavePlace(placeId); } catch { queueAction({ type: 'unsave', placeId }); }
      } else {
        queueAction({ type: 'unsave', placeId });
      }
    }
  };

  const handleToggleVisited = async () => {
    const newState = !isVisited;
    setIsVisited(newState);
    if (newState) {
      await addVisitedPlaceLocally(placeId);
    } else {
      await removeVisitedPlaceLocally(placeId);
    }
  };

  if (loading) {
    return (
      <div className="app-shell__content">
        <div className="skeleton" style={{ width: '100px', height: '24px', marginBottom: '24px' }} />
        <div className="skeleton" style={{ width: '100%', height: '200px', marginBottom: '16px', borderRadius: '16px' }} />
        <div className="skeleton" style={{ width: '60%', height: '32px', marginBottom: '16px' }} />
      </div>
    );
  }

  if (!place) {
    return (
      <div className="app-shell__content empty-state">
        <div className="empty-state__icon">📍</div>
        <div className="empty-state__title">PLACE NOT FOUND</div>
        <div className="empty-state__desc">This place could not be loaded.</div>
        <button className="neo-btn neo-btn--primary" onClick={onBack}>GO BACK</button>
      </div>
    );
  }

  // Calculate distance if coordinates exist
  const distance = (place.lat && place.lng && lat && lng) ? haversineKm(lat, lng, place.lat, place.lng) : null;

  return (
    <div className="app-shell__content" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* ─── Header ─── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
        <button 
          onClick={onBack}
          className="neo-btn neo-btn--ghost neo-btn--xs" 
          style={{ padding: 0 }}
        >
          <ChevronLeft size={16} /> Back
        </button>
        <button 
          onClick={handleToggleSave}
          className={`place-card__save-btn ${isSaved ? 'place-card__save-btn--saved' : ''}`}
          style={{ position: 'static' }}
        >
          {isSaved ? '❤️' : '🤍'}
        </button>
      </div>

      {/* ─── Hero / Image Placeholder ─── */}
      <div style={{
        height: '220px',
        background: 'var(--color-cream)',
        border: '3px solid var(--color-black)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-solid)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '64px',
        marginBottom: 'var(--space-5)'
      }}>
        {CATEGORY_EMOJI[place.category] || '📍'}
      </div>

      {/* ─── Info ─── */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
          <span className="neo-badge neo-badge--yellow" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Star size={14} fill="var(--color-black)" /> {place.rating || 'New'}
          </span>
          <span className="neo-badge neo-badge--lavender">
            {place.category}
          </span>
        </div>
        
        <h1 style={{ fontSize: 'clamp(28px, 6vw, 36px)', lineHeight: 1.1, marginBottom: 'var(--space-2)' }}>
          {place.name}
        </h1>
        
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
          {place.city}
          {place.cuisine && place.cuisine.length > 0 && ` • ${place.cuisine.join(', ')}`}
        </p>
      </div>

      {/* ─── Location & Quick Facts ─── */}
      <div className="neo-card neo-card--pink" style={{ marginBottom: 'var(--space-6)' }}>
        <h3 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-3)' }}>Location & Info</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {place.address && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
              <MapPin size={18} style={{ marginTop: '2px', flexShrink: 0 }} />
              <span style={{ fontSize: '15px' }}>{place.address}</span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
            <span style={{ fontSize: '18px', width: '18px', textAlign: 'center', flexShrink: 0 }}>📍</span>
            <span style={{ fontSize: '15px' }}>{distance != null ? `${formatDistance(distance)} from you` : 'Coordinates unavailable'}</span>
          </div>
          {place.website && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
              <span style={{ fontSize: '18px', width: '18px', textAlign: 'center', flexShrink: 0 }}>🔗</span>
              <a href={place.website} target="_blank" rel="noreferrer" style={{ fontSize: '15px', color: 'var(--color-purple)' }}>Visit Website</a>
            </div>
          )}
        </div>
      </div>
      
      {/* ─── Get Directions Action ─── */}
      <div style={{ marginTop: 'auto', paddingBottom: 'var(--space-4)', display: 'flex', gap: 'var(--space-3)' }}>
        <button 
          className={`neo-btn ${isVisited ? 'neo-btn--secondary' : 'neo-btn--accent'}`}
          style={{ flex: 1 }}
          onClick={handleToggleVisited}
        >
          {isVisited ? <><CheckCircle2 size={18} /> VISITED</> : 'MARK VISITED'}
        </button>
        <a 
          href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`}
          target="_blank"
          rel="noreferrer"
          className="neo-btn neo-btn--primary" 
          style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}
        >
          DIRECTIONS
        </a>
      </div>
    </div>
  );
}
