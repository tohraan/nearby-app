/**
 * SavedList.jsx — Saved places screen (works 100% offline)
 */

import { useState, useEffect, useCallback } from 'react';
import { Star, MapPin, Trash2, ExternalLink } from 'lucide-react';
import { getSavedPlaceIds, unsavePlaceLocally, getCachedPlaceById } from '../lib/db.js';
import { api } from '../lib/api.js';
import { useOnlineStatus } from '../hooks/useOnlineStatus.js';
import { queueAction } from '../lib/offlineSync.js';
import { CATEGORY_EMOJI, getPlaceImage, getActionableUrl, getActionLabel } from '../lib/geo.js';
import { FALLBACK_PLACES } from '../lib/fallbackData.js';


export default function SavedList({ onNavigateToPlace }) {
  const [savedPlaces, setSavedPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [undoToast, setUndoToast] = useState(null);
  const [error, setError] = useState(null);
  const isOnline = useOnlineStatus();

  useEffect(() => {
    async function load() {
      try {
        const ids = await getSavedPlaceIds();
        const places = [];
        for (const id of ids) {
          let place = await getCachedPlaceById(id);
          if (!place) {
            // fallback to curated data set
            place = FALLBACK_PLACES.find(fp => fp.id === id) || null;
          }
          if (place) places.push(place);
        }
        setSavedPlaces(places);
      } catch (err) {
        console.error('Failed to load saved places:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleUnsave = useCallback((placeId) => {
    // 1. Find the place before removing it
    const placeToUnsave = savedPlaces.find(p => p.id === placeId);
    if (!placeToUnsave) return;

    // 2. Optimistically remove from UI
    setSavedPlaces(prev => prev.filter(p => p.id !== placeId));

    // 3. Clear any existing timeout
    if (undoToast?.timeoutId) clearTimeout(undoToast.timeoutId);

    // 4. Set the toast and schedule actual deletion in 4 seconds
    const timeoutId = setTimeout(async () => {
      setUndoToast(null);
      await unsavePlaceLocally(placeId);
      if (isOnline) {
        try { await api.unsavePlace(placeId); } catch { queueAction({ type: 'unsave', placeId }); }
      } else {
        queueAction({ type: 'unsave', placeId });
      }
    }, 4000);

    setUndoToast({ place: placeToUnsave, timeoutId });
  }, [savedPlaces, undoToast, isOnline]);

  const handleUndo = useCallback(() => {
    if (!undoToast) return;
    clearTimeout(undoToast.timeoutId);
    setSavedPlaces(prev => [...prev, undoToast.place]);
    setUndoToast(null);
  }, [undoToast]);

  if (loading) {
    return (
      <div className="app-shell__content">
        <h1 style={{ marginBottom: 'var(--space-6)' }}>SAVED</h1>
        {[1, 2, 3].map(i => <div key={i} className="skeleton skeleton--card" style={{ marginBottom: 'var(--space-4)' }} />)}
      </div>
    );
  }

  return (
    <div className="app-shell__content">
      <div className="saved-header">
        <h1>SAVED</h1>
        <span className="neo-badge neo-badge--lavender">{savedPlaces.length} spots</span>
      </div>

      <div className={`sync-badge sync-badge--${isOnline ? 'online' : 'offline'}`} style={{ marginBottom: 'var(--space-5)' }}>
        <span className={`sync-dot sync-dot--${isOnline ? 'online' : 'offline'}`} />
        {isOnline ? 'SYNCED' : 'OFFLINE — showing local saves'}
      </div>

      {error ? (
        <div className="empty-state">
          <div className="empty-state__icon">⚠️</div>
          <div className="empty-state__title">Error Loading Saves</div>
          <div className="empty-state__desc">
            {error.message || String(error)}
          </div>
        </div>
      ) : savedPlaces.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">✦</div>
          <div className="empty-state__title">NOTHING SAVED YET</div>
          <div className="empty-state__desc">
            Your saved spots will appear here. Tap the heart on any place to save it for later.
          </div>
          <button className="neo-btn neo-btn--primary" onClick={() => window.history.back()}>
            EXPLORE NEARBY
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {savedPlaces.filter(Boolean).map(place => (
            <div 
              key={place.id} 
              className="neo-card neo-card--clickable place-card" 
              style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center', padding: 'var(--space-4)' }}
              onClick={() => onNavigateToPlace?.(place.id)}
            >
              <div style={{
                width: '72px', height: '72px', flexShrink: 0,
                background: 'var(--color-cream)',
                border: '2px solid var(--color-black)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                position: 'relative'
              }}>
                <VenueImage place={place} alt={place.name} showAttribution={false} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="place-card__category">
                  {place.category}
                </div>
                <div className="place-card__name" style={{ fontSize: '16px' }}>
                  {place.name}
                </div>
                <div className="place-card__meta">
                  <span className="place-card__rating">
                    <Star size={12} fill="var(--color-yellow)" stroke="var(--color-black)" />
                    {place.rating}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>•</span>
                  <span>{place.city}</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                <a
                  href={getActionableUrl(place)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="neo-btn neo-btn--xs neo-btn--accent"
                  style={{ textDecoration: 'none', fontWeight: 800, padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {getActionLabel(place)} <ExternalLink size={10} />
                </a>
                <button
                  className="neo-btn neo-btn--destructive neo-btn--icon"
                  style={{ width: '28px', height: '28px', padding: 0 }}
                  onClick={(e) => { e.stopPropagation(); handleUnsave(place.id); }}
                  aria-label="Remove from saved"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Undo Toast ─── */}
      {undoToast && (
        <div className="toast-container">
          <div className="toast toast--info" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
            <span>Removed {undoToast.place.name}</span>
            <button 
              onClick={handleUndo} 
              className="neo-btn neo-btn--secondary neo-btn--xs"
              style={{ minHeight: '32px' }}
            >
              UNDO
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
