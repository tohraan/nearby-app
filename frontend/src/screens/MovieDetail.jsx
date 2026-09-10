import React, { useState } from 'react';
import { ArrowLeft, Star, Film, Ticket, ExternalLink, MapPin } from 'lucide-react';
import { FALLBACK_MOVIES, CINEMAS } from '../lib/movieData.js';

export default function MovieDetail({ movieId, onBack, onNavigateToPlace }) {
  const movie = FALLBACK_MOVIES.find(m => m.id === movieId) || FALLBACK_MOVIES[0];
  const [selectedDay, setSelectedDay] = useState('today');

  return (
    <div className="app-shell__content" style={{ maxWidth: '760px', margin: '0 auto', paddingBottom: '80px' }}>
      {/* Top Navigation */}
      <button 
        className="neo-btn neo-btn--sm neo-btn--secondary"
        onClick={onBack}
        style={{ gap: '6px', marginBottom: '16px' }}
      >
        <ArrowLeft size={16} /> Back to Movies
      </button>

      {/* Backdrop Header Card */}
      <div className="neo-card" style={{ padding: '20px', backgroundColor: 'var(--color-paper)' }}>
        {/* Backdrop Image */}
        <div style={{ position: 'relative', overflow: 'hidden', height: '240px', borderRadius: '12px', border: '2px solid var(--color-black)', marginBottom: '16px' }}>
          <img 
            src={movie.backdrop || movie.poster} 
            alt={movie.title} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div 
            style={{ 
              position: 'absolute', 
              bottom: '12px', 
              left: '12px', 
              backgroundColor: 'var(--color-yellow)', 
              color: 'var(--color-black)', 
              padding: '4px 12px', 
              borderRadius: '8px', 
              border: '1.5px solid var(--color-black)', 
              fontWeight: 800, 
              fontSize: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Star size={16} fill="var(--color-black)" />
            <span>{movie.rating} / 10</span>
          </div>
        </div>

        {/* Movie Title & Info */}
        <h1 style={{ fontSize: '26px', fontWeight: 800, fontFamily: 'var(--font-sans)', marginBottom: '6px' }}>
          {movie.title}
        </h1>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '16px', fontSize: '13px', fontFamily: 'var(--font-secondary)', color: 'var(--text-secondary)' }}>
          <span style={{ backgroundColor: 'var(--color-cream)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border-default)', fontWeight: 700, color: 'var(--color-black)' }}>
            {movie.certificate}
          </span>
          <span>•</span>
          <span>{movie.runtime} mins</span>
          <span>•</span>
          <span>{(movie.genres || []).join(', ')}</span>
        </div>

        {/* Synopsis */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'var(--font-sans)', marginBottom: '6px' }}>Synopsis</h3>
          <p style={{ fontSize: '14px', lineHeight: 1.55, color: 'var(--text-secondary)', fontFamily: 'var(--font-secondary)' }}>
            {movie.synopsis}
          </p>
        </div>

        {/* Date Selector Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <button 
            className={`neo-btn neo-btn--sm ${selectedDay === 'today' ? 'neo-btn--primary' : 'neo-btn--secondary'}`}
            onClick={() => setSelectedDay('today')}
            style={{ fontWeight: 700 }}
          >
            Today's Showtimes
          </button>
          <button 
            className={`neo-btn neo-btn--sm ${selectedDay === 'tomorrow' ? 'neo-btn--primary' : 'neo-btn--secondary'}`}
            onClick={() => setSelectedDay('tomorrow')}
            style={{ fontWeight: 700 }}
          >
            Tomorrow
          </button>
        </div>

        {/* Cinemas & Showtimes List */}
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-sans)', marginBottom: '14px' }}>
            Available Theatres & Showtimes
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {(movie.showtimes || []).map((st, idx) => {
              const cinema = CINEMAS.find(c => c.id === st.cinemaId) || CINEMAS[0];
              return (
                <div 
                  key={idx}
                  style={{ 
                    padding: '16px', 
                    backgroundColor: 'var(--color-white)', 
                    border: '1.5px solid var(--color-black)', 
                    borderRadius: '10px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'var(--font-sans)' }}>
                        {cinema.name} — {cinema.venue}
                      </div>
                      <div 
                        onClick={() => cinema.placeId && onNavigateToPlace?.(cinema.placeId)}
                        style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-secondary)', marginTop: '2px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                      >
                        <MapPin size={12} /> {cinema.address} ({cinema.distance} km away) →
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 700, backgroundColor: 'var(--color-sky)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--color-black)' }}>
                      {st.format || 'Standard'}
                    </span>
                  </div>

                  {/* Time Chips */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                    {(st.times || []).map((t, tIdx) => {
                      const timeStr = new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      return (
                        <a
                          key={tIdx}
                          href="https://voxcinemas.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="neo-btn neo-btn--xs neo-btn--secondary"
                          style={{ textDecoration: 'none', fontWeight: 700, fontSize: '13px' }}
                        >
                          <Ticket size={12} /> {timeStr}
                        </a>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
