/**
 * Chat.jsx — AI Local Guide chat screen
 */

import { useState, useRef, useEffect } from 'react';
import { Send, MapPin, Sparkles, WifiOff } from 'lucide-react';
import { useGeolocation } from '../hooks/useGeolocation.js';
import { useOnlineStatus } from '../hooks/useOnlineStatus.js';
import { api } from '../lib/api.js';
import { getCachedPlaceById } from '../lib/db.js';

const STARTER_PROMPTS = [
  "☕️ Quiet cafe",
  "🌮 Cheap eats",
  "🏃‍♂️ Outdoor activity"
];

export default function Chat({ onNavigateToPlace }) {
  const { lat, lng } = useGeolocation();
  const isOnline = useOnlineStatus();
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: 'Hey! I\'m your local guide. Tell me what you\'re in the mood for, and I\'ll find the best spots nearby.',
      places: [],
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

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
      
      // Load place details from IDB for any recommended places
      const places = [];
      if (placeIds && placeIds.length > 0) {
        for (const id of placeIds) {
          const place = await getCachedPlaceById(id);
          if (place) places.push(place);
        }
      }

      setMessages([...newMsgs, { role: 'ai', text: reply, places, fallback }]);
    } catch (err) {
      setMessages([...newMsgs, { 
        role: 'ai', 
        text: 'Sorry, I got disconnected! Try asking again in a moment.',
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
      <div style={{ marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <h1 style={{ fontSize: '28px' }}>AI GUIDE</h1>
        <Sparkles fill="var(--color-yellow)" />
      </div>

      <div className="chat-screen__messages">
        {messages.map((msg, i) => (
          <div key={i} className={`chat-msg chat-msg--${msg.role}`}>
            {msg.role === 'ai' && <div className="chat-msg__label">GUIDE {msg.fallback ? '(OFFLINE)' : ''}</div>}
            <div className="chat-msg__text">{msg.text}</div>
            
            {msg.places && msg.places.length > 0 && (
              <div className="chat-msg__places">
                {msg.places.map(place => (
                  <div 
                    key={place.id} 
                    className="neo-card neo-card--compact neo-card--clickable" 
                    style={{ background: 'var(--color-white)', color: 'var(--color-black)' }}
                    onClick={() => onNavigateToPlace?.(place.id)}
                  >
                    <div style={{ fontWeight: 700, fontSize: '15px' }}>{place.name}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                      <MapPin size={12}/> {place.category} • ⭐ {place.rating}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="chat-msg chat-msg--ai">
            <div className="skeleton" style={{ width: '80px', height: '14px', marginBottom: '8px' }} />
            <div className="skeleton" style={{ width: '180px', height: '18px' }} />
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="chat-screen__input-area" style={{ flexDirection: 'column' }}>
        {messages.length === 1 && (
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
            placeholder="Find me a quiet cafe for reading..."
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
