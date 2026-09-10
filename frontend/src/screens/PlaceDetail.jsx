/**
 * PlaceDetail.jsx — Guided Discovery & Conversion Detail Experience
 * Designed with Editorial Neo-Brutalism, Progressive Disclosure Reservation UX,
 * Contextual Itinerary Recommendations ("SINCE YOU'RE HERE..."), and Endowed Progress.
 */

import React, { useState, useEffect } from 'react';
import { 
  MapPin, ChevronLeft, Star, Heart, CheckCircle2, Calendar, Clock, 
  Users, Ticket, Compass, Car, Sparkles, Utensils, Coffee, ShieldCheck, 
  ExternalLink, Navigation, Check, Share2, Info, Flame, Trophy, Map
} from 'lucide-react';
import { getCachedPlaceById, getSavedPlaceIds, savePlaceLocally, unsavePlaceLocally, getVisitedPlaceIds, addVisitedPlaceLocally, removeVisitedPlaceLocally } from '../lib/db.js';
import { api } from '../lib/api.js';
import { useOnlineStatus } from '../hooks/useOnlineStatus.js';
import { CATEGORY_EMOJI, formatDistance, haversineKm, getPlaceImage, getActionableUrl, getActionLabel, FOOD_RESERVATION_CATEGORIES, TICKET_CATEGORIES } from '../lib/geo.js';
import { useGeolocation } from '../hooks/useGeolocation.js';
import { queueAction } from '../lib/offlineSync.js';
import { FALLBACK_PLACES } from '../lib/fallbackData.js';
"import { getCachedPlaces } from '../lib/db.js';"
import RelatedContent from '../components/RelatedContent.jsx';

export default function PlaceDetail({ placeId, onBack, onNavigateToPlace, onNavigateToMeetup, onNavigateToMovie }) {
  const [place, setPlace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isVisited, setIsVisited] = useState(false);
  const [visitedCount, setVisitedCount] = useState(1);
  const [ticketCount, setTicketCount] = useState(2);
  const [bookingTime, setBookingTime] = useState('7:00 PM');
  const [partySize, setPartySize] = useState(2);
  const [bookedSuccess, setBookedSuccess] = useState(false);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const isOnline = useOnlineStatus();
  const { lat, lng } = useGeolocation();

  useEffect(() => {
    async function load() {
      let p = await getCachedPlaceById(placeId);
      if (!p) {
        p = FALLBACK_PLACES.find(fp => fp.id === placeId);
      }
      if (p) setPlace(p);

      const savedIds = await getSavedPlaceIds();
      setIsSaved(savedIds.includes(placeId));

      const visitedIds = await getVisitedPlaceIds();
      setIsVisited(visitedIds.includes(placeId));
      setVisitedCount(visitedIds.length || 1);

      // Load nearby recommendations from cache
      try {
        const allCached = await getCachedPlaces();
        const nearby = allCached.filter(cp => cp.id !== placeId).slice(0, 3);
        setNearbyPlaces(nearby.length >= 3 ? nearby : FALLBACK_PLACES.filter(fp => fp.id !== placeId).slice(0, 3));
      } catch {
        setNearbyPlaces(FALLBACK_PLACES.filter(fp => fp.id !== placeId).slice(0, 3));
      }

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
      setVisitedCount(prev => prev + 1);
    } else {
      await removeVisitedPlaceLocally(placeId);
      setVisitedCount(prev => Math.max(0, prev - 1));
    }
  };

  const handleBookNow = () => {
    setBookedSuccess(true);
    setTimeout(() => setBookedSuccess(false), 4500);
  };

  if (loading) {
    return (
      <div className="app-shell__content" style={{ maxWidth: '960px', margin: '0 auto' }}>
        <div className="skeleton" style={{ width: '160px', height: '36px', marginBottom: '24px', borderRadius: '20px' }} />
        <div className="skeleton" style={{ width: '100%', height: '320px', borderRadius: '16px', marginBottom: '24px' }} />
        <div className="skeleton" style={{ width: '70%', height: '40px', marginBottom: '16px' }} />
      </div>
    );
  }

  if (!place) {
    return (
      <div className="app-shell__content empty-state" style={{ maxWidth: '960px', margin: '0 auto' }}>
        <div className="empty-state__icon">📍</div>
        <div className="empty-state__title">PLACE NOT FOUND</div>
        <div className="empty-state__desc">We couldn't locate this place record.</div>
        <button className="neo-btn neo-btn--primary" onClick={onBack}>RETURN TO DISCOVERY</button>
      </div>
    );
  }

  const distance = (place.lat && place.lng && lat && lng) ? haversineKm(lat, lng, place.lat, place.lng) : null;
  const category = place.category || 'outdoor';
  const nearbyRecommendations = nearbyPlaces;

  // Booking panel type by category
  const isFood = FOOD_RESERVATION_CATEGORIES.has(category);
  const isTicket = TICKET_CATEGORIES.has(category);
  const isOutdoor = !isFood && !isTicket;

  return (
    <div className="app-shell__content" style={{ maxWidth: '960px', margin: '0 auto', paddingBottom: '32px' }}>
      
      {/* ─── 1. BACK TO DISCOVERY BAR ─── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <button
          onClick={onBack}
          className="neo-btn neo-btn--secondary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 18px',
            fontSize: '13px',
            fontWeight: 900,
            backgroundColor: 'var(--color-paper)',
            color: 'var(--color-black)',
            borderRadius: '24px',
            border: '2px solid var(--color-black)',
            boxShadow: '2.5px 2.5px 0 var(--color-black)',
            cursor: 'pointer'
          }}
        >
          <ChevronLeft size={18} strokeWidth={3} /> BACK TO DISCOVERY
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleToggleSave}
            className={`neo-btn ${isSaved ? 'neo-btn--accent' : 'neo-btn--secondary'}`}
            style={{
              padding: '8px 14px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: 900,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: isSaved ? 'var(--color-pink)' : 'var(--color-paper)'
            }}
          >
            <Heart size={16} fill={isSaved ? 'var(--color-black)' : 'none'} stroke="var(--color-black)" />
            <span>{isSaved ? 'SAVED' : 'SAVE'}</span>
          </button>
        </div>
      </div>

      {/* ─── 2. EDITORIAL HERO & OVERVIEW COMPOSITION ─── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
          gap: '24px',
          alignItems: 'stretch',
          marginBottom: '28px'
        }}
      >
        {/* Hero Image Container */}
        <div
          style={{
            position: 'relative',
            borderRadius: '16px',
            border: '3px solid var(--color-black)',
            boxShadow: '6px 6px 0 var(--color-black)',
            overflow: 'hidden',
            minHeight: '280px',
            backgroundColor: 'var(--color-cream)'
          }}
        >
          <img
            src={getPlaceImage(place)}
            alt={place.name}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&auto=format&fit=crop&q=80';
            }}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />

          {/* Category Overlay Tag */}
          <div
            style={{
              position: 'absolute',
              top: '14px',
              left: '14px',
              backgroundColor: 'var(--color-yellow)',
              border: '2px solid var(--color-black)',
              borderRadius: '8px',
              padding: '4px 12px',
              fontSize: '11px',
              fontWeight: 900,
              boxShadow: '2.5px 2.5px 0 var(--color-black)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}
          >
            {CATEGORY_EMOJI[place.category]} {place.category}
          </div>

          {/* Fresh Day / City Overlay Tag */}
          <div
            style={{
              position: 'absolute',
              bottom: '14px',
              left: '14px',
              backgroundColor: 'var(--color-paper)',
              border: '2px solid var(--color-black)',
              borderRadius: '8px',
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: 800,
              boxShadow: '2.5px 2.5px 0 var(--color-black)'
            }}
          >
            📍 {place.city || 'Dubai'} • Fresh Day Spot
          </div>
        </div>

        {/* Hero Information & Decision Context */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {/* Rating & Distance Metrics */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                backgroundColor: 'var(--color-yellow)',
                border: '2px solid var(--color-black)',
                borderRadius: '8px',
                padding: '4px 10px',
                fontSize: '13px',
                fontWeight: 900,
                boxShadow: '2px 2px 0 var(--color-black)'
              }}
            >
              <Star size={15} fill="var(--color-black)" /> {place.rating || '4.8'}
              <span style={{ fontWeight: 700, fontSize: '11px', opacity: 0.85 }}>(120+ reviews)</span>
            </span>

            {distance != null && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: 'var(--color-mint)',
                  border: '2px solid var(--color-black)',
                  borderRadius: '8px',
                  padding: '4px 10px',
                  fontSize: '12px',
                  fontWeight: 900,
                  boxShadow: '2px 2px 0 var(--color-black)'
                }}
              >
                <MapPin size={13} /> {formatDistance(distance)}
              </span>
            )}
          </div>

          {/* Dominant Place Name Typography */}
          <h1
            style={{
              fontSize: 'clamp(32px, 5vw, 44px)',
              lineHeight: 1.05,
              fontWeight: 900,
              letterSpacing: '-0.03em',
              marginBottom: '10px',
              color: 'var(--color-black)'
            }}
          >
            {place.name}
          </h1>

          {/* Location & Specialty Vibe Sub-heading */}
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', fontWeight: 600, lineHeight: 1.3, marginBottom: '18px' }}>
            {place.address || `${place.city} • Artisan Dining & Specialty Vibe`}
          </p>

          {/* Feature Badges (Subtle Secondary Metadata) */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 10px', backgroundColor: 'var(--color-cream)', border: '1.5px solid var(--color-black)', borderRadius: '6px' }}>
              ☕ Specialty Vibe
            </span>
            <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 10px', backgroundColor: 'var(--color-cream)', border: '1.5px solid var(--color-black)', borderRadius: '6px' }}>
              🌿 Outdoor Terrace
            </span>
            <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 10px', backgroundColor: 'var(--color-cream)', border: '1.5px solid var(--color-black)', borderRadius: '6px' }}>
              ⚡ High-Speed Wi-Fi
            </span>
            <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 10px', backgroundColor: 'var(--color-cream)', border: '1.5px solid var(--color-black)', borderRadius: '6px' }}>
              🅿️ Valet Parking
            </span>
          </div>
        </div>
      </div>

      {/* ─── 3. COMPACT QUICK ACTIONS ROW ─── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr',
          gap: '12px',
          marginBottom: '28px'
        }}
      >
        {/* Primary Action: Directions */}
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`}
          target="_blank"
          rel="noreferrer"
          className="neo-btn neo-btn--primary"
          style={{
            height: '48px',
            fontWeight: 900,
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
            gap: '8px',
            textDecoration: 'none',
            backgroundColor: 'var(--color-yellow)',
            color: 'var(--color-black)',
            boxShadow: '4px 4px 0 var(--color-black)',
            border: '2.5px solid var(--color-black)'
          }}
        >
          <Navigation size={18} /> GET DIRECTIONS
        </a>

        {/* Mark Visited Toggle with Endowed Progress */}
        <button
          className={`neo-btn ${isVisited ? 'neo-btn--secondary' : 'neo-btn--accent'}`}
          onClick={handleToggleVisited}
          style={{
            height: '48px',
            fontWeight: 900,
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
            gap: '6px',
            backgroundColor: isVisited ? 'var(--color-mint)' : 'var(--color-paper)',
            boxShadow: '3px 3px 0 var(--color-black)',
            border: '2px solid var(--color-black)'
          }}
        >
          {isVisited ? <><CheckCircle2 size={16} color="var(--color-black)" /> VISITED ({visitedCount})</> : 'MARK VISITED'}
        </button>

        {/* Official Web Link */}
        <a
          href={getActionableUrl(place)}
          target="_blank"
          rel="noopener noreferrer"
          className="neo-btn neo-btn--ghost"
          style={{
            height: '48px',
            fontWeight: 900,
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
            gap: '4px',
            textDecoration: 'none',
            backgroundColor: 'var(--color-cream)',
            border: '2px solid var(--color-black)',
            boxShadow: '3px 3px 0 var(--color-black)'
          }}
        >
          OFFICIAL SITE <ExternalLink size={12} />
        </a>
      </div>

      {/* ─── 4. CATEGORY-AWARE ACTION PANEL ─── */}
      <div
        className="neo-card"
        style={{
          padding: '24px',
          backgroundColor: 'var(--color-paper)',
          borderRadius: '16px',
          border: '3px solid var(--color-black)',
          boxShadow: '6px 6px 0 var(--color-black)',
          marginBottom: '32px'
        }}
      >
        {isFood && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 900, textTransform: 'uppercase', margin: 0, letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Utensils size={20} /> RESERVE A TABLE
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: 700 }}>
                  Select party size and time to confirm your spot
                </div>
              </div>
              <span className="neo-badge neo-badge--mint" style={{ fontSize: '10px', fontWeight: 900 }}>⚡ INSTANT CONFIRMATION</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', display: 'block', marginBottom: '8px', letterSpacing: '0.04em' }}>1. HOW MANY GUESTS?</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                  {[1, 2, 4, 6].map(num => (
                    <button
                      key={num}
                      className={`neo-btn ${partySize === num ? 'neo-btn--primary' : 'neo-btn--secondary'}`}
                      onClick={() => setPartySize(num)}
                      style={{ fontWeight: 900, padding: '10px 0', fontSize: '13px', backgroundColor: partySize === num ? 'var(--color-yellow)' : 'var(--color-cream)', border: '2px solid var(--color-black)', boxShadow: partySize === num ? '3px 3px 0 var(--color-black)' : '1.5px 1.5px 0 var(--color-black)' }}
                    >
                      {num} {num === 1 ? 'Guest' : 'Guests'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em' }}>2. AVAILABLE TONIGHT</label>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--color-pink)' }}>🔥 Recommended: 7:00 PM</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px', scrollbarWidth: 'none' }}>
                  {['6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM'].map(t => {
                    const isSelected = bookingTime === t;
                    const isRecommended = t === '7:00 PM';
                    return (
                      <button
                        key={t}
                        className={`neo-btn ${isSelected ? 'neo-btn--accent' : 'neo-btn--secondary'}`}
                        onClick={() => setBookingTime(t)}
                        style={{ whiteSpace: 'nowrap', fontWeight: 900, padding: '8px 14px', fontSize: '13px', backgroundColor: isSelected ? 'var(--color-pink)' : (isRecommended ? 'var(--color-yellow)' : 'var(--color-cream)'), border: '2px solid var(--color-black)', boxShadow: isSelected ? '3px 3px 0 var(--color-black)' : '1.5px 1.5px 0 var(--color-black)' }}
                      >
                        {isRecommended && '⭐ '} {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                <button
                  className="neo-btn neo-btn--primary"
                  onClick={handleBookNow}
                  style={{ height: '50px', fontWeight: 900, fontSize: '15px', backgroundColor: 'var(--color-yellow)', border: '2.5px solid var(--color-black)', boxShadow: '4px 4px 0 var(--color-black)' }}
                >
                  {bookedSuccess
                    ? `✓ RESERVED FOR ${partySize} GUESTS AT ${bookingTime}!`
                    : `RESERVE TABLE FOR ${partySize} (${bookingTime}) →`}
                </button>
                <a href={getActionableUrl(place)} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)', textAlign: 'center', marginTop: '4px', textDecoration: 'underline' }}>
                  Or reserve directly through official website ↗
                </a>
              </div>
            </div>
          </>
        )}

        {isTicket && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 900, textTransform: 'uppercase', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Ticket size={20} /> BOOK YOUR TICKETS
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: 700 }}>Select ticket quantity below</div>
              </div>
              <span className="neo-badge neo-badge--lavender" style={{ fontSize: '10px', fontWeight: 900 }}>🎟️ SKIP THE QUEUE</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', display: 'block', marginBottom: '8px', letterSpacing: '0.04em' }}>TICKETS</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                  {[1, 2, 3, 4, 6].map(num => (
                    <button
                      key={num}
                      className="neo-btn neo-btn--secondary"
                      onClick={() => setTicketCount(num)}
                      style={{ fontWeight: 900, padding: '10px 0', fontSize: '14px', backgroundColor: ticketCount === num ? 'var(--color-yellow)' : 'var(--color-cream)', border: '2px solid var(--color-black)', boxShadow: ticketCount === num ? '3px 3px 0 var(--color-black)' : '1.5px 1.5px 0 var(--color-black)' }}
                    >
                      {num}×
                    </button>
                  ))}
                </div>
              </div>

              <a
                href={getActionableUrl(place)}
                target="_blank"
                rel="noopener noreferrer"
                className="neo-btn neo-btn--primary"
                style={{ height: '50px', fontWeight: 900, fontSize: '15px', backgroundColor: 'var(--color-yellow)', border: '2.5px solid var(--color-black)', boxShadow: '4px 4px 0 var(--color-black)', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <Ticket size={18} /> BOOK {ticketCount} TICKET{ticketCount !== 1 ? 'S' : ''} →
              </a>
            </div>
          </>
        )}

        {isOutdoor && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 900, textTransform: 'uppercase', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Compass size={20} /> PLAN YOUR VISIT
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: 700 }}>Open daily · Free entry · No booking required</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="neo-card" style={{ padding: '12px', backgroundColor: 'var(--color-cream)', border: '2px solid var(--color-black)', boxShadow: '2px 2px 0 var(--color-black)', textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', marginBottom: '4px' }}>🌅</div>
                  <div style={{ fontSize: '12px', fontWeight: 900 }}>BEST TIME</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>Golden hour · 5–7 PM</div>
                </div>
                <div className="neo-card" style={{ padding: '12px', backgroundColor: 'var(--color-cream)', border: '2px solid var(--color-black)', boxShadow: '2px 2px 0 var(--color-black)', textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', marginBottom: '4px' }}>⏱️</div>
                  <div style={{ fontSize: '12px', fontWeight: 900 }}>VISIT TIME</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>1–2 hours typical</div>
                </div>
              </div>

              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`}
                target="_blank"
                rel="noreferrer"
                className="neo-btn neo-btn--primary"
                style={{ height: '50px', fontWeight: 900, fontSize: '15px', backgroundColor: 'var(--color-yellow)', border: '2.5px solid var(--color-black)', boxShadow: '4px 4px 0 var(--color-black)', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <Navigation size={18} /> GET DIRECTIONS →
              </a>
            </div>
          </>
        )}
      </div>

      {/* ─── 5. WHY PEOPLE LIKE IT / KEY ATTRIBUTES ─── */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '14px', letterSpacing: '-0.01em' }}>
          ✨ WHY VISIT THIS SPOT
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
          <div className="neo-card" style={{ padding: '16px', backgroundColor: 'var(--color-cream)', border: '2px solid var(--color-black)', boxShadow: '3px 3px 0 var(--color-black)' }}>
            <div style={{ fontSize: '14px', fontWeight: 900, marginBottom: '4px' }}>☕ Specialty Craft Coffee</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
              Sourced from single-origin roasters with artisan pour-over and matcha selections.
            </div>
          </div>

          <div className="neo-card" style={{ padding: '16px', backgroundColor: 'var(--color-cream)', border: '2px solid var(--color-black)', boxShadow: '3px 3px 0 var(--color-black)' }}>
            <div style={{ fontSize: '14px', fontWeight: 900, marginBottom: '4px' }}>🌿 Scenic Outdoor Terrace</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
              Open-air terrace seating perfect for sunset golden hour and relaxed socializing.
            </div>
          </div>

          <div className="neo-card" style={{ padding: '16px', backgroundColor: 'var(--color-cream)', border: '2px solid var(--color-black)', boxShadow: '3px 3px 0 var(--color-black)' }}>
            <div style={{ fontSize: '14px', fontWeight: 900, marginBottom: '4px' }}>⚡ High-Speed Wi-Fi & Work Spaces</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
              Ample power outlets and dedicated quiet tables for remote work and study.
            </div>
          </div>
        </div>
      </div>

"      {/* ─── 5.5 RELATED CONTENT (MEETUPS / MOVIES) ─── */}
      <RelatedContent 
        placeId={placeId} 
        onNavigateToMeetup={onNavigateToMeetup} 
        onNavigateToMovie={onNavigateToMovie} 
      />

      {/* ─── 6. NEARBY PLACES (ITINERARY BUILDER: "SINCE YOU'RE HERE...") ─── */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 900, textTransform: 'uppercase', margin: 0, letterSpacing: '-0.01em' }}>
              SINCE YOU'RE HERE...
            </h3>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 700, marginTop: '2px' }}>
              Make the most of your day with these iconic nearby stops
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          {nearbyRecommendations.map(rec => (
            <div
              key={rec.id}
              className="neo-card neo-card--clickable place-card"
              style={{
                padding: '12px',
                backgroundColor: 'var(--color-paper)',
                border: '2px solid var(--color-black)',
                boxShadow: '4px 4px 0 var(--color-black)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column'
              }}
              onClick={() => onNavigateToPlace ? onNavigateToPlace(rec.id) : onBack()}
            >
              <div
                className="place-card__image"
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  height: '130px',
                  borderRadius: '10px',
                  border: '2px solid var(--color-black)',
                  marginBottom: '10px'
                }}
              >
                <img
                  src={getPlaceImage(rec)}
                  alt={rec.name}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&auto=format&fit=crop&q=80';
                  }}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: '6px',
                    left: '6px',
                    backgroundColor: 'var(--color-yellow)',
                    border: '1.5px solid var(--color-black)',
                    borderRadius: '6px',
                    padding: '2px 6px',
                    fontSize: '10px',
                    fontWeight: 900,
                    boxShadow: '1.5px 1.5px 0 var(--color-black)',
                    textTransform: 'uppercase'
                  }}
                >
                  {CATEGORY_EMOJI[rec.category]} {rec.category}
                </div>
              </div>

              <div style={{ fontSize: '15px', fontWeight: 900, lineHeight: 1.2, marginBottom: '4px' }}>{rec.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>⭐ {rec.rating}</span>
                <span>•</span>
                <span>{rec.city || 'Dubai'}</span>
              </div>

              <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
                <button
                  className="neo-btn neo-btn--xs neo-btn--secondary"
                  style={{ width: '100%', fontWeight: 900, padding: '6px 0', fontSize: '11px' }}
                >
                  EXPLORE THIS SPOT →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
