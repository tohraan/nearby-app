import React from 'react';
import MovingVehicle from './MovingVehicle';
import DriftingCloud from './DriftingCloud';
import FlyingPlane from './FlyingPlane';

export default function HeroAmbientScene() {
  return (
    <div className="ambient-hero-overlay" aria-hidden="true">
      {/* Primary Car - Visible on Desktop & Mobile */}
      <MovingVehicle 
        speed={20} 
        delay={1} 
        bottom="11%" 
        scale={1} 
        opacity={0.3} 
      />

      {/* Secondary Car - Desktop only */}
      <MovingVehicle 
        speed={26} 
        delay={-12} 
        bottom="7%" 
        scale={0.8} 
        opacity={0.22} 
        className="desktop-only-ambient"
      />

      {/* Primary Cloud - Visible on Desktop & Mobile */}
      <DriftingCloud 
        speed={48} 
        delay={0} 
        top="8%" 
        scale={1.2} 
        opacity={0.18} 
      />

      {/* Secondary Cloud - Desktop only */}
      <DriftingCloud 
        speed={60} 
        delay={-20} 
        top="18%" 
        scale={0.9} 
        opacity={0.12} 
        className="desktop-only-ambient"
      />

      {/* Infrequent Plane - Desktop only */}
      <FlyingPlane 
        speed={52} 
        delay={8} 
        top="14%" 
        scale={0.85} 
        opacity={0.2} 
        className="desktop-only-ambient"
      />
    </div>
  );
}
