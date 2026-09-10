import React from 'react';
import { FALLBACK_MEETUPS } from '../lib/meetupData.js';
import { FALLBACK_MOVIES, CINEMAS } from '../lib/movieData.js';
import MeetupCard from './MeetupCard.jsx';
import MovieCard from './MovieCard.jsx';

export default function RelatedContent({ placeId, onNavigateToMeetup, onNavigateToMovie }) {
  if (!placeId) return null;

  // Find related meetups for this place
  const relatedMeetups = FALLBACK_MEETUPS.filter(m => m.placeId === placeId);

  // Find if this place is a cinema venue
  const cinemaMatch = CINEMAS.find(c => c.placeId === placeId);
  const relatedMovies = cinemaMatch 
    ? FALLBACK_MOVIES.filter(m => (m.showtimes || []).some(s => s.cinemaId === cinemaMatch.id))
    : [];

  if (relatedMeetups.length === 0 && relatedMovies.length === 0) {
    return null;
  }

  return (
    <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '2px solid var(--color-black)' }}>
      {relatedMeetups.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-sans)', marginBottom: '12px' }}>
            🏐 Meetups Happening Here ({relatedMeetups.length})
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
            {relatedMeetups.map(m => (
              <MeetupCard 
                key={m.id} 
                meetup={m} 
                onSelect={() => onNavigateToMeetup?.(m.id)} 
              />
            ))}
          </div>
        </div>
      )}

      {relatedMovies.length > 0 && (
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-sans)', marginBottom: '12px' }}>
            🎬 Now Showing at {cinemaMatch?.name || 'This Cinema'}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            {relatedMovies.map(m => (
              <MovieCard 
                key={m.id} 
                movie={m} 
                onSelect={() => onNavigateToMovie?.(m.id)} 
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
