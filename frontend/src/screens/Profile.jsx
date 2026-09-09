import { useState, useEffect } from 'react';
import { User, Settings, Compass, Moon } from 'lucide-react';
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
    interests: [],
    maxDistance: 5, // km
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load from local storage
    const stored = localStorage.getItem('nearby_profile');
    if (stored) {
      try {
        setProfile(JSON.parse(stored));
      } catch (e) {
        // use default
      }
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
    <div className="app-shell__content" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="saved-header">
        <h1>PROFILE</h1>
        <Settings size={24} color="var(--text-primary)" />
      </div>

      <div className="neo-card" style={{ marginBottom: 'var(--space-6)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '32px', background: 'var(--color-yellow)', border: '2px solid var(--color-black)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <User size={32} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Display Name</label>
          <input
            type="text"
            className="neo-input"
            style={{ width: '100%', padding: '8px' }}
            value={profile.name}
            onChange={e => setProfile({ ...profile, name: e.target.value })}
          />
        </div>
      </div>

      <h3 style={{ fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)', marginBottom: 'var(--space-3)' }}>
        YOUR VIBES
      </h3>
      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
        We'll use these to recommend the best spots for you on the home screen.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
        {INTEREST_OPTIONS.map(interest => {
          const isSelected = profile.interests.includes(interest.id);
          return (
            <button
              key={interest.id}
              className={`category-chip ${isSelected ? 'category-chip--active' : ''}`}
              onClick={() => toggleInterest(interest.id)}
            >
              {interest.emoji} {interest.label}
            </button>
          );
        })}
      </div>

      <h3 style={{ fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)', marginBottom: 'var(--space-3)' }}>
        PREFERENCES
      </h3>
      <div className="neo-card neo-card--pink" style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
          <span style={{ fontWeight: 600 }}>Max Discovery Distance</span>
          <span>{profile.maxDistance} km</span>
        </div>
        <input 
          type="range" 
          min="1" 
          max="20" 
          value={profile.maxDistance}
          onChange={e => setProfile({ ...profile, maxDistance: parseInt(e.target.value, 10) })}
          style={{ width: '100%', accentColor: 'var(--color-purple)' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
          <span>Walking (1km)</span>
          <span>Driving (20km)</span>
        </div>
      </div>

      <div style={{ marginTop: 'auto', paddingBottom: 'var(--space-4)' }}>
        <button 
          className="neo-btn neo-btn--primary" 
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          onClick={handleSave}
        >
          {saved ? 'SAVED!' : 'SAVE PREFERENCES'}
        </button>
      </div>
    </div>
  );
}
