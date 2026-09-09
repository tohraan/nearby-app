/**
 * Chat.jsx — AI Local Guide chat screen with status cycler, delayed greeting, and condensed card recommendations
 */

import { useState, useRef, useEffect } from 'react';
import { Send, MapPin, Sparkles, WifiOff, Loader2, ExternalLink } from 'lucide-react';
import { useGeolocation } from '../hooks/useGeolocation.js';
import { useOnlineStatus } from '../hooks/useOnlineStatus.js';
import { api } from '../lib/api.js';
import { getCachedPlaceById } from '../lib/db.js';
import { CATEGORY_EMOJI, getPlaceImage, getActionableUrl, getActionLabel } from '../lib/geo.js';
import { FALLBACK_PLACES } from '../lib/fallbackData.js';


const STARTER_PROMPTS = [
  "☕️ Quiet cafe",
  "🌮 Cheap eats",
  "🏃‍♂️ Outdoor activity",
  "🍸 Evening drinks"
];

const STATUS_WORDS = [
  "Canoodling...",
  "Scouting local spots...",
  "Checking vibes...",
  "Consulting the map...",
  "Sniffing out fresh brews...",
  "Curating top picks...",
  "Aligning coordinates..."
];

export default function Chat({ onNavigateToPlace }) {
  const { lat, lng } = useGeolocation();
  const isOnline = useOnlineStatus();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusIndex, setStatusIndex] = useState(0);
  const endRef = useRef(null);

  // Initial delayed message trigger (250ms after opening)
  useEffect(() => {
    const timer = setTimeout(() => {
      setMessages([
        {
          role: 'ai',
          text: "Yo! What are we in the mood for today? Tell me what you're thinking!",
          places: []
        }
      ]);
    }, 250);
    return () => clearTimeout(timer);
  }, []);

  // Status cycler animation when thinking
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setStatusIndex(prev => (prev + 1) % STATUS_WORDS.length);
    }, 1200);
    return () => clearInterval(interval);
  }, [loading]);

  // Auto-scroll to bottom
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (e, overrideText = null) => {
    if (e) e.preventDefault();
    const trimmed = overrideText || input.trim();
    if (!trimmed || !isOnline || loading) return;

    const newMsgs = [...messages, { role: 'user', text: trimmed }];
    setMessages(newMsgs);
    setInput('');
    setLoading(true);

    try {
      const { reply, placeIds, fallback } = await api.chat(trimmed, lat, lng);

      // Load place details for recommended IDs
      let places = [];
      if (placeIds && placeIds.length > 0) {
        for (const id of placeIds) {
          let place = await getCachedPlaceById(id);
          if (!place) {
            place = FALLBACK_PLACES.find(p => p.id === id);
          }
          if (place) places.push(place);
        }
      }

      // If no place IDs returned, fallback to top 2 places
      if (places.length === 0) {
        places = FALLBACK_PLACES.slice(0, 2);
      }

      setMessages([...newMsgs, { role: 'ai', text: reply, places, fallback }]);
    } catch (err) {
      setMessages([...newMsgs, {
        role: 'ai',
        text: 'Sorry, I got disconnected for a sec! Try asking again.',
        error: true
      }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOnline) {
    return (
      <div className="app-shell__content chat-screen">
        <div className="chat-screen__offline">
          <WifiOff size={48} color="var(--color-gray-400)" />
          <h2>YOU'RE OFFLINE</h2>
          <p>The AI guide needs an internet connection to think.<br/>Browse your Saved spots or wait to reconnect!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell__content chat-screen">
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h1 style={{ fontSize: '26px' }}>AI GUIDE</h1>
          <Sparkles fill="var(--color-yellow)" size={20} />
        </div>
        <span className="neo-badge neo-badge--mint" style={{ fontSize: '10px' }}>LIVE LOCAL AI</span>
      </div>

      {/* Messages */}
      <div className="chat-screen__messages">
        {messages.map((msg, i) => (
          <div key={i} className={`chat-msg chat-msg--${msg.role}`}>
            {msg.role === 'ai' && (
              <div className="chat-msg__label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                GUIDE {msg.fallback ? '(LOCAL ENGINE)' : ''}
              </div>
            )}

            <div className="chat-msg__text">{msg.text}</div>

            {/* Render Condensed Cards for Recommended Places */}
            {msg.places && msg.places.length > 0 && (
              <div className="chat-msg__places" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                {msg.places.map(place => (
                  <div
                    key={place.id}
                    className="neo-card neo-card--clickable"
                    style={{
                      display: 'flex',
                      gap: '10px',
                      padding: '10px',
                      backgroundColor: 'var(--color-white)',
                      border: '2px solid var(--color-black)',
                      borderRadius: '10px',
                      boxShadow: '3px 3px 0 var(--color-black)',
                      alignItems: 'center'
                    }}
                    onClick={() => onNavigateToPlace?.(place.id)}
                  >
                    <img
                      src={getPlaceImage(place)}
                      alt={place.name}
                      style={{ width: '56px', height: '56px', borderRadius: '8px', objectFit: 'cover', border: '1.5px solid var(--color-black)', flexShrink: 0 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 900, fontSize: '14px', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{place.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 800, color: 'var(--color-black)' }}>{CATEGORY_EMOJI[place.category]} {place.category}</span>
                        <span>•</span>
                        <span>⭐ {place.rating || '4.8'}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      <button className="neo-btn neo-btn--xs neo-btn--primary" style={{ padding: '4px 8px', fontSize: '11px' }}>
                        VIEW
                      </button>
                      <a
                        href={getActionableUrl(place)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="neo-btn neo-btn--xs neo-btn--accent"
                        style={{ padding: '4px 8px', fontSize: '11px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {getActionLabel(place)} <ExternalLink size={10} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Thinking / Processing State with Cycling Words */}
        {loading && (
          <div className="chat-msg chat-msg--ai" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="neo-badge neo-badge--yellow" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '12px' }}>
              <Loader2 size={14} className="spin-icon" style={{ animation: 'spin 1s linear infinite' }} />
              <span>{STATUS_WORDS[statusIndex]}</span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input Area */}
      <div className="chat-screen__input-area" style={{ flexDirection: 'column' }}>
        {messages.length <= 2 && (
          <div style={{ display: 'flex', gap: 'var(--space-2)', overflowX: 'auto', paddingBottom: 'var(--space-2)', scrollbarWidth: 'none', width: '100%' }}>
            {STARTER_PROMPTS.map(p => (
              <button
                key={p}
                className="category-chip"
                style={{ flexShrink: 0 }}
                onClick={() => handleSend(null, p)}
                disabled={loading}
              >
                {p}
              </button>
            ))}
          </div>
        )}
        <form onSubmit={handleSend} style={{ display: 'flex', gap: 'var(--space-2)', width: '100%' }}>
          <input
            type="text"
            className="neo-input"
            style={{ flex: 1 }}
            placeholder="What vibe are we feeling today?"
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            className="neo-btn neo-btn--primary neo-btn--icon"
            disabled={!input.trim() || loading}
            aria-label="Send message"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}
