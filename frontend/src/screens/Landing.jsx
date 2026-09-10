import React, { useEffect, useRef } from 'react';
import { Map, Coffee, Ticket, MapPin, Activity, Film } from 'lucide-react';
import { getVerticalForCategory, CATEGORY_EMOJI } from '../lib/geo.js';
import HeroAmbientScene from '../components/ambient/HeroAmbientScene';

// The URL for the main app routing
const APP_URL = '/app';

export default function Landing({ onStartExploring }) {
  const observerRef = useRef(null);

  const handleCtaClick = (e) => {
    if (onStartExploring) {
      e.preventDefault();
      onStartExploring(e);
    }
  };

  useEffect(() => {
    // Setup intersection observer for stagger-fade-in animation
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          observerRef.current.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    const elements = document.querySelectorAll('.stagger-fade-element');
    elements.forEach(el => observerRef.current.observe(el));

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return (
    <div className="landing-page">
      <style>{`
        /* Scoped Landing Page Tokens & Resets */
        .landing-page {
          --color-bg-sand: #F7F5F0;
          --color-ink-black: #1C1A17;
          --color-primary-terracotta: #C65D3B;
          --color-secondary-palm: #2F6E5C;
          --color-muted-stone: #8A8578;
          
          /* Hero Tints for specific sections */
          --tint-eat-bg: hsl(38, 90%, 94%);
          --tint-attractions-bg: hsl(145, 60%, 93%);
          --tint-sports-bg: hsl(14, 90%, 94%);
          --tint-movies-bg: hsl(212, 70%, 93%);

          background-color: var(--color-bg-sand);
          color: var(--color-ink-black);
          min-height: 100dvh;
          font-family: var(--font-sans);
          overflow-x: hidden;
        }

        .landing-nav {
          padding: 24px 32px;
          display: flex;
          align-items: center;
        }

        .landing-logo {
          font-family: var(--font-serif);
          font-weight: 700;
          font-size: 24px;
          color: var(--color-ink-black);
          text-decoration: none;
        }

        .landing-hero {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 32px 80px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .landing-headline {
          font-family: var(--font-serif);
          font-size: clamp(40px, 6vw, 72px);
          line-height: 1.1;
          font-weight: 700;
          max-width: 900px;
          margin-bottom: 24px;
          color: var(--color-ink-black);
        }

        .landing-subheadline {
          font-family: var(--font-sans);
          font-size: clamp(18px, 2.5vw, 22px);
          line-height: 1.5;
          color: var(--color-muted-stone);
          max-width: 650px;
          margin-bottom: 40px;
        }

        .landing-cta {
          display: inline-block;
          background-color: var(--color-primary-terracotta);
          color: #FFFFFF;
          font-family: var(--font-sans);
          font-weight: 700;
          font-size: 18px;
          padding: 16px 36px;
          border-radius: var(--radius-md);
          border: 2px solid var(--color-ink-black);
          box-shadow: 4px 4px 0 var(--color-ink-black);
          text-decoration: none;
          transition: transform 80ms ease, box-shadow 80ms ease;
          cursor: pointer;
        }

        /* Respect prefers-reduced-motion for press scale */
        @media (prefers-reduced-motion: no-preference) {
          .landing-cta:active {
            transform: scale(0.97);
            box-shadow: 2px 2px 0 var(--color-ink-black);
          }
        }

        .landing-hero-visual {
          margin-top: 64px;
          width: 100%;
          max-width: 1000px;
          border-radius: var(--radius-lg);
          border: 3px solid var(--color-ink-black);
          box-shadow: 8px 8px 0 var(--color-ink-black);
          overflow: hidden;
          position: relative;
          background-color: var(--color-secondary-palm);
          aspect-ratio: 16 / 9;
          container-type: inline-size;
        }

        .landing-hero-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0.85; /* Soft tint effect */
          mix-blend-mode: multiply;
        }

        /* Hero Ambient Background Motion Layer */
        .ambient-hero-overlay {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 1;
          overflow: hidden;
        }

        .ambient-primitive {
          position: absolute;
          color: var(--color-ink-black);
          transform: translateX(-60px);
          will-change: transform;
        }

        .ambient-car {
          width: 26px;
          height: 13px;
        }

        .ambient-cloud {
          width: 44px;
          height: 22px;
        }

        .ambient-plane {
          width: 18px;
          height: 18px;
        }

        .ambient-svg {
          width: 100%;
          height: 100%;
          display: block;
        }

        @keyframes ambientCarMove {
          0% {
            transform: translateX(-60px);
          }
          100% {
            transform: translateX(calc(100cqw + 60px));
          }
        }

        @keyframes ambientPlaneMove {
          0% {
            transform: translateX(-60px) translateY(0px);
          }
          50% {
            transform: translateX(calc(50cqw)) translateY(-6px);
          }
          100% {
            transform: translateX(calc(100cqw + 60px)) translateY(-12px);
          }
        }

        /* Ambient motion active only when prefers-reduced-motion is NOT set */
        @media (prefers-reduced-motion: no-preference) {
          .ambient-car {
            animation-name: ambientCarMove;
            animation-timing-function: linear;
            animation-iteration-count: infinite;
          }

          .ambient-cloud {
            animation-name: ambientCarMove;
            animation-timing-function: linear;
            animation-iteration-count: infinite;
          }

          .ambient-plane {
            animation-name: ambientPlaneMove;
            animation-timing-function: linear;
            animation-iteration-count: infinite;
          }
        }

        /* Mobile Viewport Check: max 2 ambient elements active */
        @media (max-width: 768px) {
          .desktop-only-ambient {
            display: none !important;
          }
        }

        .landing-section {
          max-width: 1200px;
          margin: 0 auto;
          padding: 80px 32px;
        }

        .landing-section-title {
          font-family: var(--font-serif);
          font-size: 36px;
          font-weight: 700;
          margin-bottom: 48px;
          text-align: center;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 24px;
        }

        .feature-block {
          background-color: #FFFFFF;
          border: 2px solid var(--color-ink-black);
          border-radius: var(--radius-md);
          padding: 24px;
          box-shadow: 4px 4px 0 var(--color-ink-black);
          display: flex;
          flex-direction: column;
          gap: 16px;
          transition: transform 150ms ease-out, box-shadow 150ms ease-out;
        }

        .feature-icon-wrapper {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-md);
          border: 2px solid var(--color-ink-black);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          box-shadow: 2px 2px 0 var(--color-ink-black);
        }

        .feature-title {
          font-weight: 700;
          font-size: 20px;
          margin: 0;
        }

        .feature-desc {
          font-size: 16px;
          line-height: 1.5;
          color: var(--color-muted-stone);
          margin: 0;
        }

        .steps-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
          max-width: 800px;
          margin: 0 auto;
        }

        @media (min-width: 768px) {
          .steps-container {
            flex-direction: row;
          }
        }

        .step-block {
          flex: 1;
          background-color: var(--color-cream);
          border: 2px solid var(--color-ink-black);
          border-radius: var(--radius-md);
          padding: 24px;
          box-shadow: 4px 4px 0 var(--color-ink-black);
          position: relative;
          transition: transform 150ms ease-out, box-shadow 150ms ease-out;
        }

        @media (prefers-reduced-motion: no-preference) {
          .feature-block:hover,
          .step-block:hover {
            transform: translateY(-3px);
            box-shadow: 6px 6px 0 var(--color-ink-black);
          }
        }

        .step-number {
          position: absolute;
          top: -16px;
          left: 24px;
          background-color: var(--color-ink-black);
          color: #FFFFFF;
          font-family: var(--font-serif);
          font-weight: 700;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }

        .step-title {
          font-weight: 700;
          font-size: 18px;
          margin: 12px 0 8px 0;
        }

        .step-desc {
          color: var(--color-muted-stone);
          font-size: 15px;
          line-height: 1.5;
          margin: 0;
        }

        .landing-footer {
          text-align: center;
          padding: 80px 32px 40px;
          background-color: var(--color-cream);
          border-top: 2px solid var(--color-ink-black);
        }

        .footer-headline {
          font-family: var(--font-serif);
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 32px;
        }

        .footer-bottom {
          margin-top: 80px;
          font-size: 14px;
          color: var(--color-muted-stone);
        }

        /* Stagger Fade-In Animation */
        .stagger-fade-element {
          opacity: 0;
          transform: translateY(15px);
          transition: opacity 0.6s ease-out, transform 0.6s ease-out;
        }

        .stagger-fade-element.animate-in {
          opacity: 1;
          transform: translateY(0);
        }

        @media (prefers-reduced-motion: reduce) {
          .stagger-fade-element {
            opacity: 1;
            transform: none;
            transition: none;
          }
        }
      `}</style>

      {/* Section 1: Hero */}
      <nav className="landing-nav">
        <a href="/" className="landing-logo">Nearby</a>
      </nav>

      <header className="landing-hero">
        <h1 className="landing-headline">Find your next favorite spot. Then find people to share it with.</h1>
        <p className="landing-subheadline">
          Browse cafes, attractions, and movies nearby. Or jump into casual sports meetups to meet people around shared interests.
        </p>
        <a href={APP_URL} className="landing-cta" onClick={handleCtaClick}>
          Start exploring
        </a>

        <div className="landing-hero-visual">
          <img 
            src="https://images.unsplash.com/photo-1546412414-8035e1776c9a?auto=format&fit=crop&w=1200&q=80" 
            alt="Dubai lifestyle" 
            className="landing-hero-img"
            loading="lazy"
          />
          <HeroAmbientScene />
        </div>
      </header>

      {/* Section 2: Features */}
      <section className="landing-section">
        <h2 className="landing-section-title">What you can do</h2>
        <div className="features-grid">
          
          <div className="feature-block stagger-fade-element" style={{ transitionDelay: '0ms' }}>
            <div className="feature-icon-wrapper" style={{ backgroundColor: 'var(--tint-eat-bg)' }}>
              🍽️
            </div>
            <h3 className="feature-title">Eat & Drink</h3>
            <p className="feature-desc">Real photos, real reviews, no repeat listings.</p>
          </div>

          <div className="feature-block stagger-fade-element" style={{ transitionDelay: '80ms' }}>
            <div className="feature-icon-wrapper" style={{ backgroundColor: 'var(--tint-attractions-bg)' }}>
              🎟️
            </div>
            <h3 className="feature-title">Attractions</h3>
            <p className="feature-desc">Tickets, hours, and prices before you go.</p>
          </div>

          <div className="feature-block stagger-fade-element" style={{ transitionDelay: '160ms' }}>
            <div className="feature-icon-wrapper" style={{ backgroundColor: 'var(--tint-sports-bg)' }}>
              🏐
            </div>
            <h3 className="feature-title">Sports & Meetups</h3>
            <p className="feature-desc">Create or join casual sport meetups (e.g., volleyball at Kite Beach). See who's already going.</p>
          </div>

          <div className="feature-block stagger-fade-element" style={{ transitionDelay: '240ms' }}>
            <div className="feature-icon-wrapper" style={{ backgroundColor: 'var(--tint-movies-bg)' }}>
              🎬
            </div>
            <h3 className="feature-title">Movies</h3>
            <p className="feature-desc">Showtimes and ratings for what's playing nearby.</p>
          </div>

        </div>
      </section>

      {/* Section 3: Meetups */}
      <section className="landing-section">
        <h2 className="landing-section-title">How meetups work</h2>
        <div className="steps-container">
          
          <div className="step-block stagger-fade-element" style={{ transitionDelay: '0ms' }}>
            <div className="step-number">1</div>
            <h3 className="step-title">Pick a sport and a spot</h3>
            <p className="step-desc">Volleyball at Kite Beach, this Saturday.</p>
          </div>

          <div className="step-block stagger-fade-element" style={{ transitionDelay: '80ms' }}>
            <div className="step-number">2</div>
            <h3 className="step-title">See who else is in</h3>
            <p className="step-desc">Real people, real headcount, not a guessing game.</p>
          </div>

          <div className="step-block stagger-fade-element" style={{ transitionDelay: '160ms' }}>
            <div className="step-number">3</div>
            <h3 className="step-title">Show up and play</h3>
            <p className="step-desc">Casual, no pressure, open to all levels.</p>
          </div>

        </div>
      </section>

      {/* Section 4: Secondary CTA */}
      <footer className="landing-footer">
        <h2 className="footer-headline">The UAE, but with company.</h2>
        <a href={APP_URL} className="landing-cta" onClick={handleCtaClick}>
          Start exploring
        </a>
        <div className="footer-bottom">
          Nearby — Built for UAE Hackathon
        </div>
      </footer>
    </div>
  );
}
