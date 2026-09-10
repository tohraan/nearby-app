import React from 'react';
import { Calendar, Users, MapPin, ArrowRight } from 'lucide-react';
import { SPORT_ICONS, SPORT_COLORS } from '../lib/meetupData.js';

export default function MeetupCard({ meetup, onSelect, onJoin, isJoined }) {
  const sportKey = (meetup.sport || 'other').toLowerCase();
  const color = SPORT_COLORS[sportKey] || SPORT_COLORS.other;
  const icon = SPORT_ICONS[sportKey] || '🏅';

  const dateObj = new Date(meetup.startsAt);
  const formattedTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formattedDate = dateObj.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

  const currentCount = meetup.participants ? meetup.participants.length : 0;
  const isFull = currentCount >= meetup.maxParticipants;

  return (
    <div 
      className="neo-card neo-card--clickable place-card meetup-card" 
      style={{ padding: '14px', display: 'flex', flexDirection: 'column', height: '100%' }}
      onClick={() => onSelect?.(meetup.id)}
    >
      {/* Photo header */}
      <div style={{ position: 'relative', overflow: 'hidden', height: '150px', borderRadius: '10px', border: '1.5px solid var(--color-black)', marginBottom: '12px' }}>
        <img 
          src={meetup.placeImage || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80'} 
          alt={meetup.title} 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div 
          style={{ 
            position: 'absolute', 
            top: '8px', 
            left: '8px', 
            backgroundColor: color.bg, 
            color: color.text, 
            padding: '3px 10px', 
            borderRadius: '999px', 
            border: '1px solid var(--color-black)', 
            fontWeight: 700, 
            fontSize: '12px',
            fontFamily: 'var(--font-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <span>{icon}</span>
          <span style={{ textTransform: 'capitalize' }}>{meetup.sport}</span>
        </div>

        <div 
          style={{ 
            position: 'absolute', 
            bottom: '8px', 
            right: '8px', 
            backgroundColor: isFull ? 'var(--color-coral)' : 'var(--color-yellow)', 
            color: 'var(--color-black)', 
            padding: '2px 8px', 
            borderRadius: '6px', 
            border: '1px solid var(--color-black)', 
            fontWeight: 700, 
            fontSize: '11px',
            fontFamily: 'var(--font-secondary)'
          }}
        >
          {isFull ? 'FULL' : `${currentCount}/${meetup.maxParticipants} Spots`}
        </div>
      </div>

      {/* Title */}
      <div style={{ fontSize: '17px', fontWeight: 700, lineHeight: 1.25, color: 'var(--color-black)', fontFamily: 'var(--font-sans)' }}>
        {meetup.title}
      </div>

      {/* Location */}
      <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-secondary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
        <MapPin size={12} />
        <span>{meetup.placeName} ({meetup.city})</span>
      </div>

      {/* Time */}
      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-secondary)', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
        <Calendar size={12} />
        <span>{formattedDate} • {formattedTime}</span>
      </div>

      {/* Participant Roster Avatars */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px' }}>
        <div style={{ display: 'flex' }}>
          {(meetup.participants || []).slice(0, 4).map((p, i) => (
            <div 
              key={p.id || i}
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-cream)',
                border: '1.5px solid var(--color-black)',
                display: 'flex',
                alignItems: 'center',
                justify: 'center',
                fontSize: '12px',
                marginLeft: i > 0 ? '-8px' : '0',
                zIndex: 4 - i
              }}
              title={p.name}
            >
              {p.avatar || '👤'}
            </div>
          ))}
        </div>
        {currentCount > 4 && (
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', fontFamily: 'var(--font-secondary)' }}>
            +{currentCount - 4} more
          </span>
        )}
      </div>

      {/* Spacer */}
      <div style={{ flex: 1, minHeight: '12px' }} />

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
        <button 
          className={`neo-btn neo-btn--sm ${isJoined ? 'neo-btn--mint' : isFull ? 'neo-btn--secondary' : 'neo-btn--primary'}`}
          style={{ flex: 1, fontWeight: 700 }}
          onClick={(e) => {
            e.stopPropagation();
            if (onJoin) onJoin(meetup.id);
          }}
          disabled={isFull && !isJoined}
        >
          {isJoined ? '✓ Joined' : isFull ? 'Meetup Full' : 'Join Meetup'}
        </button>
      </div>
    </div>
  );
}
