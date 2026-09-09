/**
 * NearbyFeed.jsx — Main discovery screen
 * Shows places near user with category filters, search, map/list toggle,
 * live activity strip, and group cards.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, MapPin, List, Map as MapIcon, Star, Wifi, WifiOff, Bell, Check } from 'lucide-react';
import { useGeolocation } from '../hooks/useGeolocation.js';
import { useOnlineStatus } from '../hooks/useOnlineStatus.js';
import { getCachedPlaces, getSavedPlaceIds, savePlaceLocally, unsavePlaceLocally, getVisitedPlaceIds } from '../lib/db.js';
import { sortByDistance, formatDistance, CATEGORY_EMOJI, CATEGORY_LABELS, getPlaceImage } from '../lib/geo.js';
import { FALLBACK_PLACES } from '../lib/fallbackData.js';
import { queueAction } from '../lib/offlineSync.js';
import api from '../lib/api.js';
import CustomMap from '../components/CustomMap.jsx';

const CATEGORIES = ['all', 'food', 'cafe', 'nightlife', 'entertainment', 'outdoor', 'sports', 'culture', 'attraction', 'shopping'];

export default function NearbyFeed({ onNavigateToGroup, onNavigateToPlace }) {
  const { lat, lng, isDefault } = useGeolocation();
  const isOnline = useOnlineStatus();

  const [places, setPlaces] = useState([]);
  const [savedIds, setSavedIds] = useState(new Set());
  const [visitedIds, setVisitedIds] = useState(new Set());
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [view, setView] = useState('list');
  const [selectedPlaceId, setSelectedPlaceId] = useState(null);
  const [groups, setGroups] = useState([]);
  const [showCreateActivity, setShowCreateActivity] = useState(false);
  const [activityForm, setActivityForm] = useState({ name: '', category: 'outdoor', activityType: '', startsAt: '', maxPeople: 0, cost: 0 });
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({ interests: [], maxDistance: 20 });
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  // Load places from IndexedDB and profile from localStorage
  useEffect(() => {
    async function load() {
      const cached = await getCachedPlaces();
      
      // Fallback Data Logic: If no places found (e.g. Dubai bounding box failed), use UAE Highlights
      if (cached.length === 0) {
        setPlaces(FALLBACK_PLACES);
      } else {
        setPlaces(cached);
      }
      
      const saved = await getSavedPlaceIds();
      setSavedIds(new Set(saved));
      
      const visited = await getVisitedPlaceIds();
      setVisitedIds(new Set(visited));
      
      const storedProfile = localStorage.getItem('nearby_profile');
      if (storedProfile) {
        try { setProfile(JSON.parse(storedProfile)); } catch(e){}
      }
      
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

  // Filter and sort places
  const filteredPlaces = useMemo(() => {
    let result = sortByDistance(places, lat, lng);
    
    // Apply distance filter from profile
    if (profile.maxDistance && profile.maxDistance < 20) {
      result = result.filter(p => p.distance <= profile.maxDistance);
    }

    if (category !== 'all') {
      result = result.filter(p => p.category === category);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.cuisine?.some(c => c.toLowerCase().includes(q)) ||
        p.tags?.some(t => t.toLowerCase().includes(q))
      );
    }

    return result.slice(0, 100);
  }, [places, lat, lng, category, search, profile.maxDistance]);

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
        creatorDeviceId: profile.deviceId || 'unknown',
      };
      
      const res = await api.createGroup(newActivity);
      if (res.id) {
        setGroups([{ id: res.id, ...newActivity, member_count: 1 }, ...groups]);
        setShowCreateActivity(false);
        setActivityForm({ name: '', category: 'outdoor', activityType: '', startsAt: '', maxPeople: 0, cost: 0 });
        
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification('Activity Created', { body: `Your ${activityForm.category} activity is now live on the map!` });
        }
      }
    } catch (err) {
      console.error('Failed to create activity', err);
      alert('Failed to create activity. Please try again.');
    }
  };

  const isBrowsing = category !== 'all' || search.trim().length > 0;
  
  const popularPlaces = useMemo(() => {
    const preferredCats = profile.interests?.length > 0 ? profile.interests : ['food', 'attraction', 'cafe', 'culture'];
    let popular = filteredPlaces.filter(p => preferredCats.includes(p.category));
    
    // If strict interest filtering yields nothing, fallback to top nearby places
    if (popular.length === 0) {
      popular = filteredPlaces;
    }
    return popular.slice(0, 6);
  }, [filteredPlaces, profile.interests]);
  
  const selectedLocation = useMemo(() => {
    if (!selectedPlaceId) return null;
    const place = filteredPlaces.find(p => p.id === selectedPlaceId);
    if (place) return { ...place, isGroup: false };
    const group = groups.find(g => g.id === selectedPlaceId);
    if (group) return { ...group, isGroup: true };
    return null;
  }, [selectedPlaceId, filteredPlaces, groups]);

  const hiddenGems = useMemo(() => {
    const avoidCats = ['shopping', 'mall'];
    let gems = filteredPlaces.filter(p => !avoidCats.includes(p.category));
    
    // Try to match interests if they exist
    if (profile.interests?.length > 0) {
      const matched = gems.filter(p => profile.interests.includes(p.category));
      if (matched.length > 0) gems = matched;
    }
    
    // Pick places slightly further away (bottom half of the sorted array)
    // If very few places, just pick the last few
    const startIndex = Math.min(3, Math.floor(gems.length / 2));
    return gems.slice(startIndex, startIndex + 6);
  }, [filteredPlaces, profile.interests]);

  if (loading) {
    return (
      <div className="app-shell__content">
        <div className="nearby-hero">
          <div className="skeleton" style={{ width: '100px', height: '14px', marginBottom: '12px' }} />
          <div className="skeleton" style={{ width: '80%', height: '48px', marginBottom: '8px' }} />
          <div className="skeleton" style={{ width: '60%', height: '48px' }} />
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
      {/* ─── Hero / Onboarding ─── */}
      <div className="nearby-hero" style={{ position: 'relative' }}>
        <button 
          className="neo-btn neo-btn--ghost neo-btn--icon"
          style={{ position: 'absolute', top: 'var(--space-2)', right: 'var(--space-2)', background: 'var(--color-cream)' }}
          onClick={() => {
            if (notificationStatus === 'default') {
              setShowNotificationPrompt(true);
            }
          }}
          title="Enable Notifications"
        >
          <Bell size={20} color={notificationStatus === 'granted' ? 'var(--color-purple)' : 'var(--text-primary)'} />
        </button>
        
        {profile.name && profile.name !== 'Guest User' ? (
          <h1 className="nearby-hero__heading" style={{ fontSize: 'clamp(28px, 5vw, 42px)', lineHeight: 1.1, marginBottom: 'var(--space-2)' }}>
            GOOD MORNING,<br />
            <span>{profile.name.toUpperCase()}</span>
          </h1>
        ) : (
          <h1 className="nearby-hero__heading" style={{ fontSize: 'clamp(28px, 5vw, 42px)', lineHeight: 1.1, marginBottom: 'var(--space-2)' }}>
            WELCOME,<br />
            <span>EXPLORER</span>
          </h1>
        )}
        <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>
          Discover curated places and experiences {isDefault ? 'in the UAE' : 'near you'}.
        </p>
      </div>

      {/* ─── Controls ─── */}
      <div className="nearby-controls">
        <div className="nearby-controls__row">
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="neo-input neo-input--large"
              type="text"
              placeholder="Coffee then movies..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: '42px' }}
            />
          </div>
        </div>

        <div className="category-chips-wrapper">
          <div className="category-chips">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                className={`category-chip ${category === cat ? 'category-chip--active' : ''}`}
                onClick={() => setCategory(cat)}
              >
                {cat !== 'all' && CATEGORY_EMOJI[cat]} {cat === 'all' ? '✦ All' : CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Custom Offline English Map View ─── */}
      {view === 'map' && (
        <div className="map-container" style={{ position: 'relative', width: '100%', height: '100%' }}>
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
          
          {/* Floating Bottom Sheet */}
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
                style={{ position: 'absolute', top: '8px', right: '8px', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                ✕
              </button>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ fontSize: '24px' }}>{CATEGORY_EMOJI[selectedLocation.category || 'outdoor']}</div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>{selectedLocation.name}</h3>
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
                  <button className="neo-btn neo-btn--primary" onClick={() => onNavigateToPlace?.(selectedLocation.id)}>
                    View Place
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── Places Grid / Curated View ─── */}
      {!isBrowsing && view === 'list' && (
        <>
          <div style={{ marginBottom: 'var(--space-6)' }}>
            <h3 style={{ marginBottom: 'var(--space-3)', fontSize: '18px', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Popular Near You
            </h3>
            <div style={{ display: 'flex', gap: 'var(--space-3)', overflowX: 'auto', paddingBottom: 'var(--space-2)', scrollbarWidth: 'none', scrollSnapType: 'x mandatory', marginInline: 'calc(var(--space-4) * -1)', paddingInline: 'var(--space-4)' }}>
              {popularPlaces.map(place => (
                <div 
                  key={place.id} 
                  className="neo-card neo-card--clickable place-card" 
                  style={{ minWidth: 'min(80vw, 260px)', flexShrink: 0, scrollSnapAlign: 'start', padding: '12px' }}
                  onClick={() => onNavigateToPlace?.(place.id)}
                >
                  <div className="place-card__image" style={{ position: 'relative', overflow: 'hidden', height: '135px', borderRadius: '10px', border: '2px solid var(--color-black)', marginBottom: '8px' }}>
                    <img 
                      src={getPlaceImage(place)} 
                      alt={place.name} 
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
                        fontWeight: 800,
                        boxShadow: '2px 2px 0 var(--color-black)',
                        textTransform: 'uppercase'
                      }}
                    >
                      {CATEGORY_EMOJI[place.category]} {place.category}
                    </div>
                  </div>
                  <div className="place-card__name" style={{ fontSize: '15px', fontWeight: 800, lineHeight: 1.2 }}>{place.name}</div>
                  <div className="place-card__meta" style={{ marginTop: '4px', fontSize: '12px' }}>
                    <span className="place-card__rating"><Star size={12} fill="var(--color-yellow)" stroke="var(--color-black)" /> {place.rating}</span>
                    <span style={{ color: 'var(--text-muted)' }}>•</span>
                    <span className="place-card__distance"><MapPin size={12} /> {formatDistance(place.distance)}</span>
                  </div>
                  <div className="place-card__actions" style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{place.city}</span>
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
          </div>
          
          <div style={{ marginBottom: 'var(--space-6)' }}>
            <h3 style={{ marginBottom: 'var(--space-3)', fontSize: '18px', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Hidden Gems
            </h3>
            <div style={{ display: 'flex', gap: 'var(--space-3)', overflowX: 'auto', paddingBottom: 'var(--space-2)', scrollbarWidth: 'none', scrollSnapType: 'x mandatory', marginInline: 'calc(var(--space-4) * -1)', paddingInline: 'var(--space-4)' }}>
              {hiddenGems.map(place => (
                <div 
                  key={place.id} 
                  className="neo-card neo-card--clickable place-card" 
                  style={{ minWidth: 'min(80vw, 260px)', flexShrink: 0, scrollSnapAlign: 'start', padding: '12px' }}
                  onClick={() => onNavigateToPlace?.(place.id)}
                >
                  <div className="place-card__image" style={{ position: 'relative', overflow: 'hidden', height: '135px', borderRadius: '10px', border: '2px solid var(--color-black)', marginBottom: '8px' }}>
                    <img 
                      src={getPlaceImage(place)} 
                      alt={place.name} 
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
                        fontWeight: 800,
                        boxShadow: '2px 2px 0 var(--color-black)',
                        textTransform: 'uppercase'
                      }}
                    >
                      {CATEGORY_EMOJI[place.category]} {place.category}
                    </div>
                  </div>
                  <div className="place-card__name" style={{ fontSize: '15px', fontWeight: 800, lineHeight: 1.2 }}>{place.name}</div>
                  <div className="place-card__meta" style={{ marginTop: '4px', fontSize: '12px' }}>
                    <span className="place-card__rating"><Star size={12} fill="var(--color-yellow)" stroke="var(--color-black)" /> {place.rating}</span>
                    <span style={{ color: 'var(--text-muted)' }}>•</span>
                    <span className="place-card__distance"><MapPin size={12} /> {formatDistance(place.distance)}</span>
                  </div>
                  <div className="place-card__actions" style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{place.city}</span>
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
          </div>
        </>
      )}

      {/* ─── Search Results Grid ─── */}
      {isBrowsing && view === 'list' && (
        filteredPlaces.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">🔍</div>
            <div className="empty-state__title">NOTHING HERE YET</div>
            <div className="empty-state__desc">
              {search ? 'No places match your search. Try different keywords.' : 'No places found in this category nearby.'}
            </div>
          </div>
        ) : (
          <div className="nearby-grid">
            {filteredPlaces.map(place => (
              <div 
                key={place.id} 
                className="neo-card neo-card--clickable place-card"
                style={{ padding: '12px' }}
                onClick={() => onNavigateToPlace?.(place.id)}
              >
                <div className="place-card__image" style={{ position: 'relative', overflow: 'hidden', height: '140px', borderRadius: '10px', border: '2px solid var(--color-black)', marginBottom: '8px' }}>
                  <img 
                    src={getPlaceImage(place)} 
                    alt={place.name} 
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
                      fontWeight: 800,
                      boxShadow: '2px 2px 0 var(--color-black)',
                      textTransform: 'uppercase'
                    }}
                  >
                    {CATEGORY_EMOJI[place.category]} {place.category}
                  </div>
                </div>
                <div className="place-card__name" style={{ fontSize: '15px', fontWeight: 800, lineHeight: 1.2 }}>{place.name}</div>
                <div className="place-card__meta" style={{ marginTop: '4px', fontSize: '12px' }}>
                  <span className="place-card__rating">
                    <Star size={13} fill="var(--color-yellow)" stroke="var(--color-black)" /> {place.rating}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>•</span>
                  <span className="place-card__distance">
                    <MapPin size={12} /> {formatDistance(place.distance)}
                  </span>
                </div>
                <div className="place-card__actions" style={{ marginTop: 'auto' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{place.city}</span>
                  <button
                    className={`place-card__save-btn ${savedIds.has(place.id) ? 'place-card__save-btn--saved' : ''}`}
                    onClick={(e) => { e.stopPropagation(); handleToggleSave(place.id); }}
                    aria-label={savedIds.has(place.id) ? 'Unsave place' : 'Save place'}
                  >
                    {savedIds.has(place.id) ? '❤️' : '🤍'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ─── Floating View Toggle ─── */}
      <div className="view-toggle">
        <button
          className={`view-toggle__btn ${view === 'list' ? 'view-toggle__btn--active' : ''}`}
          onClick={() => setView('list')}
          aria-label="List view"
        >
          <List size={16} /> LIST
        </button>
        <button
          className={`view-toggle__btn ${view === 'map' ? 'view-toggle__btn--active' : ''}`}
          onClick={() => setView('map')}
          aria-label="Map view"
        >
          <MapIcon size={16} /> MAP
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
              Enable notifications to get alerts when you're near a hidden gem or a popular hangout spot!
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
