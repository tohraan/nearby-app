import React, { useState, useEffect } from 'react';
import { MapPin, ChevronLeft, Star, Heart, CheckCircle2, Calendar, Clock, Users, Ticket, Compass, Car, Sparkles, Utensils, Coffee, ShieldCheck } from 'lucide-react';
import { getCachedPlaceById, getSavedPlaceIds, savePlaceLocally, unsavePlaceLocally, getVisitedPlaceIds, addVisitedPlaceLocally, removeVisitedPlaceLocally } from '../lib/db.js';
import { api } from '../lib/api.js';
import { useOnlineStatus } from '../hooks/useOnlineStatus.js';
import { CATEGORY_EMOJI, formatDistance, haversineKm, getPlaceImage } from '../lib/geo.js';
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
        <div className="skeleton" style={{ width: '100px', height: '24px', marginBottom: '24px' }} />
        <div className="skeleton" style={{ width: '100%', height: '220px', marginBottom: '16px', borderRadius: '16px' }} />
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

  const distance = (place.lat && place.lng && lat && lng) ? haversineKm(lat, lng, place.lat, place.lng) : null;
  const category = place.category || 'outdoor';

  // Get nearby recommended places
  const nearbyRecommendations = FALLBACK_PLACES.filter(p => p.id !== place.id).slice(0, 3);

  // ─── TEMPLATE 1: Cafes & Restaurants (Dining & Food) ───
  if (category === 'cafe' || category === 'food' || category === 'nightlife') {
    return (
      <div className="app-shell__content" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
          <button onClick={onBack} className="neo-btn neo-btn--ghost neo-btn--xs" style={{ padding: 0 }}>
            <ChevronLeft size={16} /> Back
          </button>
          <button onClick={handleToggleSave} className={`place-card__save-btn ${isSaved ? 'place-card__save-btn--saved' : ''}`} style={{ position: 'static' }}>
            {isSaved ? '❤️' : '🤍'}
          </button>
        </div>

        {/* Hero Image */}
        <div style={{ height: '230px', border: '3px solid var(--color-black)', borderRadius: 'var(--radius-lg)', boxShadow: '5px 5px 0 var(--color-black)', position: 'relative', overflow: 'hidden', marginBottom: 'var(--space-5)' }}>
          <img src={getPlaceImage(place)} alt={place.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', bottom: '12px', left: '12px', backgroundColor: 'var(--color-yellow)', border: '2px solid var(--color-black)', borderRadius: '6px', padding: '4px 10px', fontSize: '12px', fontWeight: 900, boxShadow: '2px 2px 0 var(--color-black)', textTransform: 'uppercase' }}>
            {CATEGORY_EMOJI[place.category]} {place.category} TEMPLATE
          </div>
        </div>

        {/* Info */}
        <div style={{ marginBottom: 'var(--space-5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="neo-badge neo-badge--yellow" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Star size={14} fill="var(--color-black)" /> {place.rating || '4.8'} (120+ reviews)
            </span>
            {distance != null && (
              <span className="neo-badge neo-badge--mint">
                <MapPin size={12} /> {formatDistance(distance)}
              </span>
            )}
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 40px)', lineHeight: 1.05, marginBottom: '6px' }}>{place.name}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
            {place.city} {place.cuisine?.length ? `• ${place.cuisine.join(', ')}` : '• Artisan Dining & Specialty Vibe'}
          </p>
        </div>

        {/* Atmosphere Badges */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: 'var(--space-5)' }}>
          <div className="neo-badge neo-badge--pink">☕ Specialty Coffee</div>
          <div className="neo-badge neo-badge--lavender">🌿 Outdoor Terrace</div>
          <div className="neo-badge neo-badge--sky">⚡ High-Speed Wi-Fi</div>
          <div className="neo-badge neo-badge--cream">🅿️ Valet Parking</div>
        </div>

        {/* E-Commerce Reservation & Table Slot Picker */}
        <div className="neo-card neo-card--yellow" style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 900, textTransform: 'uppercase', margin: 0 }}>
              <Utensils size={18} style={{ display: 'inline', marginRight: '6px' }} /> Reserve Table / Slot
            </h3>
            <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--color-black)' }}>INSTANT CONFIRMATION</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Party Size Selector */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Party Size</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[1, 2, 4, 6].map(num => (
                  <button
                    key={num}
                    className={`neo-btn neo-btn--xs ${partySize === num ? 'neo-btn--primary' : 'neo-btn--secondary'}`}
                    onClick={() => setPartySize(num)}
                    style={{ flex: 1 }}
                  >
                    {num} {num === 1 ? 'Guest' : 'Guests'}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Slot Picker */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Select Time Slot</label>
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                {['6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM'].map(t => (
                  <button
                    key={t}
                    className={`neo-btn neo-btn--xs ${bookingTime === t ? 'neo-btn--accent' : 'neo-btn--secondary'}`}
                    onClick={() => setBookingTime(t)}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* CTA Button */}
            <button className="neo-btn neo-btn--primary" onClick={handleBookNow} style={{ width: '100%', marginTop: '6px', fontWeight: 900 }}>
              {bookedSuccess ? '✓ TABLE RESERVED! SEE YOU AT ' + bookingTime : `RESERVE TABLE FOR ${partySize} (${bookingTime})`}
            </button>
          </div>
        </div>

        {/* Nearby Spot Recommendations */}
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 900, marginBottom: '12px' }}>Nearby Places to Visit Next</h3>
          <div style={{ display: 'flex', gap: '12px', overflowX: 'auto' }}>
            {nearbyRecommendations.map(rec => (
              <div key={rec.id} className="neo-card neo-card--clickable" style={{ minWidth: '220px', flexShrink: 0, padding: '12px' }} onClick={() => onBack()}>
                <img src={getPlaceImage(rec)} alt={rec.name} style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #000', marginBottom: '6px' }} />
                <div style={{ fontSize: '14px', fontWeight: 800 }}>{rec.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{rec.category} • ⭐ {rec.rating}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Directions & Mark Visited */}
        <div style={{ marginTop: 'auto', paddingBottom: 'var(--space-4)', display: 'flex', gap: '12px' }}>
          <button className={`neo-btn ${isVisited ? 'neo-btn--secondary' : 'neo-btn--accent'}`} style={{ flex: 1 }} onClick={handleToggleVisited}>
            {isVisited ? <><CheckCircle2 size={16} /> VISITED</> : 'MARK VISITED'}
          </button>
          <a href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`} target="_blank" rel="noreferrer" className="neo-btn neo-btn--primary" style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}>
            DIRECTIONS
          </a>
        </div>
      </div>
    );
  }

  // ─── TEMPLATE 2: Adventure, Travel & Tourist Attractions ───
  if (category === 'attraction' || category === 'culture' || category === 'outdoor') {
    return (
      <div className="app-shell__content" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
          <button onClick={onBack} className="neo-btn neo-btn--ghost neo-btn--xs" style={{ padding: 0 }}>
            <ChevronLeft size={16} /> Back
          </button>
          <button onClick={handleToggleSave} className={`place-card__save-btn ${isSaved ? 'place-card__save-btn--saved' : ''}`} style={{ position: 'static' }}>
            {isSaved ? '❤️' : '🤍'}
          </button>
        </div>

        {/* Hero Panorama Image */}
        <div style={{ height: '250px', border: '3px solid var(--color-black)', borderRadius: 'var(--radius-lg)', boxShadow: '5px 5px 0 var(--color-black)', position: 'relative', overflow: 'hidden', marginBottom: 'var(--space-5)' }}>
          <img src={getPlaceImage(place)} alt={place.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', top: '12px', right: '12px', backgroundColor: 'var(--color-pink)', border: '2px solid var(--color-black)', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: 900, boxShadow: '2px 2px 0 var(--color-black)' }}>
            📷 ICONIC LANDMARK
          </div>
        </div>

        {/* Title */}
        <div style={{ marginBottom: 'var(--space-5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="neo-badge neo-badge--yellow">⭐ {place.rating || '4.9'} World Destination</span>
            <span className="neo-badge neo-badge--sky"><Car size={12} /> ~20 min drive</span>
          </div>
          <h1 style={{ fontSize: 'clamp(30px, 6vw, 44px)', lineHeight: 1.05, marginBottom: '6px' }}>{place.name}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>{place.address || place.city}</p>
        </div>

        {/* Travel & Road Trip Info Card */}
        <div className="neo-card neo-card--mint" style={{ marginBottom: 'var(--space-5)' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '10px' }}>
            <Compass size={16} style={{ display: 'inline', marginRight: '6px' }} /> Visitor Guide & Drive Info
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
            <div><strong>Best Time:</strong> Golden Hour (5:30 PM)</div>
            <div><strong>Drive Time:</strong> {distance != null ? formatDistance(distance) : '22 km'}</div>
            <div><strong>Parking:</strong> On-site & Valet</div>
            <div><strong>Weather:</strong> Clear / Sunny</div>
          </div>
        </div>

        {/* Visitor Pass Ticket Tiers */}
        <div className="neo-card neo-card--cream" style={{ marginBottom: 'var(--space-6)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '10px' }}>
            <Ticket size={16} style={{ display: 'inline', marginRight: '6px' }} /> Visitor Pass Options
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
            <div
              className={`neo-card ${ticketTier === 'standard' ? 'neo-card--yellow' : ''}`}
              style={{ padding: '10px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              onClick={() => setTicketTier('standard')}
            >
              <div>
                <strong>Standard Viewing Deck</strong>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Full general access pass</div>
              </div>
              <span style={{ fontWeight: 900, fontSize: '16px' }}>$25</span>
            </div>

            <div
              className={`neo-card ${ticketTier === 'vip' ? 'neo-card--pink' : ''}`}
              style={{ padding: '10px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              onClick={() => setTicketTier('vip')}
            >
              <div>
                <strong>VIP Priority Sky Deck</strong>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Fast-track entry + lounge access</div>
              </div>
              <span style={{ fontWeight: 900, fontSize: '16px' }}>$65</span>
            </div>
          </div>

          <button className="neo-btn neo-btn--primary" onClick={handleBookNow} style={{ width: '100%', fontWeight: 900 }}>
            {bookedSuccess ? '✓ PASS RESERVED! CONFIRMATION SENT' : `GET VISITOR PASS (${ticketTier.toUpperCase()})`}
          </button>
        </div>

        {/* Directions & Mark Visited */}
        <div style={{ marginTop: 'auto', paddingBottom: 'var(--space-4)', display: 'flex', gap: '12px' }}>
          <button className={`neo-btn ${isVisited ? 'neo-btn--secondary' : 'neo-btn--accent'}`} style={{ flex: 1 }} onClick={handleToggleVisited}>
            {isVisited ? <><CheckCircle2 size={16} /> VISITED</> : 'MARK VISITED'}
          </button>
          <a href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`} target="_blank" rel="noreferrer" className="neo-btn neo-btn--primary" style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}>
            DIRECTIONS
          </a>
        </div>
      </div>
    );
  }

  // ─── TEMPLATE 3: Events & Group Outdoor Activities (E-Commerce Style Checkout) ───
  return (
    <div className="app-shell__content" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
        <button onClick={onBack} className="neo-btn neo-btn--ghost neo-btn--xs" style={{ padding: 0 }}>
          <ChevronLeft size={16} /> Back
        </button>
        <button onClick={handleToggleSave} className={`place-card__save-btn ${isSaved ? 'place-card__save-btn--saved' : ''}`} style={{ position: 'static' }}>
          {isSaved ? '❤️' : '🤍'}
        </button>
      </div>

      {/* Hero Image */}
      <div style={{ height: '220px', border: '3px solid var(--color-black)', borderRadius: 'var(--radius-lg)', boxShadow: '5px 5px 0 var(--color-black)', position: 'relative', overflow: 'hidden', marginBottom: 'var(--space-5)' }}>
        <img src={getPlaceImage(place)} alt={place.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', bottom: '12px', left: '12px', backgroundColor: 'var(--color-pink)', border: '2px solid var(--color-black)', borderRadius: '6px', padding: '4px 10px', fontSize: '12px', fontWeight: 900, boxShadow: '2px 2px 0 var(--color-black)' }}>
          🎉 GROUP EVENT CHECKOUT
        </div>
      </div>

      {/* Event Details */}
      <div style={{ marginBottom: 'var(--space-5)' }}>
        <h1 style={{ fontSize: 'clamp(28px, 5vw, 38px)', lineHeight: 1.1, marginBottom: '6px' }}>{place.name}</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>{place.address || place.city}</p>
      </div>

      {/* E-Commerce Checkout Card */}
      <div className="neo-card neo-card--pink" style={{ marginBottom: 'var(--space-6)' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '12px' }}>
          <ShieldCheck size={18} style={{ display: 'inline', marginRight: '6px' }} /> Event Registration
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
            <span>Price per spot:</span>
            <strong>$15.00</strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px' }}>Select Spots:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button className="neo-btn neo-btn--xs neo-btn--secondary" onClick={() => setPartySize(Math.max(1, partySize - 1))}>-</button>
              <strong style={{ fontSize: '16px' }}>{partySize}</strong>
              <button className="neo-btn neo-btn--xs neo-btn--secondary" onClick={() => setPartySize(partySize + 1)}>+</button>
            </div>
          </div>

          <div style={{ borderTop: '2px solid var(--color-black)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 900 }}>
            <span>Total:</span>
            <span>${(partySize * 15).toFixed(2)}</span>
          </div>

          <button className="neo-btn neo-btn--primary" onClick={handleBookNow} style={{ width: '100%', marginTop: '6px', fontWeight: 900 }}>
            {bookedSuccess ? '✓ SPOTS SECURED! CHECKOUT COMPLETE' : `CHECKOUT & SECURE ${partySize} SPOTS`}
          </button>
        </div>
      </div>

      {/* Directions & Mark Visited */}
      <div style={{ marginTop: 'auto', paddingBottom: 'var(--space-4)', display: 'flex', gap: '12px' }}>
        <button className={`neo-btn ${isVisited ? 'neo-btn--secondary' : 'neo-btn--accent'}`} style={{ flex: 1 }} onClick={handleToggleVisited}>
          {isVisited ? <><CheckCircle2 size={16} /> VISITED</> : 'MARK VISITED'}
        </button>
        <a href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`} target="_blank" rel="noreferrer" className="neo-btn neo-btn--primary" style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}>
          DIRECTIONS
        </a>
      </div>
    </div>
  );
}
