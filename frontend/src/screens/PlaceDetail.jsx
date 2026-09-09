/**
 * PlaceDetail.jsx — Bento Grid Detail Screen for Places & Events
 * Features crisp Neo-Brutalist Back link, unified Bento Grid container layout,
 * interactive reservation/ticket slots, recommendations, and clean page boundaries.
 */

import React, { useState, useEffect } from 'react';
import { MapPin, ChevronLeft, Star, Heart, CheckCircle2, Calendar, Clock, Users, Ticket, Compass, Car, Sparkles, Utensils, Coffee, ShieldCheck, ExternalLink } from 'lucide-react';
import { getCachedPlaceById, getSavedPlaceIds, savePlaceLocally, unsavePlaceLocally, getVisitedPlaceIds, addVisitedPlaceLocally, removeVisitedPlaceLocally } from '../lib/db.js';
import { api } from '../lib/api.js';
import { useOnlineStatus } from '../hooks/useOnlineStatus.js';
import { CATEGORY_EMOJI, formatDistance, haversineKm, getPlaceImage, getActionableUrl, getActionLabel } from '../lib/geo.js';
import { useGeolocation } from '../hooks/useGeolocation.js';
import { queueAction } from '../lib/offlineSync.js';
import { FALLBACK_PLACES } from '../lib/fallbackData.js';

export default function PlaceDetail({ placeId, onBack }) {
  const [place, setPlace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isVisited, setIsVisited] = useState(false);
  const [bookingTime, setBookingTime] = useState('7:00 PM');
  const [partySize, setPartySize] = useState(2);
  const [ticketTier, setTicketTier] = useState('standard');
  const [bookedSuccess, setBookedSuccess] = useState(false);
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

  const handleBookNow = () => {
    setBookedSuccess(true);
    setTimeout(() => setBookedSuccess(false), 4000);
  };

  if (loading) {
    return (
      <div className="app-shell__content">
        <div className="skeleton" style={{ width: '140px', height: '36px', marginBottom: '20px' }} />
        <div className="skeleton" style={{ width: '100%', height: '340px', borderRadius: '16px' }} />
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

  const distance = (place.lat && place.lng && lat && lng) ? haversineKm(lat, lng, place.lat, place.lng) : null;
  const category = place.category || 'outdoor';
  const nearbyRecommendations = FALLBACK_PLACES.filter(p => p.id !== place.id).slice(0, 3);

  return (
    <div className="app-shell__content" style={{ paddingBottom: '20px' }}>
      {/* ─── Back Link Header Bar ─── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <button
          onClick={onBack}
          className="neo-btn neo-btn--secondary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 900,
            boxShadow: '3px 3px 0 var(--color-black)',
            backgroundColor: 'var(--color-yellow)',
            color: 'var(--color-black)'
          }}
        >
          <ChevronLeft size={18} strokeWidth={3} /> ← BACK TO DISCOVERY
        </button>

        <button
          onClick={handleToggleSave}
          className={`place-card__save-btn ${isSaved ? 'place-card__save-btn--saved' : ''}`}
          style={{ position: 'static', width: '42px', height: '42px', borderRadius: '10px' }}
          title={isSaved ? 'Remove from Saved' : 'Save to Favorites'}
        >
          {isSaved ? '❤️' : '🤍'}
        </button>
      </div>

      {/* ─── Bento Grid Master Highlighted Container ─── */}
      <div
        className="neo-card"
        style={{
          padding: '24px',
          backgroundColor: 'var(--color-paper)',
          borderRadius: '16px',
          border: '3px solid var(--color-black)',
          boxShadow: '6px 6px 0 var(--color-black)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}
      >
        {/* Bento Row 1: Image & Header Info Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', alignItems: 'stretch' }}>
          {/* Bento Cell A: Hero Image */}
          <div
            style={{
              position: 'relative',
              borderRadius: '12px',
              border: '3px solid var(--color-black)',
              boxShadow: '4px 4px 0 var(--color-black)',
              overflow: 'hidden',
              minHeight: '220px'
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
            <div
              style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                backgroundColor: 'var(--color-yellow)',
                border: '2px solid var(--color-black)',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 900,
                boxShadow: '2px 2px 0 var(--color-black)',
                textTransform: 'uppercase'
              }}
            >
              {CATEGORY_EMOJI[place.category]} {place.category}
            </div>
          </div>

          {/* Bento Cell B: Meta & Badges */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <span className="neo-badge neo-badge--yellow" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', padding: '4px 8px' }}>
                <Star size={14} fill="var(--color-black)" /> {place.rating || '4.8'} (120+ reviews)
              </span>
              {distance != null && (
                <span className="neo-badge neo-badge--mint" style={{ fontSize: '12px', padding: '4px 8px' }}>
                  <MapPin size={12} /> {formatDistance(distance)}
                </span>
              )}
            </div>

            <h1 style={{ fontSize: 'clamp(26px, 4vw, 36px)', lineHeight: 1.1, marginBottom: '8px', fontWeight: 900 }}>{place.name}</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '14px' }}>
              {place.city} {place.cuisine?.length ? `• ${place.cuisine.join(', ')}` : '• Specialty Experience'}
            </p>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <span className="neo-badge neo-badge--pink" style={{ fontSize: '11px' }}>☕ Specialty Vibe</span>
              <span className="neo-badge neo-badge--lavender" style={{ fontSize: '11px' }}>🌿 Outdoor Terrace</span>
              <span className="neo-badge neo-badge--sky" style={{ fontSize: '11px' }}>⚡ High-Speed Wi-Fi</span>
              <span className="neo-badge neo-badge--cream" style={{ fontSize: '11px' }}>🅿️ Valet Parking</span>
            </div>
          </div>
        </div>

        {/* Bento Row 2: Reservation / Slot Selector Card */}
        <div className="neo-card neo-card--yellow" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 900, textTransform: 'uppercase', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Utensils size={18} /> RESERVE TABLE / SLOT
            </h3>
            <span style={{ fontSize: '11px', fontWeight: 900, color: 'var(--color-black)' }}>INSTANT CONFIRMATION</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Party Size Selector */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>PARTY SIZE</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[1, 2, 4, 6].map(num => (
                  <button
                    key={num}
                    className={`neo-btn neo-btn--xs ${partySize === num ? 'neo-btn--primary' : 'neo-btn--secondary'}`}
                    onClick={() => setPartySize(num)}
                    style={{ flex: 1, fontWeight: 900 }}
                  >
                    {num} {num === 1 ? 'Guest' : 'Guests'}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Slot Picker */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>SELECT TIME SLOT</label>
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
                {['6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM'].map(t => (
                  <button
                    key={t}
                    className={`neo-btn neo-btn--xs ${bookingTime === t ? 'neo-btn--accent' : 'neo-btn--secondary'}`}
                    onClick={() => setBookingTime(t)}
                    style={{ whiteSpace: 'nowrap', fontWeight: 900 }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* CTAs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', marginTop: '6px' }}>
              <button className="neo-btn neo-btn--primary" onClick={handleBookNow} style={{ fontWeight: 900, height: '46px' }}>
                {bookedSuccess ? '✓ TABLE RESERVED! SEE YOU AT ' + bookingTime : `RESERVE TABLE FOR ${partySize} (${bookingTime})`}
              </button>
              <a
                href={getActionableUrl(place)}
                target="_blank"
                rel="noopener noreferrer"
                className="neo-btn neo-btn--accent"
                style={{ fontWeight: 900, height: '46px', textDecoration: 'none', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                🌐 {getActionLabel(place)} (OFFICIAL SITE) <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>

        {/* Bento Row 3: Nearby Places to Visit Next */}
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.04em' }}>
            NEARBY PLACES TO VISIT NEXT
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            {nearbyRecommendations.map(rec => (
              <div
                key={rec.id}
                className="neo-card neo-card--clickable"
                style={{ padding: '10px', backgroundColor: 'var(--color-cream)', cursor: 'pointer' }}
                onClick={() => onBack()}
              >
                <img
                  src={getPlaceImage(rec)}
                  alt={rec.name}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&auto=format&fit=crop&q=80';
                  }}
                  style={{ width: '100%', height: '95px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #000', marginBottom: '6px' }}
                />
                <div style={{ fontSize: '13px', fontWeight: 900, lineHeight: 1.2 }}>{rec.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{rec.category} • ⭐ {rec.rating}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bento Row 4: Page Action Footer (Mark Visited & Directions) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', paddingTop: '6px' }}>
          <button
            className={`neo-btn ${isVisited ? 'neo-btn--secondary' : 'neo-btn--accent'}`}
            style={{ height: '48px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            onClick={handleToggleVisited}
          >
            {isVisited ? <><CheckCircle2 size={18} /> VISITED</> : 'MARK VISITED'}
          </button>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`}
            target="_blank"
            rel="noreferrer"
            className="neo-btn neo-btn--primary"
            style={{ height: '48px', fontWeight: 900, textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            DIRECTIONS
          </a>
        </div>
      </div>
    </div>
  );
}
