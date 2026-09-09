/**
 * Chat.jsx — Nearby Bot Chat Screen
 * Standard messaging platform chat window UI with avatar message bubbles,
 * enhanced quick action prompts with Lucide icons, persistent chat memory across tab switches,
 * and gallery recommendation cards.
 */

import { useState, useRef, useEffect } from 'react';
import { Send, MapPin, Sparkles, WifiOff, Loader2, ExternalLink, Coffee, Sunset, Utensils, Mountain, Wine, Landmark, ChevronRight, Camera, GlassWater, Compass, Trash2 } from 'lucide-react';
import { useGeolocation } from '../hooks/useGeolocation.js';
import { useOnlineStatus } from '../hooks/useOnlineStatus.js';
import { api } from '../lib/api.js';
import { getCachedPlaceById } from '../lib/db.js';
import { CATEGORY_EMOJI, getPlaceImage, getActionableUrl, getActionLabel, formatDistance } from '../lib/geo.js';
import { FALLBACK_PLACES } from '../lib/fallbackData.js';

const CHAT_STORAGE_KEY = 'nearby_chat_history';

const VIBE_CARDS = [
  {
    id: 'vibe_coffee',
    icon: Coffee,
    emoji: '☕',
    title: 'Specialty Coffee & Work',
    desc: 'Cozy cafes with high-speed WiFi and great brews',
    prompt: 'Show me top specialty coffee shops in Dubai with great WiFi for work',
  },
  {
    id: 'vibe_sunset',
    icon: Sunset,
    emoji: '🌅',
    title: 'Sunset & Views',
    desc: 'Rooftops, beach lounges, and scenic golden hour spots',
    prompt: 'Where are the best rooftop lounges or beach spots for sunset views?',
  },
  {
    id: 'vibe_food',
    icon: Utensils,
    emoji: '🌮',
    title: 'Late Night & Cheap Eats',
    desc: 'Top local burgers, shawarma, and hidden culinary gems',
    prompt: 'Recommend hidden gem food spots and late night eats nearby',
  },
  {
    id: 'vibe_outdoor',
    icon: Mountain,
    emoji: '🏃',
    title: 'Outdoor & Road Trips',
    desc: 'Mountain drives, beach volleyball, ziplines, and trails',
    prompt: 'What are the best outdoor activities or road trip spots in UAE?',
  },
  {
    id: 'vibe_drinks',
    icon: GlassWater,
    emoji: '🍸',
    title: 'Drinks & Speakeasies',
    desc: 'Trendy lounges, speakeasies, and live music venues',
    prompt: 'Suggest top nightlife spots, cocktails, or speakeasies around',
  },
  {
    id: 'vibe_culture',
    icon: Landmark,
    emoji: '🏛️',
    title: 'Art & Cultural Hubs',
    desc: 'Exhibitions, art districts, and iconic architecture',
    prompt: 'What cultural landmarks or art exhibitions should I visit today?',
  }
];

const STARTER_PROMPTS = [
  { label: 'Quiet cafe for work', icon: Coffee, emoji: '☕', prompt: 'Show me top specialty coffee shops in Dubai with great WiFi for work' },
  { label: 'Best cheap eats', icon: Utensils, emoji: '🌮', prompt: 'Recommend hidden gem food spots and late night eats nearby' },
  { label: 'Outdoor adventure', icon: Mountain, emoji: '🏃', prompt: 'What are the best outdoor activities or road trip spots in UAE?' },
  { label: 'Evening drinks & vibe', icon: GlassWater, emoji: '🍸', prompt: 'Suggest top nightlife spots, cocktails, or speakeasies around' },
  { label: 'Iconic photo spot', icon: Camera, emoji: '📷', prompt: 'What cultural landmarks or iconic photo spots should I visit today?' }
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
  
  // Persistent chat memory state
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load chat history', e);
    }
    return [
      {
        role: 'ai',
        text: "Yo! I'm Nearby Bot 🤖. Ask me for cafe recommendations, hidden speakeasies, sunset spots, or select a vibe card below!",
        places: []
      }
    ];
  });

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusIndex, setStatusIndex] = useState(0);
  const endRef = useRef(null);

  // Save chat history to localStorage on update
  useEffect(() => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    } catch (e) {
      console.warn('Failed to save chat history', e);
    }
  }, [messages]);

  // Status cycler animation when thinking
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setStatusIndex(prev => (prev + 1) % STATUS_WORDS.length);
    }, 1100);
    return () => clearInterval(interval);
  }, [loading]);

  // Auto-scroll to bottom on message
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleClearHistory = () => {
    const defaultInitial = [
      {
        role: 'ai',
        text: "Yo! I'm Nearby Bot 🤖. Ask me for cafe recommendations, hidden speakeasies, sunset spots, or select a vibe card below!",
        places: []
      }
    ];
    setMessages(defaultInitial);
    try {
      localStorage.removeItem(CHAT_STORAGE_KEY);
    } catch (e) {}
  };

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
          if (place && !places.some(p => p.id === place.id)) {
            places.push(place);
          }
        }
      }

      if (places.length === 0) {
        const fullText = (reply + ' ' + trimmed).toLowerCase();
        places = FALLBACK_PLACES.filter(p => fullText.includes(p.name.toLowerCase()) || (p.city && fullText.includes(p.city.toLowerCase())));
        if (places.length === 0) {
          if (fullText.includes('outdoor') || fullText.includes('road trip') || fullText.includes('mountain') || fullText.includes('beach')) {
            places = FALLBACK_PLACES.filter(p => p.category === 'outdoor' || p.id === 'fallback_jebel_jais' || p.id === 'fallback_kite_beach');
          } else if (fullText.includes('cafe') || fullText.includes('coffee') || fullText.includes('work')) {
            places = FALLBACK_PLACES.filter(p => p.category === 'cafe' || p.id === 'fallback_tom_serge' || p.id === 'fallback_al_serkal');
          } else if (fullText.includes('eat') || fullText.includes('food') || fullText.includes('drink')) {
            places = FALLBACK_PLACES.filter(p => p.category === 'food' || p.id === 'fallback_pierchic');
          } else if (fullText.includes('culture') || fullText.includes('art') || fullText.includes('museum')) {
            places = FALLBACK_PLACES.filter(p => p.category === 'culture' || p.id === 'fallback_museum_future' || p.id === 'fallback_louvre_ad');
          } else {
            places = FALLBACK_PLACES.slice(0, 3);
          }
        }
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
          <p>Nearby Bot needs an internet connection to think.<br/>Browse your Saved spots or wait to reconnect!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell__content chat-screen" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100dvh - 84px)', paddingBottom: 0 }}>
      {/* ─── Nearby Bot Top Header ─── */}
      <div
        style={{
          padding: '10px 16px',
          backgroundColor: 'var(--color-paper)',
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between',
          flexShrink: 0,
          border: '1.5px solid var(--border-default)',
          borderRadius: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-yellow)',
              border: '1.5px solid var(--color-black)',
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              fontSize: '16px',
              flexShrink: 0
            }}
          >
            🤖
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, lineHeight: 1.1 }}>
              Nearby Bot
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--state-success)', display: 'inline-block' }} />
              Online • UAE Local Guide
            </div>
          </div>
        </div>

        {/* Low-emphasis ghost/outlined clear button */}
        <button
          onClick={handleClearHistory}
          title="Clear Chat History"
          style={{
            padding: '4px 10px',
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--text-muted)',
            backgroundColor: 'transparent',
            border: '1px solid var(--border-muted)',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            cursor: 'pointer'
          }}
        >
          <Trash2 size={12} /> Clear
        </button>
      </div>

      {/* ─── Messaging App Chat Thread ─── */}
      <div className="chat-screen__messages" style={{ flex: 1, overflowY: 'auto', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {messages.map((msg, i) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isUser ? 'flex-end' : 'flex-start',
                maxWidth: '88%',
                alignSelf: isUser ? 'flex-end' : 'flex-start',
                width: isUser ? 'auto' : '100%'
              }}
            >
              {/* Bot Avatar Row */}
              {!isUser && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-yellow)',
                      border: '1px solid var(--color-black)',
                      display: 'flex',
                      alignItems: 'center',
                      justify: 'center',
                      fontSize: '12px'
                    }}
                  >
                    🤖
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>
                    Nearby Bot
                  </span>
                </div>
              )}

              {/* Message Bubble */}
              <div
                style={{
                  padding: '12px 16px',
                  fontSize: '14px',
                  lineHeight: 1.45,
                  fontWeight: isUser ? 600 : 400,
                  backgroundColor: isUser ? 'var(--color-yellow)' : 'var(--color-white)',
                  color: 'var(--color-black)',
                  borderRadius: isUser ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                  border: '1.5px solid var(--color-black)',
                  boxShadow: '2px 2px 0 var(--color-black)',
                  maxWidth: '100%'
                }}
              >
                {msg.text}
              </div>

              {/* Recommended Places Cards embedded under Bot Reply */}
              {!isUser && msg.places && msg.places.length > 0 && (
                <div style={{ width: '100%', marginTop: '12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    Recommended Spots ({msg.places.length})
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '12px' }}>
                    {msg.places.map(place => (
                      <div
                        key={place.id}
                        className="neo-card neo-card--clickable place-card"
                        style={{ padding: '12px', backgroundColor: 'var(--color-white)', width: '100%', display: 'flex', flexDirection: 'column' }}
                        onClick={() => onNavigateToPlace?.(place.id)}
                      >
                        <div className="place-card__image" style={{ position: 'relative', overflow: 'hidden', height: '130px', borderRadius: '8px', border: '1.5px solid var(--color-black)', marginBottom: '8px' }}>
                          <img
                            src={getPlaceImage(place)}
                            alt={place.name}
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&auto=format&fit=crop&q=80';
                            }}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          />
                        </div>

                        <div className={`category-tag category-tag--${place.category}`}>
                          {CATEGORY_EMOJI[place.category]} {place.category}
                        </div>

                        <div className="place-card__name" style={{ fontSize: '16px' }}>{place.name}</div>

                        <div className="place-card__meta" style={{ marginTop: '4px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="place-card__rating">⭐ {place.rating || '4.8'}</span>
                          <span style={{ color: 'var(--text-muted)' }}>•</span>
                          <span>{place.city}</span>
                        </div>

                        <div className="place-card__actions" style={{ marginTop: 'auto', paddingTop: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <a
                            href={getActionableUrl(place)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="neo-btn neo-btn--sm neo-btn--primary"
                            style={{ flex: 1, padding: '0 8px', fontSize: '12px', fontWeight: 700, textDecoration: 'none', textAlign: 'center', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {getActionLabel(place)} <ExternalLink size={10} />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Interactive Vibe Discovery Panel (Unified neutral card style + secondary accent icon chip) */}
        {messages.length <= 1 && (
          <div style={{ marginTop: '8px', marginBottom: '8px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '10px' }}>
              Choose a vibe for instant recommendations
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
              {VIBE_CARDS.map(card => {
                const IconComp = card.icon;
                return (
                  <div
                    key={card.id}
                    className="neo-card neo-card--clickable"
                    style={{
                      padding: '12px',
                      backgroundColor: 'var(--color-white)',
                      border: '1.5px solid var(--border-default)',
                      boxShadow: '2px 2px 0 var(--color-black)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleSend(null, card.prompt)}
                  >
                    {/* Icon chip using secondary accent color background */}
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        backgroundColor: 'var(--color-sky)',
                        color: 'var(--color-black)',
                        border: '1px solid var(--color-black)',
                        display: 'flex',
                        alignItems: 'center',
                        justify: 'center',
                        flexShrink: 0
                      }}
                    >
                      <IconComp size={18} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, lineHeight: 1.2, color: 'var(--text-primary)' }}>
                        {card.title}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.3 }}>
                        {card.desc}
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '2px' }}>
                        Ask Bot →
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Thinking State */}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-yellow)',
                border: '1px solid var(--color-black)',
                display: 'flex',
                alignItems: 'center',
                justify: 'center',
                fontSize: '12px'
              }}
            >
              🤖
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: 600, backgroundColor: 'var(--color-white)', border: '1px solid var(--border-default)', borderRadius: '8px' }}>
              <Loader2 size={14} className="spin-icon" style={{ animation: 'spin 1s linear infinite' }} />
              <span>{STATUS_WORDS[statusIndex]}</span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* ─── Sticky Bottom Action Bar & Input ─── */}
      <div
        style={{
          position: 'sticky',
          bottom: 0,
          backgroundColor: 'var(--color-paper)',
          paddingTop: '10px',
          paddingBottom: '10px',
          flexShrink: 0,
          zIndex: 100,
          borderTop: '1px solid var(--border-muted)',
          marginInline: '-16px',
          paddingInline: '16px'
        }}
      >
        {/* Quick Action Prompt Pills using neutral outlined-pill style */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none' }}>
          {STARTER_PROMPTS.map(sp => {
            const IconComp = sp.icon;
            return (
              <button
                key={sp.label}
                style={{
                  flexShrink: 0,
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  backgroundColor: 'var(--color-white)',
                  color: 'var(--color-black)',
                  border: '1.5px solid var(--color-black)',
                  borderRadius: '999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  cursor: 'pointer'
                }}
                onClick={() => handleSend(null, sp.prompt)}
                disabled={loading}
              >
                <IconComp size={12} />
                <span>{sp.label}</span>
              </button>
            );
          })}
        </div>

        {/* Input Form — Send button is sole solid primary accent fill */}
        <form onSubmit={handleSend} style={{ display: 'flex', gap: '8px', width: '100%' }}>
          <input
            type="text"
            className="neo-input"
            style={{ flex: 1, height: '46px', fontSize: '14px', borderRadius: '10px', backgroundColor: 'var(--color-white)' }}
            placeholder="Ask Nearby Bot: coffee spots, sunsets, late night eats..."
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            className="neo-btn neo-btn--primary"
            style={{ width: '48px', height: '46px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-yellow)', color: 'var(--color-black)', borderRadius: '10px', flexShrink: 0 }}
            disabled={!input.trim() || loading}
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}

