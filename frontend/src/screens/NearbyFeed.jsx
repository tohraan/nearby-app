import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Search, MapPin, List, Map as MapIcon, Star, Bell, ExternalLink, SlidersHorizontal, Heart, X, ArrowUpDown, RotateCcw } from 'lucide-react';
import { useGeolocation } from '../hooks/useGeolocation.js';
import { useOnlineStatus } from '../hooks/useOnlineStatus.js';
import { getCachedPlaces, cachePlaces, getSavedPlaceIds, savePlaceLocally, unsavePlaceLocally, getVisitedPlaceIds } from '../lib/db.js';
import { sortByDistance, formatDistance, isValidDistance, CATEGORY_EMOJI, CATEGORY_LABELS, getPlaceImage, getActionableUrl, getActionLabel, TOP_LEVEL_VERTICALS, getVerticalForCategory, formatPriceDisplay, getPriceRangeSignal } from '../lib/geo.js';

import { FALLBACK_PLACES } from '../lib/fallbackData.js';
import { FALLBACK_MEETUPS } from '../lib/meetupData.js';
import { FALLBACK_MOVIES } from '../lib/movieData.js';
import { SEEDED_BUNDLES } from '../lib/bundleData.js';
import { queueAction } from '../lib/offlineSync.js';
import api from '../lib/api.js';
import CustomMap from '../components/CustomMap.jsx';
import TrendingTicker from '../components/TrendingTicker.jsx';
import MeetupCard from '../components/MeetupCard.jsx';
import MovieCard from '../components/MovieCard.jsx';
import BundleCard from '../components/BundleCard.jsx';
import VenueImage from '../components/VenueImage.jsx';
import PlaceDetail from './PlaceDetail.jsx';
import BundleDetail from './BundleDetail.jsx';
import VibeRouletteModal from '../components/VibeRouletteModal.jsx';

const CATEGORIES = ['all', 'meetups', 'movies', 'food', 'cafe', 'nightlife', 'entertainment', 'outdoor', 'sports', 'culture', 'attraction', 'shopping'];


const DISTANCES = [
  { label: 'Any Radius', val: 'all' },
  { label: '< 2 km', val: '2' },
  { label: '< 5 km', val: '5' },
  { label: '< 10 km', val: '10' },
  { label: '< 25 km', val: '25' },
  { label: '< 50 km', val: '50' }
];

export default function NearbyFeed({ onNavigateToGroup, onNavigateToPlace, onNavigateToMeetup, onNavigateToMovie, onHostMeetup }) {
  const { lat, lng } = useGeolocation();
  const isOnline = useOnlineStatus();

  const [places, setPlaces] = useState([]);
  const [savedIds, setSavedIds] = useState(new Set());
  const [visitedIds, setVisitedIds] = useState(new Set());
  const [selectedBundle, setSelectedBundle] = useState(null);
  
  // Filters & State
  const [activeVertical, setActiveVertical] = useState('all');
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedDistance, setSelectedDistance] = useState('all');
  const [sortBy, setSortBy] = useState('distance'); // 'distance' | 'rating' | 'trending'
  const [view, setView] = useState('list'); // 'list' vs 'map'
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showRoulette, setShowRoulette] = useState(false);
  
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
  // Track which place IDs just triggered a save animation (cleared after 400ms)
  const [justSavedIds, setJustSavedIds] = useState(new Set());
  const [visibleMapPlaces, setVisibleMapPlaces] = useState([]);

  // Load cached places & user saves
  useEffect(() => {
    async function load() {
      const cached = await getCachedPlaces();
      if (cached.length === 0) {
        setPlaces(FALLBACK_PLACES);
      } else {
        setPlaces(cached);
      }
      
      // Hydrate local cache and state from backend
      if (isOnline) {
        try {
          const fresh = await api.getPlaces();
          if (fresh && fresh.length > 0) {
            setPlaces(fresh);
            await cachePlaces(fresh);
          }
        } catch (err) {
          console.warn('Failed to fetch fresh places:', err);
        }
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

  const eatDrinkPlaces = useMemo(() => {
    return filteredPlaces.filter(p => ['food', 'cafe', 'nightlife'].includes(p.category));
  }, [filteredPlaces]);

  const attractionPlaces = useMemo(() => {
    return filteredPlaces.filter(p => ['attraction', 'culture', 'entertainment', 'outdoor', 'shopping'].includes(p.category));
  }, [filteredPlaces]);

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
      // Trigger the pop + particle animation
      setJustSavedIds(prev => new Set([...prev, placeId]));
      setTimeout(() => setJustSavedIds(prev => { const n = new Set(prev); n.delete(placeId); return n; }), 450);
      await savePlaceLocally(placeId);
      if (isOnline) {
        try { await api.savePlace(placeId); } catch { queueAction({ type: 'save', placeId }); }
      } else {
        queueAction({ type: 'save', placeId });
      }
    }

    setSavedIds(newSaved);
  }, [savedIds, isOnline]);

  const renderPlaceCard = useCallback((place) => {
    const ctaLabel = getActionLabel(place);
    const isSaved = savedIds.has(place.id);
    const addressExcerpt = place.address ? (place.address.length > 32 ? place.address.slice(0, 32) + '...' : place.address) : null;

    return (
      <div 
        key={place.id} 
        className="neo-card neo-card--clickable place-card-badge-layout" 
        onClick={() => onNavigateToPlace?.(place.id)}
      >
        <div className="place-card-top">
          {/* Fixed 68x68px top-left badge slot (Phase 3 Redesign) */}
          <div className="place-badge-slot">
            <VenueImage place={place} alt={place.name} />
          </div>

          {/* Right text column */}
          <div className="place-info-col">
            <div className="place-header-row">
              <div className={`category-tag category-tag--${place.category}`} style={{ fontFamily: 'var(--font-secondary)', fontSize: '11px' }}>
                {CATEGORY_EMOJI[place.category]} {place.category}{getPriceRangeSignal(place)}
              </div>
              {place.actionStatus === 'verified' && (
                <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--state-success)', backgroundColor: 'var(--color-mint)', padding: '1px 6px', borderRadius: '999px', border: '1px solid var(--color-black)' }}>
                  ✓ Verified
                </span>
              )}
            </div>

            <h3 className="place-title-name">{place.name}</h3>

            <div className="place-meta-line" style={{ fontFamily: 'var(--font-secondary)' }}>
              <span className="place-card__rating"><Star size={11} fill="var(--color-yellow)" stroke="var(--color-black)" /> {place.rating || 4.8}</span>
              <span>•</span>
              <span className="place-card__distance">{isValidDistance(place.distance) ? formatDistance(place.distance) : '—'}</span>
              {place.city && <><span>•</span><span>{place.city}</span></>}
            </div>

            {addressExcerpt && (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-secondary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <MapPin size={10} style={{ flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{addressExcerpt}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Row */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: 'auto', paddingTop: '8px' }}>
          <a
            href={getActionableUrl(place)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="neo-btn neo-btn--sm neo-btn--primary"
            style={{ flex: 1, textDecoration: 'none', fontWeight: 700, padding: '0 10px', fontSize: '12px', minHeight: '36px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
          >
            <span>{ctaLabel}</span>
            <ExternalLink size={12} />
          </a>

          <button
            className={[
              'place-card__save-btn',
              isSaved ? 'place-card__save-btn--saved' : '',
              justSavedIds.has(place.id) ? 'place-card__save-btn--just-saved' : '',
            ].join(' ')}
            onClick={(e) => { e.stopPropagation(); handleToggleSave(place.id); }}
            title={isSaved ? 'Unsave place' : 'Save place'}
            aria-label="Save place"
            style={{ width: '36px', height: '36px', minHeight: '36px', padding: 0 }}
          >
            {justSavedIds.has(place.id) && (
              <span className="save-particles" aria-hidden="true">
                {[1,2,3,4,5,6].map(i => <span key={i} className="save-particle" />)}
              </span>
            )}
            <Heart
              className="save-heart-icon"
              size={15}
              fill={isSaved ? '#FFFFFF' : 'none'}
              color={isSaved ? '#FFFFFF' : 'var(--color-black)'}
            />
          </button>
        </div>
      </div>
    );
  }, [savedIds, justSavedIds, handleToggleSave, onNavigateToPlace]);

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

  if (selectedBundle) {
    return (
      <BundleDetail 
        bundle={selectedBundle} 
        onBack={() => setSelectedBundle(null)} 
        onSelectPlace={(placeId) => {
          setSelectedBundle(null);
          onNavigateToPlace?.(placeId);
        }} 
      />
    );
  }

  return (
    <div className="app-shell__content">
      {/* ─── 3 Distinct Visual Bands at Top of Screen ─── */}
      <div style={{ marginBottom: '20px' }}>
        {/* Band a: Search bar (full width) + Roulette spin button + single Filter icon button */}
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

          {/* Vibe Roulette Header Button */}
          <button
            className="neo-btn"
            onClick={() => setShowRoulette(true)}
            style={{
              height: '48px',
              padding: '0 14px',
              backgroundColor: 'var(--color-yellow)',
              border: '2px solid var(--color-black)',
              borderRadius: '10px',
              fontWeight: 900,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '2px 2px 0 var(--color-black)',
              flexShrink: 0,
              cursor: 'pointer',
            }}
            title="Spin Vibe Roulette"
          >
            <span style={{ fontSize: '18px' }}>🎰</span>
            <span style={{ letterSpacing: '0.02em' }}>ROULETTE</span>
          </button>

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

        {/* Band c: 2-Tier Vertical Category Navigation */}
        <div style={{ marginTop: '14px' }}>
          {/* Tier 1: Top-Level Verticals */}
          <div className="vertical-tiles-grid">
            {TOP_LEVEL_VERTICALS.map(v => {
              const isActive = activeVertical === v.key;
              return (
                <button
                  key={v.key}
                  className={`vertical-tile vertical-tile--${v.key} ${isActive ? 'vertical-tile--active' : ''}`}
                  onClick={() => {
                    setActiveVertical(v.key);
                    if (v.key === 'all') setCategory('all');
                    else if (v.key === 'sports_meetups') setCategory('meetups');
                    else if (v.key === 'movies') setCategory('movies');
                    else if (v.subCategories && v.subCategories.length > 0) {
                      setCategory(v.subCategories[0]);
                    }
                  }}
                >
                  <span>{v.icon}</span>
                  <span>{v.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tier 2: Progressive Disclosure Sub-Categories (Only when top-level vertical selected) */}
          {activeVertical !== 'all' && activeVertical !== 'sports_meetups' && activeVertical !== 'movies' && (
            <div className="subcategory-row">
              <div className="category-chips" style={{ padding: '4px 0' }}>
                {TOP_LEVEL_VERTICALS.find(v => v.key === activeVertical)?.subCategories.map(cat => (
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
          )}
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
        <>
          <style>{`
            .split-view-container {
              display: flex;
              flex-direction: column;
              height: clamp(550px, 78vh, 800px);
              margin-bottom: var(--space-5);
              border-radius: 16px;
              overflow: hidden;
              border: 2px solid var(--color-black);
              box-shadow: 4px 4px 0 var(--color-black);
              position: relative;
            }
            .split-view-map {
              flex: 1;
              position: relative;
            }
            .split-view-panel {
              position: absolute;
              bottom: 0;
              left: 0;
              right: 0;
              z-index: 1000;
              transition: all 0.2s ease-out;
            }
            .split-view-panel--default {
              background: transparent;
              padding: 0 16px 16px 16px;
            }
            .split-view-panel--expanded {
              background-color: var(--color-paper);
              border-top: 3px solid var(--color-black);
              border-radius: 24px 24px 0 0;
              height: 80%;
              padding: 16px;
              box-shadow: 0 -4px 12px rgba(0,0,0,0.1);
            }
            .top-picks-header {
              display: none;
            }
            .compact-cards-container {
              display: flex;
              gap: 12px;
              overflow-x: auto;
              padding-bottom: 8px;
              scroll-snap-type: x mandatory;
            }
            .compact-cards-container::-webkit-scrollbar {
              display: none;
            }
            .compact-card-item {
              flex: 0 0 85%;
              scroll-snap-align: center;
              background-color: var(--color-paper);
            }
            @media (min-width: 900px) {
              .split-view-container {
                flex-direction: row;
              }
              .split-view-map {
                flex: 2;
                height: 100%;
              }
              .split-view-panel {
                position: relative;
                flex: 1;
                border-top: none;
                border-left: 2px solid var(--color-black);
                height: 100% !important;
                max-width: 450px;
                border-radius: 0;
              }
              .split-view-panel--default {
                background-color: var(--color-paper);
                padding: var(--space-4);
              }
              .split-view-panel--expanded {
                border-top: none;
                border-radius: 0;
                box-shadow: none;
                height: 100%;
                padding: var(--space-4);
              }
              .top-picks-header {
                display: block;
                font-family: var(--font-serif);
                font-size: 18px;
                font-weight: 700;
                margin-bottom: 16px;
              }
              .compact-cards-container {
                flex-direction: column;
                overflow-x: visible;
                scroll-snap-type: none;
                padding-bottom: 0;
              }
              .compact-card-item {
                flex: auto;
              }
            }
          `}</style>
          <div className="split-view-container">
            <div className="split-view-map">
              <CustomMap
                places={filteredPlaces}
                groups={groups}
                userLat={lat}
                userLng={lng}
                selectedPlaceId={selectedPlaceId}
                onSelectPlace={(id) => setSelectedPlaceId(id)}
                onVisiblePlacesChange={(places) => setVisibleMapPlaces(places)}
              />
            </div>
            
            <div className={`split-view-panel ${selectedPlaceId ? 'split-view-panel--expanded' : 'split-view-panel--default'}`} style={{ overflowY: selectedPlaceId ? 'auto' : 'visible' }}>
              {selectedPlaceId ? (
                <div style={{ animation: 'slideFadeIn 0.2s ease-out' }}>
                  <PlaceDetail 
                    placeId={selectedPlaceId} 
                    displayMode="panel" 
                    onBack={() => setSelectedPlaceId(null)}
                    onNavigateToPlace={onNavigateToPlace}
                    onNavigateToMeetup={onNavigateToMeetup}
                    onNavigateToMovie={onNavigateToMovie}
                  />
                </div>
              ) : (
                <div style={{ animation: 'slideFadeIn 0.2s ease-out' }}>
                  <h3 className="top-picks-header">Top picks here</h3>
                  {visibleMapPlaces.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px', marginTop: '32px' }}>
                      No places found in this area. Try zooming out.
                    </div>
                  ) : (
                    <div className="compact-cards-container">
                      {visibleMapPlaces.map((place, idx) => (
                        <div 
                          key={place.id}
                          className="neo-card neo-card--clickable compact-card-item stagger-anim"
                          onClick={() => setSelectedPlaceId(place.id)}
                          style={{ padding: '12px', display: 'flex', gap: '12px', alignItems: 'center', animationDelay: `${idx * 80}ms` }}
                        >
                          <div style={{ width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '1.5px solid var(--color-black)', flexShrink: 0 }}>
                            <VenueImage place={place} alt={place.name} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '15px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{place.name}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                              ⭐ {place.rating || 4.8}{isValidDistance(place.distance) ? ` • ${formatDistance(place.distance)}` : ''}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {CATEGORY_EMOJI[place.category]} <span>{place.category}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <style>{`
            @keyframes slideFadeIn {
              from { opacity: 0; transform: translateY(10px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .stagger-anim {
              opacity: 0;
              animation: slideFadeIn 0.2s ease-out forwards;
            }
          `}</style>
        </>
      )}

      {/* ─── Main Results Discovery Grid (List View) ─── */}
      {view === 'list' && (
        <div style={{ marginBottom: '32px' }}>
          {category === 'meetups' ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <h2 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 700 }}>
                    🏐 Sports Meetups ({FALLBACK_MEETUPS.length})
                  </h2>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-secondary)' }}>
                    Join sports sessions happening across Dubai & UAE
                  </span>
                </div>

                <button 
                  className="neo-btn neo-btn--sm neo-btn--primary"
                  onClick={onHostMeetup}
                  style={{ fontWeight: 800 }}
                >
                  + Host Meetup
                </button>
              </div>

              <div className="discovery-grid">
                {FALLBACK_MEETUPS.map(m => (
                  <MeetupCard 
                    key={m.id} 
                    meetup={m} 
                    onSelect={() => onNavigateToMeetup?.(m.id)} 
                    onJoin={() => onNavigateToMeetup?.(m.id)}
                  />
                ))}
              </div>
            </div>
          ) : category === 'movies' ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <h2 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 700 }}>
                    🎬 Movies Nearby ({FALLBACK_MOVIES.length})
                  </h2>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-secondary)' }}>
                    Now showing across Reel, VOX & Novo cinemas
                  </span>
                </div>
              </div>

              <div className="discovery-grid">
                {FALLBACK_MOVIES.map(m => (
                  <MovieCard 
                    key={m.id} 
                    movie={m} 
                    onSelect={() => onNavigateToMovie?.(m.id)} 
                  />
                ))}
              </div>
            </div>
          ) : activeVertical === 'all' && category === 'all' ? (
            /* ─── PHASE 1: SECTIONED HOME VIEW (ALL VERTICALS AT ONCE) ─── */
            <div className="home-section-rows">
              {/* Row 1: Eat & Drink */}
              <div className="section-horizontal-row">
                <div className="section-row-header">
                  <div className="section-row-title">
                    <span>🍽️</span>
                    <h2>Eat & Drink</h2>
                    <span className="section-row-count">({eatDrinkPlaces.length} spots)</span>
                  </div>
                  <button className="section-see-all-btn" onClick={() => { setActiveVertical('eat_drink'); setCategory('food'); }}>
                    See all →
                  </button>
                </div>
                <div className="horizontal-row-track">
                  {eatDrinkPlaces.slice(0, 8).map(place => (
                    <div key={place.id} className="horizontal-row-card-item">
                      {renderPlaceCard(place)}
                    </div>
                  ))}
                </div>
              </div>

              {/* Row 2: Attractions & Culture */}
              <div className="section-horizontal-row">
                <div className="section-row-header">
                  <div className="section-row-title">
                    <span>🎟️</span>
                    <h2>Attractions & Culture</h2>
                    <span className="section-row-count">({attractionPlaces.length} spots)</span>
                  </div>
                  <button className="section-see-all-btn" onClick={() => { setActiveVertical('attractions'); setCategory('attraction'); }}>
                    See all →
                  </button>
                </div>
                <div className="horizontal-row-track">
                  {attractionPlaces.slice(0, 8).map(place => (
                    <div key={place.id} className="horizontal-row-card-item">
                      {renderPlaceCard(place)}
                    </div>
                  ))}
                </div>
              </div>

              {/* Row 3: Sports & Meetups */}
              <div className="section-horizontal-row">
                <div className="section-row-header">
                  <div className="section-row-title">
                    <span>🏐</span>
                    <h2>Sports & Meetups</h2>
                    <span className="section-row-count">({FALLBACK_MEETUPS.length} meetups)</span>
                  </div>
                  <button className="section-see-all-btn" onClick={() => { setActiveVertical('sports_meetups'); setCategory('meetups'); }}>
                    See all →
                  </button>
                </div>
                <div className="horizontal-row-track">
                  {FALLBACK_MEETUPS.slice(0, 6).map(meetup => (
                    <div key={meetup.id} className="horizontal-row-card-item">
                      <MeetupCard meetup={meetup} onSelect={() => onNavigateToMeetup?.(meetup.id)} onJoin={() => onNavigateToMeetup?.(meetup.id)} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Row 4: Movies Nearby */}
              <div className="section-horizontal-row">
                <div className="section-row-header">
                  <div className="section-row-title">
                    <span>🎬</span>
                    <h2>Movies Nearby</h2>
                    <span className="section-row-count">({FALLBACK_MOVIES.length} playing)</span>
                  </div>
                  <button className="section-see-all-btn" onClick={() => { setActiveVertical('movies'); setCategory('movies'); }}>
                    See all →
                  </button>
                </div>
                <div className="horizontal-row-track">
                  {FALLBACK_MOVIES.slice(0, 6).map(movie => (
                    <div key={movie.id} className="horizontal-row-card-item">
                      <MovieCard movie={movie} onSelect={() => onNavigateToMovie?.(movie.id)} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Row 5: Trip Bundles */}
              <div className="section-horizontal-row">
                <div className="section-row-header">
                  <div className="section-row-title">
                    <span>🧭</span>
                    <h2>Trip Bundles</h2>
                    <span className="section-row-count">({SEEDED_BUNDLES.length} itineraries)</span>
                  </div>
                </div>
                <div className="horizontal-row-track">
                  {SEEDED_BUNDLES.map(bundle => (
                    <div key={bundle.id} className="horizontal-row-card-item">
                      <BundleCard bundle={bundle} onSelect={(b) => setSelectedBundle(b)} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Single Vertical Filtered Grid View */
            <>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                <h2 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 700 }}>
                  Filtered Spots ({filteredPlaces.length})
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
                  className="discovery-grid"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '18px'
                  }}
                >
                  {visiblePlaces.map(place => renderPlaceCard(place))}
                </div>
              )}

              {hasMore && (
                <div ref={observerTargetRef} style={{ textAlign: 'center', marginTop: '24px', paddingBottom: '16px' }}>
                  <button
                    className="neo-btn neo-btn--secondary"
                    onClick={() => setPage(prev => prev + 1)}
                  >
                    Load More Spots ({filteredPlaces.length - visiblePlaces.length} remaining)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ─── View Toggle: sliding indicator ─── */}
      <div className="view-toggle">
        {/* The sliding black pill indicator */}
        <span className={`view-toggle__indicator view-toggle__indicator--${view}`} aria-hidden="true" />
        <button
          className={`view-toggle__btn ${view === 'list' ? 'view-toggle__btn--active' : ''}`}
          onClick={() => setView('list')}
          aria-label="List view"
        >
          <List size={16} /> List View
        </button>
        <button
          className={`view-toggle__btn ${view === 'map' ? 'view-toggle__btn--active' : ''}`}
          onClick={() => setView('map')}
          aria-label="Map view"
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

      {/* ─── Floating Vibe Roulette Action Button ─── */}
      <button
        onClick={() => setShowRoulette(true)}
        style={{
          position: 'fixed',
          bottom: '84px',
          right: '18px',
          zIndex: 90,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '10px 16px',
          backgroundColor: 'var(--color-yellow)',
          color: 'var(--color-black)',
          border: '2.5px solid var(--color-black)',
          borderRadius: '999px',
          fontWeight: 900,
          fontSize: '13px',
          boxShadow: '3px 3px 0 var(--color-black)',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
        title="Can't decide? Spin Vibe Roulette"
      >
        <span style={{ fontSize: '18px' }}>🎰</span>
        <span>SPIN VIBE</span>
      </button>

      {/* ─── Vibe Roulette Modal ─── */}
      <VibeRouletteModal
        isOpen={showRoulette}
        onClose={() => setShowRoulette(false)}
        places={places}
        userLat={lat}
        userLng={lng}
        onNavigateToPlace={onNavigateToPlace}
      />
    </div>
  );
}

