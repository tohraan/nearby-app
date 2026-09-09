/**
 * Chat.jsx — Revamped AI Local Concierge Chat Screen
 * Features AI hero banner, interactive 6-card vibe discovery grid, status cycler, 
 * rich place recommendation cards with double CTAs, and sticky input section.
 */

import { useState, useRef, useEffect } from 'react';
import { Send, MapPin, Sparkles, WifiOff, Loader2, ExternalLink, Coffee, Sunset, Utensils, Mountain, Wine, Landmark, ChevronRight } from 'lucide-react';
import { useGeolocation } from '../hooks/useGeolocation.js';
import { useOnlineStatus } from '../hooks/useOnlineStatus.js';
import { api } from '../lib/api.js';
import { getCachedPlaceById } from '../lib/db.js';
import { CATEGORY_EMOJI, getPlaceImage, getActionableUrl, getActionLabel, formatDistance } from '../lib/geo.js';
import { FALLBACK_PLACES } from '../lib/fallbackData.js';

const VIBE_CARDS = [
  {
    id: 'vibe_coffee',
    icon: Coffee,
    emoji: '☕',
    title: 'Specialty Coffee & Work',
    desc: 'Cozy cafes with high-speed WiFi and great brews',
    prompt: 'Show me top specialty coffee shops in Dubai with great WiFi for work',
    color: 'var(--color-yellow)'
  },
  {
    id: 'vibe_sunset',
    icon: Sunset,
    emoji: '🌅',
    title: 'Sunset & Views',
    desc: 'Rooftops, beach lounges, and scenic golden hour spots',
    prompt: 'Where are the best rooftop lounges or beach spots for sunset views?',
    color: 'var(--color-pink)'
  },
  {
    id: 'vibe_food',
    icon: Utensils,
    emoji: '🌮',
    title: 'Late Night & Cheap Eats',
    desc: 'Top local burgers, shawarma, and hidden culinary gems',
    prompt: 'Recommend hidden gem food spots and late night eats nearby',
    color: 'var(--color-mint)'
  },
  {
    id: 'vibe_outdoor',
    icon: Mountain,
    emoji: '🏃',
    title: 'Outdoor & Road Trips',
    desc: 'Mountain drives, beach volleyball, ziplines, and trails',
    prompt: 'What are the best outdoor activities or road trip spots in UAE?',
    color: 'var(--color-sky)'
  },
  {
    id: 'vibe_drinks',
    icon: Wine,
    emoji: '🍸',
    title: 'Drinks & Speakeasies',
    desc: 'Trendy lounges, speakeasies, and live music venues',
    prompt: 'Suggest top nightlife spots, cocktails, or speakeasies around',
    color: 'var(--color-lavender)'
  },
  {
    id: 'vibe_culture',
    icon: Landmark,
    emoji: '🏛️',
    title: 'Art & Cultural Hubs',
    desc: 'Exhibitions, art districts, and iconic architecture',
    prompt: 'What cultural landmarks or art exhibitions should I visit today?',
    color: 'var(--color-cream)'
  }
];

const STARTER_PROMPTS = [
  "☕ Quiet cafe for work",
  "🌮 Best cheap eats",
  "🏃 Outdoor adventure",
  "🍸 Evening drinks & vibe",
  "📷 Iconic photo spot"
];

const STATUS_WORDS = [
  "Scanning UAE map...",
  "Sniffing out fresh brews...",
  "Consulting local guides...",
  "Checking vibes & ratings...",
  "Curating top recommendations...",
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

  // Initial greeting
  useEffect(() => {
    setMessages([
      {
        role: 'ai',
        text: "Yo! I'm your AI Local Concierge. Ask me for cafe recommendations, hidden speakeasies, sunset spots, or select a vibe card below!",
        places: []
      }
    ]);
  }, []);

  // Status cycler animation when thinking
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setStatusIndex(prev => (prev + 1) % STATUS_WORDS.length);
    }, 1100);
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

      if (places.length === 0) {
        places = FALLBACK_PLACES.slice(0, 3);
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
    <div className="app-shell__content chat-screen" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100dvh - 90px)' }}>
      {/* ─── Hero AI Concierge Banner ─── */}
      <div
        className="neo-card"
        style={{
          padding: '12px 16px',
          backgroundColor: 'var(--color-yellow)',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between',
          flexShrink: 0
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-black)',
              color: 'var(--color-yellow)',
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              fontSize: '20px',
              fontWeight: 900,
              boxShadow: '2px 2px 0 var(--color-pink)',
              flexShrink: 0
            }}
          >
            🤖
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              AI LOCAL CONCIERGE
            </div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--color-black)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#00C853', display: 'inline-block' }} />
              LIVE LOCAL INTELLIGENCE (UAE)
            </div>
          </div>
        </div>

        <span className="neo-badge neo-badge--pink" style={{ fontSize: '10px', fontWeight: 900 }}>
          <Sparkles size={12} fill="var(--color-black)" /> SMART GUIDE
        </span>
      </div>

      {/* ─── Messages Thread / Vibe Panel Container ─── */}
      <div className="chat-screen__messages" style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
        {/* Render Conversation Messages */}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`chat-msg chat-msg--${msg.role}`}
            style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '90%',
              width: msg.role === 'ai' ? '100%' : 'auto'
            }}
          >
            {msg.role === 'ai' && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '11px',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  marginBottom: '6px',
                  color: 'var(--text-muted)'
                }}
              >
                <span>🤖 LOCAL CONCIERGE</span>
                {msg.fallback && <span className="neo-badge neo-badge--yellow" style={{ fontSize: '9px', padding: '1px 5px' }}>LOCAL ENGINE</span>}
              </div>
            )}

            <div
              className={`neo-card ${msg.role === 'user' ? 'neo-card--yellow' : 'neo-card--cream'}`}
              style={{
                padding: '12px 16px',
                fontSize: '14px',
                lineHeight: 1.4,
                fontWeight: 700,
                backgroundColor: msg.role === 'user' ? 'var(--color-yellow)' : 'var(--color-paper)'
              }}
            >
              {msg.text}
            </div>

            {/* Render Recommended Places Cards Grid */}
            {msg.places && msg.places.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  🎯 RECOMMENDED SPOTS FOR YOU ({msg.places.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {msg.places.map(place => (
                    <div
                      key={place.id}
                      className="neo-card neo-card--clickable"
                      style={{
                        padding: '10px',
                        backgroundColor: 'var(--color-cream)',
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'center'
                      }}
                      onClick={() => onNavigateToPlace?.(place.id)}
                    >
                      <img
                        src={getPlaceImage(place)}
                        alt={place.name}
                        style={{
                          width: '70px',
                          height: '70px',
                          borderRadius: '8px',
                          objectFit: 'cover',
                          border: '2px solid var(--color-black)',
                          flexShrink: 0
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '14px', fontWeight: 900, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {place.name}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 800 }}>{CATEGORY_EMOJI[place.category]} {place.category}</span>
                          <span>•</span>
                          <span>⭐ {place.rating || '4.8'}</span>
                          <span>•</span>
                          <span>{place.city}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                          <button
                            className="neo-btn neo-btn--xs neo-btn--primary"
                            style={{ padding: '3px 10px', fontSize: '11px', fontWeight: 900 }}
                          >
                            VIEW DETAILS
                          </button>
                          <a
                            href={getActionableUrl(place)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="neo-btn neo-btn--xs neo-btn--accent"
                            style={{ padding: '3px 10px', fontSize: '11px', fontWeight: 900, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {getActionLabel(place)} <ExternalLink size={10} />
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Interactive Vibe Discovery Panel (Shown when conversation is fresh) */}
        {messages.length <= 1 && (
          <div style={{ marginTop: '16px', marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
              ⚡ CHOOSE A VIBE TO GET INSTANT AI RECOMMENDATIONS
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
              {VIBE_CARDS.map(card => {
                const IconComp = card.icon;
                return (
                  <div
                    key={card.id}
                    className="neo-card neo-card--clickable"
                    style={{
                      padding: '12px',
                      backgroundColor: card.color,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleSend(null, card.prompt)}
                  >
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        backgroundColor: 'var(--color-black)',
                        color: 'var(--color-cream)',
                        display: 'flex',
                        alignItems: 'center',
                        justify: 'center',
                        flexShrink: 0
                      }}
                    >
                      <IconComp size={20} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: 900, lineHeight: 1.2 }}>
                        {card.emoji} {card.title}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-black)', marginTop: '2px', opacity: 0.85, lineHeight: 1.3 }}>
                        {card.desc}
                      </div>
                      <div style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '2px' }}>
                        ASK CONCIERGE <ChevronRight size={10} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Thinking / Processing State with Cycling Words */}
        {loading && (
          <div className="chat-msg chat-msg--ai" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
            <div className="neo-badge neo-badge--yellow" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 14px', fontSize: '13px', fontWeight: 900 }}>
              <Loader2 size={16} className="spin-icon" style={{ animation: 'spin 1s linear infinite' }} />
              <span>{STATUS_WORDS[statusIndex]}</span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* ─── Sticky Input Area ─── */}
      <div
        style={{
          position: 'sticky',
          bottom: 0,
          backgroundColor: 'var(--color-cream)',
          paddingTop: '8px',
          paddingBottom: '4px',
          flexShrink: 0
        }}
      >
        {/* Horizontal Starter Chips */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none' }}>
          {STARTER_PROMPTS.map(p => (
            <button
              key={p}
              className="category-chip"
              style={{ flexShrink: 0, padding: '4px 10px', fontSize: '11px', fontWeight: 800 }}
              onClick={() => handleSend(null, p)}
              disabled={loading}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} style={{ display: 'flex', gap: '8px', width: '100%' }}>
          <input
            type="text"
            className="neo-input"
            style={{ flex: 1, height: '46px', fontSize: '14px' }}
            placeholder="Ask AI: coffee spots, sunsets, late night eats..."
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            className="neo-btn neo-btn--primary"
            style={{ width: '50px', height: '46px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
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
