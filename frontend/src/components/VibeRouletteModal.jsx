import { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, MapPin, Star, RotateCcw, ArrowRight, X, ExternalLink, Flame } from 'lucide-react';
import { getPlaceImage, formatDistance, CATEGORY_EMOJI, CATEGORY_LABELS, getActionableUrl, getActionLabel } from '../lib/geo.js';

export default function VibeRouletteModal({ isOpen, onClose, places, userLat, userLng, onNavigateToPlace }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [spinning, setSpinning] = useState(false);
  const [currentSlotIndex, setCurrentSlotIndex] = useState(0);
  const [winner, setWinner] = useState(null);
  const canvasRef = useRef(null);
  const spinIntervalRef = useRef(null);

  // Eligible places for roulette (high rating >= 4.2 or top curated)
  const eligiblePlaces = useCallback(() => {
    let pool = places.filter(p => {
      const rating = Number(p.rating) || 0;
      return rating >= 4.0 || p.isFeatured;
    });

    if (selectedCategory !== 'all') {
      pool = pool.filter(p => p.category === selectedCategory);
    }

    // If category pool is small, fallback to any place in category
    if (pool.length < 3 && selectedCategory !== 'all') {
      pool = places.filter(p => p.category === selectedCategory);
    }

    // If still empty, use full places
    if (pool.length === 0) pool = places;

    return pool;
  }, [places, selectedCategory]);

  // Confetti celebration engine (Canvas based, 0 dependencies, 60fps)
  const fireConfetti = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = (canvas.width = canvas.offsetWidth);
    const height = (canvas.height = canvas.offsetHeight);

    const colors = ['#F7E84F', '#FF8FC4', '#65D69A', '#8E7CFF', '#FFB15C', '#111111'];
    const particles = Array.from({ length: 70 }, () => ({
      x: width / 2,
      y: height / 2,
      vx: (Math.random() - 0.5) * 14,
      vy: (Math.random() - 0.8) * 16,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      vRot: (Math.random() - 0.5) * 10,
      life: 1,
      decay: Math.random() * 0.02 + 0.015,
    }));

    let animId;
    function animate() {
      ctx.clearRect(0, 0, width, height);
      let alive = false;

      particles.forEach(p => {
        if (p.life > 0) {
          alive = true;
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.4; // gravity
          p.rotation += p.vRot;
          p.life -= p.decay;

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0, p.life);
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          ctx.restore();
        }
      });

      if (alive) {
        animId = requestAnimationFrame(animate);
      }
    }

    animate();
    return () => cancelAnimationFrame(animId);
  }, []);

  // Spin Roulette Logic
  const handleSpin = useCallback(() => {
    const pool = eligiblePlaces();
    if (!pool.length) return;

    setSpinning(true);
    setWinner(null);

    // Trigger phone vibration if supported
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([40, 60, 40]);
    }

    let speed = 60; // ms per tick
    let elapsed = 0;
    const totalSpinTime = 2200; // 2.2s spin
    let currentIndex = Math.floor(Math.random() * pool.length);

    function tick() {
      currentIndex = (currentIndex + 1) % pool.length;
      setCurrentSlotIndex(currentIndex);
      elapsed += speed;

      // Gradually slow down reel
      if (elapsed > totalSpinTime * 0.6) {
        speed += 25;
      }

      if (elapsed < totalSpinTime) {
        spinIntervalRef.current = setTimeout(tick, speed);
      } else {
        // Pick final winning item
        const selectedWinner = pool[currentIndex];
        setWinner(selectedWinner);
        setSpinning(false);

        // Haptic feedback on win
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([100, 50, 150]);
        }

        setTimeout(() => {
          fireConfetti();
        }, 100);
      }
    }

    tick();
  }, [eligiblePlaces, fireConfetti]);

  // Clean up on unmount or close
  useEffect(() => {
    return () => {
      if (spinIntervalRef.current) clearTimeout(spinIntervalRef.current);
    };
  }, []);

  // Reset winner state when modal is opened
  useEffect(() => {
    if (isOpen) {
      setWinner(null);
      setSpinning(false);
      const pool = eligiblePlaces();
      if (pool.length > 0) {
        setCurrentSlotIndex(Math.floor(Math.random() * pool.length));
      }
    }
  }, [isOpen, eligiblePlaces]);

  if (!isOpen) return null;

  const pool = eligiblePlaces();
  const currentPlace = winner || (pool.length > 0 ? pool[currentSlotIndex] : null);

  const categories = [
    { id: 'all', label: 'All Vibes', emoji: '✨' },
    { id: 'food', label: 'Food', emoji: '🍽️' },
    { id: 'cafe', label: 'Cafes', emoji: '☕' },
    { id: 'nightlife', label: 'Nightlife', emoji: '🍸' },
    { id: 'culture', label: 'Culture', emoji: '🏛️' },
    { id: 'outdoor', label: 'Outdoors', emoji: '🌿' },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(17, 17, 17, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <div
        className="neo-card"
        style={{
          maxWidth: '460px',
          width: '100%',
          padding: '24px',
          position: 'relative',
          backgroundColor: 'var(--color-paper)',
          border: '3px solid var(--color-black)',
          borderRadius: '16px',
          boxShadow: '6px 6px 0 var(--color-black)',
          maxHeight: '94vh',
          overflowY: 'auto',
          animation: 'scaleUp 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Canvas for Confetti */}
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 20,
          }}
        />

        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '36px',
            height: '36px',
            border: '2px solid var(--color-black)',
            borderRadius: '50%',
            background: 'var(--color-white)',
            boxShadow: '2px 2px 0 var(--color-black)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10,
            transition: 'transform 0.1s',
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'translate(-1px, -1px)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'translate(0, 0)')}
        >
          <X size={18} strokeWidth={3} />
        </button>

        {/* Header Badge */}
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              backgroundColor: 'var(--color-yellow)',
              border: '2px solid var(--color-black)',
              borderRadius: '999px',
              fontSize: '11px',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              boxShadow: '2px 2px 0 var(--color-black)',
              marginBottom: '8px',
            }}
          >
            <Sparkles size={14} /> SPONTANEOUS DISCOVERY
          </div>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '28px',
              fontWeight: 900,
              margin: '0 0 4px 0',
              letterSpacing: '-0.03em',
              textTransform: 'uppercase',
            }}
          >
            🎰 Vibe Roulette
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
            Can't agree on a spot? Let fate decide in 2 seconds!
          </p>
        </div>

        {/* Vibe Category Chips */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            paddingBottom: '12px',
            marginBottom: '14px',
            scrollbarWidth: 'none',
          }}
        >
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => {
                if (!spinning) {
                  setSelectedCategory(cat.id);
                  setWinner(null);
                }
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 10px',
                fontSize: '11px',
                fontWeight: 800,
                border: '2px solid var(--color-black)',
                borderRadius: '8px',
                backgroundColor: selectedCategory === cat.id ? 'var(--color-pink)' : 'var(--color-white)',
                boxShadow: selectedCategory === cat.id ? '2px 2px 0 var(--color-black)' : '1px 1px 0 var(--color-black)',
                cursor: spinning ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s',
              }}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Slot Machine Window Reel */}
        <div
          style={{
            border: '3px solid var(--color-black)',
            borderRadius: '14px',
            backgroundColor: 'var(--color-black)',
            padding: '4px',
            boxShadow: '4px 4px 0 var(--color-black)',
            marginBottom: '20px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {currentPlace ? (
            <div
              style={{
                backgroundColor: 'var(--color-white)',
                borderRadius: '10px',
                overflow: 'hidden',
                position: 'relative',
                transition: spinning ? 'none' : 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                transform: winner ? 'scale(1.01)' : 'scale(1)',
              }}
            >
              {/* Venue Image with Reel Overlay */}
              <div
                style={{
                  height: '180px',
                  position: 'relative',
                  overflow: 'hidden',
                  borderBottom: '2px solid var(--color-black)',
                  backgroundColor: 'var(--color-cream)',
                }}
              >
                <img
                  src={getPlaceImage(currentPlace)}
                  alt={currentPlace.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                    filter: spinning ? 'blur(1px) brightness(0.95)' : 'none',
                    transition: 'filter 0.1s',
                  }}
                />

                {/* Category & Status Tags */}
                <div
                  style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    backgroundColor: 'var(--color-yellow)',
                    border: '2px solid var(--color-black)',
                    borderRadius: '6px',
                    padding: '3px 8px',
                    fontSize: '11px',
                    fontWeight: 900,
                    boxShadow: '2px 2px 0 var(--color-black)',
                    textTransform: 'uppercase',
                  }}
                >
                  {CATEGORY_EMOJI[currentPlace.category] || '📍'} {currentPlace.category}
                </div>

                {winner && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      backgroundColor: 'var(--color-mint-strong)',
                      border: '2px solid var(--color-black)',
                      borderRadius: '6px',
                      padding: '3px 8px',
                      fontSize: '11px',
                      fontWeight: 900,
                      color: 'var(--color-black)',
                      boxShadow: '2px 2px 0 var(--color-black)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      animation: 'bounce 0.6s infinite alternate',
                    }}
                  >
                    <Flame size={14} fill="var(--color-black)" /> FATE CHOSEN!
                  </div>
                )}
              </div>

              {/* Venue Details */}
              <div style={{ padding: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: '18px',
                      fontWeight: 900,
                      lineHeight: 1.25,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {currentPlace.name}
                  </h3>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                      backgroundColor: 'var(--color-cream)',
                      border: '1.5px solid var(--color-black)',
                      borderRadius: '6px',
                      padding: '2px 6px',
                      fontSize: '12px',
                      fontWeight: 800,
                      flexShrink: 0,
                    }}
                  >
                    <Star size={13} fill="var(--color-yellow)" stroke="var(--color-black)" />
                    <span>{currentPlace.rating || '4.5'}</span>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    marginTop: '6px',
                    fontWeight: 600,
                  }}
                >
                  {currentPlace.city && <span>📍 {currentPlace.city}</span>}
                  {currentPlace.distance !== undefined && (
                    <>
                      <span>•</span>
                      <span>
                        <MapPin size={11} style={{ display: 'inline', marginBottom: '-1px' }} />{' '}
                        {formatDistance(currentPlace.distance)} away
                      </span>
                    </>
                  )}
                </div>

                {currentPlace.address && (
                  <p
                    style={{
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      margin: '6px 0 0 0',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {currentPlace.address}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div
              style={{
                padding: '40px 20px',
                textAlign: 'center',
                backgroundColor: 'var(--color-white)',
                borderRadius: '10px',
                color: 'var(--text-muted)',
              }}
            >
              No places available for this category.
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {!winner ? (
            <button
              onClick={handleSpin}
              disabled={spinning || pool.length === 0}
              className="neo-btn"
              style={{
                width: '100%',
                height: '52px',
                fontSize: '16px',
                fontWeight: 900,
                letterSpacing: '0.02em',
                backgroundColor: 'var(--color-yellow)',
                border: '3px solid var(--color-black)',
                borderRadius: '12px',
                boxShadow: '3px 3px 0 var(--color-black)',
                cursor: spinning ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                textTransform: 'uppercase',
              }}
            >
              {spinning ? (
                <>
                  <RotateCcw size={20} style={{ animation: 'spin 0.6s linear infinite' }} />
                  SPINNING REEL...
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  SPIN THE WHEEL! 🎲
                </>
              )}
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleSpin}
                className="neo-btn neo-btn--ghost"
                style={{
                  flex: '1',
                  height: '50px',
                  fontSize: '14px',
                  fontWeight: 900,
                  border: '2px solid var(--color-black)',
                  borderRadius: '12px',
                  boxShadow: '2px 2px 0 var(--color-black)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  backgroundColor: 'var(--color-white)',
                }}
              >
                <RotateCcw size={16} /> Spin Again
              </button>

              <button
                onClick={() => {
                  onClose();
                  onNavigateToPlace?.(winner.id);
                }}
                className="neo-btn neo-btn--primary"
                style={{
                  flex: '2',
                  height: '50px',
                  fontSize: '14px',
                  fontWeight: 900,
                  backgroundColor: 'var(--color-yellow)',
                  border: '2px solid var(--color-black)',
                  borderRadius: '12px',
                  boxShadow: '3px 3px 0 var(--color-black)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                Let's Go Here! <ArrowRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
