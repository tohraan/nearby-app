import React, { useState } from 'react';
import { ArrowLeft, Calendar, MapPin, Users, Clock, Share2, Check } from 'lucide-react';
import { FALLBACK_MEETUPS, SPORT_ICONS, SPORT_COLORS } from '../lib/meetupData.js';

export default function MeetupDetail({ meetupId, onBack, onNavigateToPlace }) {
  const [meetup, setMeetup] = useState(() => {
    return FALLBACK_MEETUPS.find(m => m.id === meetupId) || FALLBACK_MEETUPS[0];
  });
  const [isJoined, setIsJoined] = useState(false);
  const [copied, setCopied] = useState(false);

  const sportKey = (meetup.sport || 'other').toLowerCase();
  const color = SPORT_COLORS[sportKey] || SPORT_COLORS.other;
  const icon = SPORT_ICONS[sportKey] || '🏅';

  const dateObj = new Date(meetup.startsAt);
  const formattedTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formattedDate = dateObj.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });

  const currentCount = (meetup.participants || []).length;
  const isFull = currentCount >= meetup.maxParticipants;

  const handleToggleJoin = () => {
    if (isJoined) {
      setIsJoined(false);
      setMeetup(prev => ({
        ...prev,
        participants: prev.participants.filter(p => p.id !== 'user_me')
      }));
    } else {
      if (isFull) return;
      setIsJoined(true);
      setMeetup(prev => ({
        ...prev,
        participants: [...prev.participants, { id: 'user_me', name: 'You', avatar: '😎', isHost: false }]
      }));
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="app-shell__content" style={{ maxWidth: '720px', margin: '0 auto', paddingBottom: '80px' }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <button 
          className="neo-btn neo-btn--sm neo-btn--secondary"
          onClick={onBack}
          style={{ gap: '6px' }}
        >
          <ArrowLeft size={16} /> Back
        </button>

        <button 
          className="neo-btn neo-btn--sm neo-btn--ghost"
          onClick={handleShare}
          style={{ gap: '6px' }}
        >
          {copied ? <Check size={16} color="var(--state-success)" /> : <Share2 size={16} />}
          <span>{copied ? 'Copied Link!' : 'Share'}</span>
        </button>
      </div>

      {/* Main Detail Card */}
      <div className="neo-card" style={{ padding: '20px', backgroundColor: 'var(--color-paper)' }}>
        {/* Header photo */}
        <div style={{ position: 'relative', overflow: 'hidden', height: '220px', borderRadius: '12px', border: '2px solid var(--color-black)', marginBottom: '16px' }}>
          <img 
            src={meetup.placeImage} 
            alt={meetup.title} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div 
            style={{ 
              position: 'absolute', 
              top: '12px', 
              left: '12px', 
              backgroundColor: color.bg, 
              color: color.text, 
              padding: '4px 14px', 
              borderRadius: '999px', 
              border: '1.5px solid var(--color-black)', 
              fontWeight: 700, 
              fontSize: '14px',
              fontFamily: 'var(--font-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>{icon}</span>
            <span style={{ textTransform: 'capitalize' }}>{meetup.sport}</span>
          </div>
        </div>

        {/* Title */}
        <h1 style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-sans)', marginBottom: '8px' }}>
          {meetup.title}
        </h1>

        {/* Venue clickable row */}
        <div 
          onClick={() => meetup.placeId && onNavigateToPlace?.(meetup.placeId)}
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '6px', 
            padding: '6px 12px', 
            backgroundColor: 'var(--color-cream)', 
            border: '1.5px solid var(--color-black)', 
            borderRadius: '8px', 
            cursor: 'pointer',
            marginBottom: '16px'
          }}
        >
          <MapPin size={14} color="var(--color-black)" />
          <span style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-secondary)' }}>
            📍 {meetup.placeName} ({meetup.city}) →
          </span>
        </div>

        {/* Time & Capacity Metadata grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
          <div style={{ padding: '12px', backgroundColor: 'var(--color-white)', border: '1.5px solid var(--color-black)', borderRadius: '8px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Date & Time</div>
            <div style={{ fontSize: '14px', fontWeight: 700, marginTop: '2px', fontFamily: 'var(--font-secondary)' }}>{formattedDate}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'var(--font-secondary)' }}>{formattedTime}</div>
          </div>

          <div style={{ padding: '12px', backgroundColor: 'var(--color-white)', border: '1.5px solid var(--color-black)', borderRadius: '8px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Group Capacity</div>
            <div style={{ fontSize: '14px', fontWeight: 700, marginTop: '2px', fontFamily: 'var(--font-secondary)' }}>
              {meetup.participants.length} / {meetup.maxParticipants} Attending
            </div>
            <div style={{ fontSize: '13px', color: isFull ? 'var(--color-red)' : 'var(--state-success)', fontWeight: 600, fontFamily: 'var(--font-secondary)' }}>
              {isFull ? 'Full Session' : `${meetup.maxParticipants - meetup.participants.length} spots remaining`}
            </div>
          </div>
        </div>

        {/* Description */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'var(--font-sans)', marginBottom: '6px' }}>About this meetup</h3>
          <p style={{ fontSize: '14px', lineHeight: 1.55, color: 'var(--text-secondary)', fontFamily: 'var(--font-secondary)' }}>
            {meetup.description}
          </p>
        </div>

        {/* Participant Roster */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'var(--font-sans)', marginBottom: '10px' }}>
            Attending Players ({meetup.participants.length})
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {meetup.participants.map(p => (
              <div 
                key={p.id}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  padding: '6px 12px', 
                  backgroundColor: 'var(--color-white)', 
                  border: '1.5px solid var(--color-black)', 
                  borderRadius: '999px',
                  fontSize: '13px',
                  fontFamily: 'var(--font-secondary)',
                  fontWeight: 600
                }}
              >
                <span>{p.avatar}</span>
                <span>{p.name}</span>
                {p.isHost && (
                  <span style={{ fontSize: '10px', backgroundColor: 'var(--color-yellow)', padding: '1px 5px', borderRadius: '4px', border: '1px solid var(--color-black)' }}>HOST</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Action Join CTA */}
        <button 
          className={`neo-btn ${isJoined ? 'neo-btn--destructive' : isFull ? 'neo-btn--secondary' : 'neo-btn--primary'}`}
          style={{ width: '100%', height: '52px', fontSize: '16px', fontWeight: 800 }}
          onClick={handleToggleJoin}
          disabled={isFull && !isJoined}
        >
          {isJoined ? 'Leave Meetup' : isFull ? 'Meetup Full' : 'Join Meetup Now! 🎉'}
        </button>
      </div>
    </div>
  );
}
