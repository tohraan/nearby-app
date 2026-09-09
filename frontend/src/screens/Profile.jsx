import { useState, useEffect } from 'react';
import { User, Settings, Check } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus.js';

const INTEREST_OPTIONS = [
  { id: 'food', label: 'Food & Dining', emoji: '🌮' },
  { id: 'cafe', label: 'Cafes & Coffee', emoji: '☕️' },
  { id: 'outdoor', label: 'Outdoors & Parks', emoji: '🏃‍♂️' },
  { id: 'culture', label: 'Arts & Culture', emoji: '🎨' },
  { id: 'nightlife', label: 'Nightlife', emoji: '🌙' },
  { id: 'shopping', label: 'Shopping', emoji: '🛍️' },
];

export default function Profile() {
  const isOnline = useOnlineStatus();
  const [profile, setProfile] = useState({
    name: 'Guest User',
    interests: ['cafe', 'outdoor'],
    maxDistance: 5, // km
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('nearby_profile');
    if (stored) {
      try {
        setProfile(JSON.parse(stored));
      } catch (e) {}
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('nearby_profile', JSON.stringify(profile));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleInterest = (id) => {
    setProfile(prev => {
      const isSelected = prev.interests.includes(id);
      return {
        ...prev,
        interests: isSelected 
          ? prev.interests.filter(i => i !== id)
          : [...prev.interests, id]
      };
    });
  };

  return (
    <div className="app-shell__content" style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '640px', margin: '0 auto' }}>
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', fontWeight: 700, margin: 0 }}>Profile & Settings</h1>
        <Settings size={22} color="var(--text-muted)" />
      </div>

      {/* a. Display Name (compact single row, low visual weight) */}
      <div
        style={{
          padding: '12px 16px',
          backgroundColor: 'var(--color-white)',
          border: '1.5px solid var(--border-muted)',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}
      >
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-gray-100)',
            border: '1.5px solid var(--border-default)',
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
            flexShrink: 0
          }}
        >
          <User size={20} color="var(--text-primary)" />
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Name:</span>
          <input
            type="text"
            value={profile.name}
            onChange={e => setProfile({ ...profile, name: e.target.value })}
            style={{
              border: 'none',
              background: 'none',
              fontSize: '15px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              width: '100%',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* b. Your Vibes (Visually dominant section with instructional subtext) */}
      <div
        className="neo-card"
        style={{
          backgroundColor: 'var(--color-white)',
          padding: '20px',
          border: '2px solid var(--color-black)',
          boxShadow: '4px 4px 0 var(--color-black)'
        }}
      >
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>
          Your Vibes
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          We'll lead with these on your home screen.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {INTEREST_OPTIONS.map(interest => {
            const isSelected = profile.interests.includes(interest.id);
            return (
              <button
                key={interest.id}
                onClick={() => toggleInterest(interest.id)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  border: '2px solid var(--color-black)',
                  backgroundColor: isSelected ? 'var(--color-yellow)' : 'var(--color-white)',
                  color: 'var(--color-black)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: isSelected ? '2px 2px 0 var(--color-black)' : '1px 1px 0 rgba(0,0,0,0.15)',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{interest.emoji} {interest.label}</span>
                {isSelected && <Check size={14} strokeWidth={3} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* c. Discovery Distance (compact white card with secondary accent pill) */}
      <div
        style={{
          padding: '16px 20px',
          backgroundColor: 'var(--color-white)',
          border: '1.5px solid var(--border-default)',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>Max Discovery Distance</span>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 700,
              backgroundColor: 'var(--color-sky)',
              color: 'var(--color-black)',
              border: '1px solid var(--color-black)',
              borderRadius: '999px',
              padding: '2px 10px'
            }}
          >
            {profile.maxDistance} km
          </span>
        </div>

        <input 
          type="range" 
          min="1" 
          max="25" 
          value={profile.maxDistance}
          onChange={e => setProfile({ ...profile, maxDistance: parseInt(e.target.value, 10) })}
          style={{ width: '100%', accentColor: 'var(--color-black)', cursor: 'pointer' }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
          <span>Walking (1km)</span>
          <span>Citywide (25km)</span>
        </div>
      </div>

      {/* Full-width primary accent button at bottom */}
      <div style={{ marginTop: '12px' }}>
        <button 
          className="neo-btn neo-btn--primary" 
          style={{ width: '100%', height: '50px', fontSize: '15px', fontWeight: 700, backgroundColor: 'var(--color-yellow)', color: 'var(--color-black)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          onClick={handleSave}
        >
          {saved ? 'Preferences Saved!' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
}
