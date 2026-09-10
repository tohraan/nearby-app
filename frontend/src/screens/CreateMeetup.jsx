import React, { useState } from 'react';
import { ArrowLeft, Calendar, Users, MapPin, PlusCircle } from 'lucide-react';
import { SPORTS_LIST, SPORT_ICONS, SPORT_COLORS } from '../lib/meetupData.js';
import { FALLBACK_PLACES } from '../lib/fallbackData.js';
import NeoDatePicker from '../components/NeoDatePicker.jsx';

export default function CreateMeetup({ onBack, onCreateSuccess }) {
  const [sport, setSport] = useState('volleyball');
  const [title, setTitle] = useState('');
  const [placeId, setPlaceId] = useState(FALLBACK_PLACES[0].id);
  const [maxParticipants, setMaxParticipants] = useState(10);
  const [description, setDescription] = useState('');
  
  // Set default start time to today at 18:00
  const [startsAt, setStartsAt] = useState(() => {
    const d = new Date();
    d.setHours(18, 0, 0, 0);
    return d.toISOString();
  });

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const chosenPlace = FALLBACK_PLACES.find(p => p.id === placeId) || FALLBACK_PLACES[0];

    const newMeetup = {
      id: `meetup_${Date.now()}`,
      sport,
      title: title || `${sport.toUpperCase()} @ ${chosenPlace.name}`,
      placeId: chosenPlace.id,
      placeName: chosenPlace.name,
      placeImage: chosenPlace.image,
      city: chosenPlace.city || 'Dubai',
      startsAt: startsAt,
      maxParticipants: Number(maxParticipants),
      participants: [
        { id: 'user_me', name: 'You (Host)', avatar: '👑', isHost: true }
      ],
      description: description || `Join us for casual ${sport} at ${chosenPlace.name}! All skill levels welcome.`,
      status: 'upcoming'
    };

    if (onCreateSuccess) {
      onCreateSuccess(newMeetup);
    }
  };

  return (
    <div className="app-shell__content" style={{ maxWidth: '640px', margin: '0 auto', paddingBottom: '80px' }}>
      <button 
        className="neo-btn neo-btn--sm neo-btn--secondary"
        onClick={onBack}
        style={{ gap: '6px', marginBottom: '16px' }}
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="neo-card" style={{ padding: '20px', backgroundColor: 'var(--color-paper)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <PlusCircle size={24} color="var(--color-black)" />
          <h1 style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'var(--font-sans)', margin: 0 }}>
            Host a Sports Meetup
          </h1>
        </div>

        <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Sport Selector Chips */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px', fontFamily: 'var(--font-secondary)' }}>
              Select Sport Activity
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {SPORTS_LIST.map(s => {
                const isSelected = sport === s;
                const icon = SPORT_ICONS[s] || '🏅';
                return (
                  <button
                    key={s}
                    type="button"
                    className={`neo-btn neo-btn--xs ${isSelected ? 'neo-btn--primary' : 'neo-btn--secondary'}`}
                    style={{ textTransform: 'capitalize', fontWeight: 700 }}
                    onClick={() => setSport(s)}
                  >
                    <span>{icon}</span>
                    <span>{s}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px', fontFamily: 'var(--font-secondary)' }}>
              Meetup Title
            </label>
            <input 
              type="text" 
              placeholder={`e.g. Sunset ${sport.toUpperCase()} Match`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: '14px',
                borderRadius: '8px',
                border: '1.5px solid var(--color-black)',
                backgroundColor: 'var(--color-white)',
                fontFamily: 'var(--font-secondary)'
              }}
              required
            />
          </div>

          {/* Location Picker */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px', fontFamily: 'var(--font-secondary)' }}>
              Venue / Location
            </label>
            <select
              value={placeId}
              onChange={(e) => setPlaceId(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: '14px',
                borderRadius: '8px',
                border: '1.5px solid var(--color-black)',
                backgroundColor: 'var(--color-white)',
                fontFamily: 'var(--font-secondary)'
              }}
            >
              {FALLBACK_PLACES.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.city}) — {p.category}
                </option>
              ))}
            </select>
          </div>

          {/* Time & Capacity Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ position: 'relative', zIndex: 100 }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px', fontFamily: 'var(--font-secondary)' }}>
                Date & Time
              </label>
              <NeoDatePicker 
                value={startsAt}
                onChange={setStartsAt}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px', fontFamily: 'var(--font-secondary)' }}>
                Max Players
              </label>
              <input 
                type="number" 
                min="2" 
                max="30"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  fontSize: '14px',
                  borderRadius: '8px',
                  border: '1.5px solid var(--color-black)',
                  backgroundColor: 'var(--color-white)',
                  fontFamily: 'var(--font-secondary)'
                }}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px', fontFamily: 'var(--font-secondary)' }}>
              Description & Notes
            </label>
            <textarea 
              rows={3}
              placeholder="What to bring, skill level, ground details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: '14px',
                borderRadius: '8px',
                border: '1.5px solid var(--color-black)',
                backgroundColor: 'var(--color-white)',
                fontFamily: 'var(--font-secondary)',
                resize: 'vertical'
              }}
            />
          </div>

          <button 
            type="submit" 
            className="neo-btn neo-btn--primary"
            style={{ width: '100%', height: '48px', fontSize: '15px', fontWeight: 800, marginTop: '8px' }}
          >
            Create Sports Meetup! 🚀
          </button>
        </form>
      </div>
    </div>
  );
}
