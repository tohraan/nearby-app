import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Search, MapPin, List, Map as MapIcon, Star, Bell, ExternalLink, SlidersHorizontal, Heart, X } from 'lucide-react';
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

const CITIES = ['all', 'Dubai', 'Abu Dhabi', 'Sharjah', 'Ras Al Khaimah', 'Ajman'];

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
  const [view, setView] = useState('list'); // 'list' vs 'map'
  const [showFilterModal, setShowFilterModal] = useState(false);
  
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
  }, []);

  // Reset infinite scroll pagination when filters change
  useEffect(() => {
    setPage(1);
  }, [category, search, selectedCity, selectedDistance]);

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

    return result;
  }, [places, lat, lng, selectedCity, selectedDistance, category, search]);

  // Infinite Scroll Paginated Subset
  const visiblePlaces = useMemo(() => {
    return filteredPlaces.slice(0, page * pageSize);
  }, [filteredPlaces, page]);

  const hasMore = visiblePlaces.length < filteredPlaces.length;

  // IntersectionObserver for Continuous Infinite Scroll
  useEffect(() => {
    const target = observerTargetRef.current;
    if (!target || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPage(prev => prev + 1);
        }
      },
      { rootMargin: '300px' }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore]);

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
      {/* ─── 3 Distinct Visual Bands at Top of Screen ─── */}
      <div style={{ marginBottom: '20px' }}>
        {/* Band a: Search bar (full width) + single Filter icon button */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="neo-input"
              type="text"
              placeholder="Search cafes, rooftop bars, beaches..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: '42px', height: '48px', fontSize: '15px', borderRadius: '10px' }}
            />
          </div>

          <button
            className="neo-btn neo-btn--secondary neo-btn--icon"
            onClick={() => setShowFilterModal(true)}
            style={{ width: '48px', height: '48px', flexShrink: 0, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px' }}
            title="Filter Options"
          >
            <SlidersHorizontal size={20} color="var(--text-primary)" />
          </button>
        </div>

        {/* Band b: One line of current context text (city + radius) with a Change link */}
        <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>📍 {selectedCity === 'all' ? 'All UAE Cities' : selectedCity}</span>
          <span>•</span>
          <span>{DISTANCES.find(d => d.val === selectedDistance)?.label || 'Any Radius'}</span>
          <button
            onClick={() => setShowFilterModal(true)}
            style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', marginLeft: '4px' }}
          >
            Change
          </button>
        </div>

        {/* Band c: Category filter chips as ONE horizontally scrollable pill row */}
        <div className="category-chips-wrapper" style={{ marginTop: '12px', borderBottom: 'none', paddingBottom: 0 }}>
          <div className="category-chips" style={{ padding: '4px 0' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                className={`category-chip ${category === cat ? 'category-chip--active' : ''}`}
                onClick={() => setCategory(cat)}
                style={category === cat ? { backgroundColor: 'var(--color-black)', color: 'var(--color-white)', borderColor: 'var(--color-black)' } : { backgroundColor: 'var(--color-white)' }}
              >
                {cat !== 'all' && CATEGORY_EMOJI[cat]} {cat === 'all' ? 'All' : CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Expandable Filter Panel Modal ─── */}
      {showFilterModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, 
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4)'
        }}>
          <div className="neo-card" style={{ maxWidth: '420px', width: '100%', padding: 'var(--space-6)', position: 'relative' }}>
            <button
              onClick={() => setShowFilterModal(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>Filter Locations</h3>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>Emirate / City</label>
              <select
                className="neo-input"
                value={selectedCity}
                onChange={e => setSelectedCity(e.target.value)}
                style={{ width: '100%', height: '44px', fontSize: '14px' }}
              >
                <option value="all">📍 All UAE Cities</option>
                <option value="Dubai">🏙️ Dubai</option>
                <option value="Abu Dhabi">🕌 Abu Dhabi</option>
                <option value="Sharjah">🏛️ Sharjah</option>
                <option value="Ras Al Khaimah">⛰️ Ras Al Khaimah</option>
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>Discovery Distance</label>
              <select
                className="neo-input"
                value={selectedDistance}
                onChange={e => setSelectedDistance(e.target.value)}
                style={{ width: '100%', height: '44px', fontSize: '14px' }}
              >
                {DISTANCES.map(d => (
                  <option key={d.val} value={d.val}>{d.label}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--color-cream)', borderRadius: '8px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bell size={18} color="var(--text-primary)" />
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Nearby Alerts</span>
              </div>
              <button
                className="neo-btn neo-btn--xs neo-btn--secondary"
                onClick={requestNotificationPermission}
              >
                {notificationStatus === 'granted' ? 'Enabled' : 'Enable'}
              </button>
            </div>

            <button
              className="neo-btn neo-btn--primary"
              style={{ width: '100%', height: '46px', fontWeight: 700 }}
              onClick={() => setShowFilterModal(false)}
            >
              Apply Filters ({filteredPlaces.length} Spots)
            </button>
          </div>
        </div>
      )}

      {/* ─── Featured & Trending Section ─── */}
      <TrendingTicker onNavigateToPlace={onNavigateToPlace} />

      {/* ─── Full Map View (When Map toggle selected) ─── */}
      {view === 'map' && (
        <div 
          className="map-container" 
          style={{ 
            position: 'relative', 
            width: '100%', 
            height: 'clamp(550px, 78vh, 800px)',
            marginBottom: 'var(--space-5)',
            borderRadius: '16px',
            overflow: 'hidden',
            border: '2px solid var(--color-black)',
            boxShadow: '4px 4px 0 var(--color-black)'
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
          
          {/* Floating Bottom Card on Map Selection */}
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
                backgroundColor: 'var(--color-paper)'
              }}
            >
              <button 
                onClick={() => setSelectedPlaceId(null)}
                style={{ position: 'absolute', top: '8px', right: '8px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
              >
                ✕
              </button>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ fontSize: '24px' }}>{CATEGORY_EMOJI[selectedLocation.category || 'outdoor']}</div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: 700 }}>{selectedLocation.name}</h3>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span>{selectedLocation.category}</span>
                    {selectedLocation.distance !== undefined && (
                      <>
                        <span>•</span>
                        <span><MapPin size={10} style={{ display: 'inline', marginBottom: '-1px' }} /> {formatDistance(selectedLocation.distance)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button className="neo-btn neo-btn--primary" onClick={() => onNavigateToPlace?.(selectedLocation.id)} style={{ flex: 1 }}>
                  View Details
                </button>
                <a
                  href={getActionableUrl(selectedLocation)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="neo-btn neo-btn--secondary"
                  style={{ flex: 1, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '13px', fontWeight: 700 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {getActionLabel(selectedLocation)} <ExternalLink size={12} />
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Main Results Discovery Grid (List View) ─── */}
      {view === 'list' && (
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <h2 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 700 }}>
              Popular Near You ({filteredPlaces.length})
            </h2>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Showing {visiblePlaces.length} of {filteredPlaces.length} spots
            </span>
          </div>

          {visiblePlaces.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">🔍</div>
              <div className="empty-state__title">No spots match your filters</div>
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
              {visiblePlaces.map(place => {
                const ctaLabel = getActionLabel(place);
                const isSaved = savedIds.has(place.id);

                return (
                  <div 
                    key={place.id} 
                    className="neo-card neo-card--clickable place-card" 
                    style={{ padding: '12px', display: 'flex', flexDirection: 'column' }}
                    onClick={() => onNavigateToPlace?.(place.id)}
                  >
                    {/* Clean photo - NO category badge on photo! */}
                    <div className="place-card__image" style={{ position: 'relative', overflow: 'hidden', height: '145px', borderRadius: '8px', border: '1.5px solid var(--color-black)', marginBottom: '10px' }}>
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
                    </div>

                    {/* Category tag moved onto white body ABOVE place name */}
                    <div className={`category-tag category-tag--${place.category}`}>
                      {CATEGORY_EMOJI[place.category]} {place.category}
                    </div>

                    {/* Place Name in Serif Typography */}
                    <div className="place-card__name">{place.name}</div>
                    
                    {/* Rating + distance + city on one line in muted metadata */}
                    <div className="place-card__meta">
                      <span className="place-card__rating"><Star size={12} fill="var(--color-yellow)" stroke="var(--color-black)" /> {place.rating}</span>
                      <span>•</span>
                      <span className="place-card__distance"><MapPin size={12} /> {formatDistance(place.distance)}</span>
                      {place.city && <><span>•</span><span>{place.city}</span></>}
                    </div>

                    {/* Action Row: ONE primary button (filled, primary accent) + ONE save icon button */}
                    <div className="place-card__actions">
                      <a
                        href={getActionableUrl(place)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="neo-btn neo-btn--sm neo-btn--primary"
                        style={{ flex: 1, textDecoration: 'none', fontWeight: 700, padding: '0 12px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {ctaLabel} <ExternalLink size={12} />
                      </a>
                      <button
                        className={`place-card__save-btn ${isSaved ? 'place-card__save-btn--saved' : ''}`}
                        onClick={(e) => { e.stopPropagation(); handleToggleSave(place.id); }}
                        title={isSaved ? 'Unsave place' : 'Save place'}
                        aria-label="Save place"
                      >
                        <Heart size={18} fill={isSaved ? 'var(--color-black)' : 'none'} color="var(--color-black)" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Infinite Scroll Load Trigger */}
          {hasMore && (
            <div ref={observerTargetRef} style={{ textAlign: 'center', marginTop: '24px', paddingBottom: '16px' }}>
              <button
                className="neo-btn neo-btn--secondary"
                onClick={() => setPage(prev => prev + 1)}
                style={{ fontWeight: 700, padding: '10px 24px' }}
              >
                Load More Places (+12)
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─── Neutral Active State View Toggle (List vs Map) ─── */}
      <div className="view-toggle">
        <button
          className={`view-toggle__btn ${view === 'list' ? 'view-toggle__btn--active' : ''}`}
          onClick={() => setView('list')}
          aria-label="List view"
          style={view === 'list' ? { backgroundColor: 'var(--color-black)', color: 'var(--color-white)' } : { backgroundColor: 'var(--color-white)', color: 'var(--color-black)' }}
        >
          <List size={16} /> List View
        </button>
        <button
          className={`view-toggle__btn ${view === 'map' ? 'view-toggle__btn--active' : ''}`}
          onClick={() => setView('map')}
          aria-label="Map view"
          style={view === 'map' ? { backgroundColor: 'var(--color-black)', color: 'var(--color-white)' } : { backgroundColor: 'var(--color-white)', color: 'var(--color-black)' }}
        >
          <MapIcon size={16} /> Map View
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
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', marginBottom: 'var(--space-2)' }}>Never miss out</h2>
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
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', marginBottom: 'var(--space-4)' }}>Host an Activity</h2>
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
                <button type="submit" className="neo-btn neo-btn--primary" style={{ flex: 1 }}>Publish to Map</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

