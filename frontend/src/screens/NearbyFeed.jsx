/**
 * NearbyFeed.jsx — Discovery Screen
 * Features 2-button view toggle (List & Map), top right Emirate/City & Distance filters,
 * category chip bar, 1-tap quick sort pills (Closest, Top Rated, Trending),
 * and an endless "Popular Near You" grid with infinite scroll.
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Search, MapPin, List, Map as MapIcon, Star, Bell, ExternalLink, ArrowUpDown, RotateCcw } from 'lucide-react';
import { useGeolocation } from '../hooks/useGeolocation.js';
import { useOnlineStatus } from '../hooks/useOnlineStatus.js';
import { getCachedPlaces, getSavedPlaceIds, savePlaceLocally, unsavePlaceLocally, getVisitedPlaceIds } from '../lib/db.js';
import { sortByDistance, formatDistance, CATEGORY_EMOJI, CATEGORY_LABELS, getPlaceImage, getActionableUrl, getActionLabel } from '../lib/geo.js';

import { FALLBACK_PLACES } from '../lib/fallbackData.js';
import { queueAction } from '../lib/offlineSync.js';
import api from '../lib/api.js';
import CustomMap from '../components/CustomMap.jsx';
import TrendingTicker from '../components/TrendingTicker.jsx';

const CATEGORIES = ['all', 'food', 'cafe', 'nightlife', 'entertainment', 'outdoor', 'sports', 'culture', 'attraction', 'shopping'];


const DISTANCES = [
  { label: 'Any Radius', val: 'all' },
  { label: '< 2 km', val: '2' },
  { label: '< 5 km', val: '5' },
  { label: '< 10 km', val: '10' },
  { label: '< 25 km', val: '25' },
  { label: '< 50 km', val: '50' }
];

export default function NearbyFeed({ onNavigateToGroup, onNavigateToPlace }) {
  const { lat, lng } = useGeolocation();
  const isOnline = useOnlineStatus();

  const [places, setPlaces] = useState([]);
  const [savedIds, setSavedIds] = useState(new Set());
  const [visitedIds, setVisitedIds] = useState(new Set());
  
  // Filters & State
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedDistance, setSelectedDistance] = useState('all');
  const [sortBy, setSortBy] = useState('distance'); // 'distance' | 'rating' | 'trending'
  const [view, setView] = useState('list'); // 'list' vs 'map'
  
  // Infinite Scroll Pagination
  const [page, setPage] = useState(1);
  const pageSize = 12;
  const observerTargetRef = useRef(null);

  const [selectedPlaceId, setSelectedPlaceId] = useState(null);
  const [groups, setGroups] = useState([]);
  const [showCreateActivity, setShowCreateActivity] = useState(false);
  const [activityForm, setActivityForm] = useState({ name: '', category: 'outdoor', activityType: '', startsAt: '', maxPeople: 0, cost: 0 });
  const [loading, setLoading] = useState(true);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  // Load cached places & user saves
  useEffect(() => {
    async function load() {
      const cached = await getCachedPlaces();
      if (cached.length === 0) {
        setPlaces(FALLBACK_PLACES);
      } else {
        setPlaces(cached);
      }
      
      const saved = await getSavedPlaceIds();
      setSavedIds(new Set(saved));
      
      const visited = await getVisitedPlaceIds();
      setVisitedIds(new Set(visited));
      
      if (isOnline) {
        try {
          const res = await api.getGroups();
          if (Array.isArray(res)) setGroups(res);
        } catch (err) {
          console.warn('Failed to load groups for map', err);
        }
      }
      
      setLoading(false);
    }
    load();
  }, [isOnline]);

  // Reset infinite scroll pagination when filters change
  useEffect(() => {
    setPage(1);
  }, [category, search, selectedCity, selectedDistance, sortBy]);

  // Master Filter & Sort Engine
  const filteredPlaces = useMemo(() => {
    let result = sortByDistance(places, lat, lng);

    // Emirate / City Filter
    if (selectedCity !== 'all') {
      result = result.filter(p => p.city && p.city.toLowerCase() === selectedCity.toLowerCase());
    }

    // Distance Radius Filter
    if (selectedDistance !== 'all') {
      const maxKm = parseFloat(selectedDistance);
      result = result.filter(p => p.distance <= maxKm);
    }

    // Category Filter
    if (category !== 'all') {
      result = result.filter(p => p.category === category);
    }

    // Keyword Search Query
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.city?.toLowerCase().includes(q) ||
        p.cuisine?.some(c => c.toLowerCase().includes(q)) ||
        p.tags?.some(t => t.toLowerCase().includes(q))
      );
    }

    // Quick Sort Engine
    if (sortBy === 'rating') {
      result = [...result].sort((a, b) => {
        const ratingA = Number(a.rating) || 0;
        const ratingB = Number(b.rating) || 0;
        if (ratingB !== ratingA) return ratingB - ratingA;
        return a.distance - b.distance;
      });
    } else if (sortBy === 'trending') {
      result = [...result].sort((a, b) => {
        const scoreA = (Number(a.rating) || 3) * 2 - (a.distance * 0.25);
        const scoreB = (Number(b.rating) || 3) * 2 - (b.distance * 0.25);
        return scoreB - scoreA;
      });
    }

    return result;
  }, [places, lat, lng, selectedCity, selectedDistance, category, search, sortBy]);

  // Infinite Scroll Paginated Subset
  const visiblePlaces = useMemo(() => {
    return filteredPlaces.slice(0, page * pageSize);
  }, [filteredPlaces, page]);

  const hasMore = visiblePlaces.length < filteredPlaces.length;

  const handleResetFilters = () => {
    setCategory('all');
    setSearch('');
    setSelectedCity('all');
    setSelectedDistance('all');
    setSortBy('distance');
    setPage(1);
  };

  const hasActiveFilters = category !== 'all' || search || selectedCity !== 'all' || selectedDistance !== 'all' || sortBy !== 'distance';

  // Save/unsave handler
  const handleToggleSave = useCallback(async (placeId) => {
    const isSaved = savedIds.has(placeId);
    const newSaved = new Set(savedIds);

    if (isSaved) {
      newSaved.delete(placeId);
      await unsavePlaceLocally(placeId);
      if (isOnline) {
        try { await api.unsavePlace(placeId); } catch { queueAction({ type: 'unsave', placeId }); }
      } else {
        queueAction({ type: 'unsave', placeId });
      }
    } else {
      newSaved.add(placeId);
      await savePlaceLocally(placeId);
      if (isOnline) {
        try { await api.savePlace(placeId); } catch { queueAction({ type: 'save', placeId }); }
      } else {
        queueAction({ type: 'save', placeId });
      }
    }

    setSavedIds(newSaved);
  }, [savedIds, isOnline]);

  const requestNotificationPermission = async () => {
    if (typeof Notification === 'undefined') return;
    try {
      const permission = await Notification.requestPermission();
      setNotificationStatus(permission);
      setShowNotificationPrompt(false);
      if (permission === 'granted') {
        new Notification('Notifications Enabled!', {
          body: 'We will notify you about nearby hidden gems.',
          icon: '/favicon.ico'
        });
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  const handleCreateActivity = async (e) => {
    e.preventDefault();
    if (!isOnline) {
      alert('You must be online to create an activity.');
      return;
    }
    
    try {
      const newActivity = {
        ...activityForm,
        lat,
        lng,
        creatorDeviceId: 'user-local',
      };
      
      const res = await api.createGroup(newActivity);
      if (res.id) {
        setGroups([{ id: res.id, ...newActivity, member_count: 1 }, ...groups]);
        setShowCreateActivity(false);
        setActivityForm({ name: '', category: 'outdoor', activityType: '', startsAt: '', maxPeople: 0, cost: 0 });
      }
    } catch (err) {
      console.error('Failed to create activity', err);
    }
  };

  const selectedLocation = useMemo(() => {
    if (!selectedPlaceId) return null;
    const place = filteredPlaces.find(p => p.id === selectedPlaceId);
    if (place) return { ...place, isGroup: false };
    const group = groups.find(g => g.id === selectedPlaceId);
    if (group) return { ...group, isGroup: true };
    return null;
  }, [selectedPlaceId, filteredPlaces, groups]);

  if (loading) {
    return (
      <div className="app-shell__content">
        <div className="nearby-hero">
          <div className="skeleton" style={{ width: '100px', height: '14px', marginBottom: '12px' }} />
          <div className="skeleton" style={{ width: '80%', height: '48px', marginBottom: '8px' }} />
        </div>
        <div className="nearby-grid">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="skeleton skeleton--card" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell__content">
      {/* ─── Top Hero Header Banner ─── */}
      <TrendingTicker onNavigateToPlace={onNavigateToPlace} onNavigateToGroup={onNavigateToGroup} />

      {/* ─── Search Bar & Top Right Filters (Emirate, Radius, Bell) ─── */}
      <div className="nearby-controls" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search Input */}
          <div style={{ flex: '1 1 240px', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="neo-input neo-input--large"
              type="text"
              placeholder="Search cafes, rooftop bars, viewing decks..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: '42px', height: '46px', fontSize: '14px' }}
            />
          </div>

          {/* Emirate / City Filter Dropdown */}
          <select
            className="neo-input"
            value={selectedCity}
            onChange={e => setSelectedCity(e.target.value)}
            style={{ height: '46px', fontSize: '13px', fontWeight: 800, minWidth: '120px', cursor: 'pointer', backgroundColor: 'var(--color-cream)' }}
          >
            <option value="all">📍 All UAE Cities</option>
            <option value="Dubai">🏙️ Dubai</option>
            <option value="Abu Dhabi">🕌 Abu Dhabi</option>
            <option value="Sharjah">🏛️ Sharjah</option>
            <option value="Ras Al Khaimah">⛰️ Ras Al Khaimah</option>
          </select>

          {/* Distance Radius Filter Dropdown */}
          <select
            className="neo-input"
            value={selectedDistance}
            onChange={e => setSelectedDistance(e.target.value)}
            style={{ height: '46px', fontSize: '13px', fontWeight: 800, minWidth: '120px', cursor: 'pointer', backgroundColor: 'var(--color-cream)' }}
          >
            {DISTANCES.map(d => (
              <option key={d.val} value={d.val}>{d.label}</option>
            ))}
          </select>

          {/* Notification Bell */}
          <button 
            className="neo-btn neo-btn--ghost neo-btn--icon"
            style={{ width: '46px', height: '46px', background: 'var(--color-cream)', flexShrink: 0, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => {
              if (notificationStatus === 'default') {
                setShowNotificationPrompt(true);
              }
            }}
            title="Enable Notifications"
          >
            <Bell size={20} color={notificationStatus === 'granted' ? 'var(--color-purple)' : 'var(--text-primary)'} />
          </button>
        </div>

        {/* Category Filter Chips Bar */}
        <div className="category-chips-wrapper" style={{ marginTop: '12px' }}>
          <div className="category-chips">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                className={`category-chip ${category === cat ? 'category-chip--active' : ''}`}
                onClick={() => setCategory(cat)}
              >
                {cat !== 'all' && CATEGORY_EMOJI[cat]} {cat === 'all' ? '✦ All Categories' : CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Sort Pills */}
        <div className="quick-filter-bar" style={{ marginTop: '12px' }}>
          <div className="quick-filter-group">
            <span className="quick-filter-label">
              <ArrowUpDown size={12} /> Sort:
            </span>
            <button
              type="button"
              className={`pill-btn ${sortBy === 'distance' ? 'pill-btn--active' : ''}`}
              onClick={() => setSortBy('distance')}
              title="Sort places by closest distance"
            >
              📍 Closest
            </button>
            <button
              type="button"
              className={`pill-btn ${sortBy === 'rating' ? 'pill-btn--active' : ''}`}
              onClick={() => setSortBy('rating')}
              title="Sort places by highest rating"
            >
              ⭐ Top Rated
            </button>
            <button
              type="button"
              className={`pill-btn ${sortBy === 'trending' ? 'pill-btn--active' : ''}`}
              onClick={() => setSortBy('trending')}
              title="Sort places by trending popularity"
            >
              🔥 Trending
            </button>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="neo-btn neo-btn--ghost neo-btn--xs"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 800, padding: '4px 8px', background: 'var(--bg-surface)' }}
            >
              <RotateCcw size={12} /> Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* ─── Map View (Visible in 'map' mode) ─── */}
      {view === 'map' && (
        <div 
          className="map-container" 
          style={{ 
            position: 'relative', 
            width: '100%', 
            height: 'clamp(550px, 75vh, 800px)',
            marginBottom: 'var(--space-6)'
          }}
        >
          <CustomMap
            places={filteredPlaces}
            groups={groups}
            userLat={lat}
            userLng={lng}
            selectedPlaceId={selectedPlaceId}
            onSelectPlace={(id) => setSelectedPlaceId(id)}
            onHostActivity={() => setShowCreateActivity(true)}
            visitedIds={visitedIds}
          />
          
          {/* Floating Place Sheet in Map View */}
          {selectedLocation && (
            <div 
              className="neo-card" 
              style={{
                position: 'absolute',
                bottom: '24px',
                left: '24px',
                right: '24px',
                zIndex: 1000,
                padding: 'var(--space-4)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                animation: 'slideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards'
              }}
            >
              <button 
                onClick={() => setSelectedPlaceId(null)}
                style={{ position: 'absolute', top: '8px', right: '8px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', fontWeight: 900 }}
              >
                ✕
              </button>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ fontSize: '24px' }}>{CATEGORY_EMOJI[selectedLocation.category || 'outdoor']}</div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>{selectedLocation.name}</h3>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span>{selectedLocation.category}</span>
                    {selectedLocation.city && (
                      <>
                        <span>•</span>
                        <span>{selectedLocation.city}</span>
                      </>
                    )}
                    {selectedLocation.distance !== undefined && (
                      <>
                        <span>•</span>
                        <span><MapPin size={10} style={{ display: 'inline', marginBottom: '-1px' }} /> {formatDistance(selectedLocation.distance)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              {selectedLocation.isGroup ? (
                <>
                  <div style={{ fontSize: '14px', margin: '4px 0' }}>
                    <strong>Activity:</strong> {selectedLocation.activity_type} <br/>
                    <strong>Spots:</strong> {selectedLocation.member_count} / {selectedLocation.max_people || 'Unlimited'}
                  </div>
                  <button className="neo-btn neo-btn--primary" onClick={() => onNavigateToGroup?.(selectedLocation.id)}>
                    View Meetup
                  </button>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '14px', margin: '4px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span>⭐ {selectedLocation.rating || 'New'}</span>
                    <span>{selectedLocation.city}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button className="neo-btn neo-btn--primary" onClick={() => onNavigateToPlace?.(selectedLocation.id)} style={{ flex: 1 }}>
                      View Place
                    </button>
                    <a
                      href={getActionableUrl(selectedLocation)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="neo-btn neo-btn--accent"
                      style={{ flex: 1, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '12px', fontWeight: 900 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {getActionLabel(selectedLocation)} <ExternalLink size={12} />
                    </a>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── Endless "Popular Near You" Discovery Feed (List View) ─── */}
      {view === 'list' && (
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 900, letterSpacing: '-0.02em' }}>
                {sortBy === 'rating' ? '⭐ Top Rated Spots' : sortBy === 'trending' ? '🔥 Trending Spots' : 'Popular Near You'} ({filteredPlaces.length})
              </h3>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Showing {visiblePlaces.length} of {filteredPlaces.length} places • Sorted by {sortBy === 'rating' ? 'highest rating' : sortBy === 'trending' ? 'trending score' : 'proximity'}
              </div>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="neo-btn neo-btn--ghost neo-btn--xs"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 800, padding: '4px 8px', background: 'var(--bg-surface)' }}
              >
                <RotateCcw size={12} /> Reset
              </button>
            )}
          </div>

          {visiblePlaces.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">🔍</div>
              <div className="empty-state__title">NO PLACES MATCH YOUR FILTERS</div>
              <div className="empty-state__desc">Try adjusting your city, radius, or category filters above!</div>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: '16px'
              }}
            >
              {visiblePlaces.map(place => (
                <div 
                  key={place.id} 
                  className="neo-card neo-card--clickable place-card" 
                  style={{ padding: '12px', display: 'flex', flexDirection: 'column' }}
                  onClick={() => onNavigateToPlace?.(place.id)}
                >
                  <div className="place-card__image" style={{ position: 'relative', overflow: 'hidden', height: '145px', borderRadius: '10px', border: '2px solid var(--color-black)', marginBottom: '8px' }}>
                    <img 
                      src={getPlaceImage(place)} 
                      alt={place.name}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&auto=format&fit=crop&q=80';
                      }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} 
                      loading="lazy"
                    />
                    <div 
                      style={{
                        position: 'absolute',
                        top: '6px',
                        left: '6px',
                        backgroundColor: 'var(--color-yellow)',
                        border: '2px solid var(--color-black)',
                        borderRadius: '6px',
                        padding: '2px 6px',
                        fontSize: '10px',
                        fontWeight: 900,
                        boxShadow: '2px 2px 0 var(--color-black)',
                        textTransform: 'uppercase'
                      }}
                    >
                      {CATEGORY_EMOJI[place.category]} {place.category}
                    </div>
                  </div>

                  <div className="place-card__name" style={{ fontSize: '15px', fontWeight: 800, lineHeight: 1.2 }}>{place.name}</div>
                  
                  <div className="place-card__meta" style={{ marginTop: '4px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="place-card__rating"><Star size={12} fill="var(--color-yellow)" stroke="var(--color-black)" /> {place.rating}</span>
                    <span style={{ color: 'var(--text-muted)' }}>•</span>
                    <span className="place-card__distance"><MapPin size={12} /> {formatDistance(place.distance)}</span>
                    {place.city && <><span style={{ color: 'var(--text-muted)' }}>•</span><span>{place.city}</span></>}
                  </div>

                  <div className="place-card__actions" style={{ marginTop: 'auto', paddingTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                    <a
                      href={getActionableUrl(place)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="neo-btn neo-btn--xs neo-btn--accent"
                      style={{ textDecoration: 'none', fontWeight: 900, padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {getActionLabel(place)} <ExternalLink size={10} />
                    </a>
                    <button
                      className={`place-card__save-btn ${savedIds.has(place.id) ? 'place-card__save-btn--saved' : ''}`}
                      onClick={(e) => { e.stopPropagation(); handleToggleSave(place.id); }}
                    >
                      {savedIds.has(place.id) ? '❤️' : '🤍'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Infinite Scroll Load Trigger */}
          {hasMore && (
            <div ref={observerTargetRef} style={{ textAlign: 'center', marginTop: '24px', paddingBottom: '16px' }}>
              <button
                className="neo-btn neo-btn--secondary"
                onClick={() => setPage(prev => prev + 1)}
                style={{ fontWeight: 900, padding: '10px 24px' }}
              >
                LOAD MORE PLACES (+12)
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─── Reverted 2-Button View Toggle (List vs Map) ─── */}
      <div className="view-toggle">
        <button
          className={`view-toggle__btn ${view === 'list' ? 'view-toggle__btn--active' : ''}`}
          onClick={() => setView('list')}
          aria-label="List view"
        >
          <List size={16} /> LIST VIEW
        </button>
        <button
          className={`view-toggle__btn ${view === 'map' ? 'view-toggle__btn--active' : ''}`}
          onClick={() => setView('map')}
          aria-label="Map view"
        >
          <MapIcon size={16} /> MAP VIEW
        </button>
      </div>

      {/* ─── Notification Prompt Modal ─── */}
      {showNotificationPrompt && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, 
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4)'
        }}>
          <div className="neo-card" style={{ maxWidth: '400px', width: '100%', padding: 'var(--space-6)', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: 'var(--space-3)' }}>🔔</div>
            <h2 style={{ fontSize: '24px', marginBottom: 'var(--space-2)' }}>Never miss out</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)', lineHeight: 1.4 }}>
              Enable notifications to get alerts when you're near a hidden gem or a popular spot!
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <button className="neo-btn neo-btn--ghost" style={{ flex: 1 }} onClick={() => setShowNotificationPrompt(false)}>Later</button>
              <button className="neo-btn neo-btn--primary" style={{ flex: 1 }} onClick={requestNotificationPermission}>Enable</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Create Activity Modal ─── */}
      {showCreateActivity && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999, 
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4)'
        }}>
          <div className="neo-card" style={{ maxWidth: '500px', width: '100%', padding: 'var(--space-5)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '24px', marginBottom: 'var(--space-4)' }}>Host an Activity</h2>
            <form onSubmit={handleCreateActivity}>
              <div style={{ marginBottom: 'var(--space-3)' }}>
                <label className="neo-label">Activity Name</label>
                <input required className="neo-input" type="text" value={activityForm.name} onChange={e => setActivityForm({...activityForm, name: e.target.value})} placeholder="e.g. Sunset Volleyball" />
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                <div style={{ flex: 1 }}>
                  <label className="neo-label">Category</label>
                  <select className="neo-input" value={activityForm.category} onChange={e => setActivityForm({...activityForm, category: e.target.value})}>
                    {CATEGORIES.filter(c => c !== 'all').map(c => <option key={c} value={c}>{CATEGORY_EMOJI[c]} {CATEGORY_LABELS[c]}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label className="neo-label">Type</label>
                  <input required className="neo-input" type="text" value={activityForm.activityType} onChange={e => setActivityForm({...activityForm, activityType: e.target.value})} placeholder="e.g. Volleyball" />
                </div>
              </div>
              <div style={{ marginBottom: 'var(--space-3)' }}>
                <label className="neo-label">Date & Time</label>
                <input required className="neo-input" type="datetime-local" value={activityForm.startsAt} onChange={e => setActivityForm({...activityForm, startsAt: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
                <div style={{ flex: 1 }}>
                  <label className="neo-label">Max Spots (0 = unlimited)</label>
                  <input className="neo-input" type="number" min="0" value={activityForm.maxPeople} onChange={e => setActivityForm({...activityForm, maxPeople: Number(e.target.value)})} />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="neo-label">Cost (AED)</label>
                  <input className="neo-input" type="number" min="0" step="0.5" value={activityForm.cost} onChange={e => setActivityForm({...activityForm, cost: Number(e.target.value)})} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                <button type="button" className="neo-btn neo-btn--ghost" style={{ flex: 1 }} onClick={() => setShowCreateActivity(false)}>Cancel</button>
                <button type="submit" className="neo-btn neo-btn--primary" style={{ flex: 1, backgroundColor: 'var(--color-pink)' }}>Publish to Map</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
