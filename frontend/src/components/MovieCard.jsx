import React from 'react';
import { Star, Film, Ticket, Clock } from 'lucide-react';

export default function MovieCard({ movie, onSelect }) {
  const showtimesCount = (movie.showtimes || []).reduce((acc, s) => acc + (s.times ? s.times.length : 0), 0);

  return (
    <div 
      className="neo-card neo-card--clickable place-card movie-card" 
      style={{ padding: '12px', display: 'flex', flexDirection: 'column', height: '100%' }}
      onClick={() => onSelect?.(movie.id)}
    >
      {/* 2:3 Portrait Poster */}
      <div style={{ position: 'relative', overflow: 'hidden', height: '220px', borderRadius: '10px', border: '1.5px solid var(--color-black)', marginBottom: '10px' }}>
        <img 
          src={movie.poster} 
          alt={movie.title} 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div 
          style={{ 
            position: 'absolute', 
            top: '8px', 
            right: '8px', 
            backgroundColor: 'var(--color-yellow)', 
            color: 'var(--color-black)', 
            padding: '2px 8px', 
            borderRadius: '6px', 
            border: '1px solid var(--color-black)', 
            fontWeight: 700, 
            fontSize: '12px',
            fontFamily: 'var(--font-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '3px'
          }}
        >
          <Star size={12} fill="var(--color-black)" />
          <span>{movie.rating}</span>
        </div>

        <div 
          style={{ 
            position: 'absolute', 
            bottom: '8px', 
            left: '8px', 
            backgroundColor: 'rgba(28, 26, 23, 0.85)', 
            color: '#FFF', 
            padding: '2px 8px', 
            borderRadius: '4px', 
            fontWeight: 600, 
            fontSize: '11px',
            fontFamily: 'var(--font-secondary)'
          }}
        >
          {movie.certificate} • {movie.runtime}m
        </div>
      </div>

      {/* Title */}
      <div style={{ fontSize: '17px', fontWeight: 700, lineHeight: 1.2, color: 'var(--color-black)', fontFamily: 'var(--font-sans)' }}>
        {movie.title}
      </div>

      {/* Genres */}
      <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-secondary)', marginTop: '4px' }}>
        {(movie.genres || []).join(' • ')}
      </div>

      {/* Showtimes info line */}
      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-black)', fontFamily: 'var(--font-secondary)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
        <Clock size={12} />
        <span>{showtimesCount} Showtimes Today</span>
      </div>

      {/* Spacer */}
      <div style={{ flex: 1, minHeight: '8px' }} />

      {/* Action CTA */}
      <button 
        className="neo-btn neo-btn--sm neo-btn--primary"
        style={{ width: '100%', marginTop: '10px', fontWeight: 700 }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect?.(movie.id);
        }}
      >
        <Ticket size={14} /> See Showtimes
      </button>
    </div>
  );
}
