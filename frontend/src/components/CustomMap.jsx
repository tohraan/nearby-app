/**
 * CustomMap.jsx — Complete Real-Time UAE Street Map Component
 * Powered by Leaflet & CartoDB Voyager 2D Street Tiles (Google Maps style light theme)
 * Renders real UAE streets, highways, coastlines, building footprints, cached places,
 * group meetup pins, user location ("Locate Me"), zoom controls, and custom popups.
 */

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Navigation, Plus, Minus, Compass, Sparkles } from 'lucide-react';
import { CATEGORY_EMOJI, formatDistance } from '../lib/geo.js';

export default function CustomMap({
  places = [],
  groups = [],
  userLat,
  userLng,
  selectedPlaceId,
  onSelectPlace,
  onHostActivity,
  visitedIds = new Set(),
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const userMarkerRef = useRef(null);

  // Default initial center: Dubai (Burj Khalifa area)
  const initialLat = userLat || 25.1972;
  const initialLng = userLng || 55.2744;

  // Initialize Leaflet Map Instance
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Create Leaflet map instance centered on Dubai / UAE
    const map = L.map(mapRef.current, {
      center: [initialLat, initialLng],
      zoom: 13,
      zoomControl: false, // We render custom Neo-Brutalist controls
      attributionControl: false,
    });

    // Map API key from environment variables (Google Maps or Mapbox key)
    const mapApiKey =
      (typeof import.meta !== 'undefined' && import.meta.env && (
        import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
        import.meta.env.VITE_MAP_API_KEY ||
        import.meta.env.VITE_MAPBOX_TOKEN
      )) || '';

    let tileUrl = 'https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
    let tileOptions = {
      maxZoom: 19,
      subdomains: ['0', '1', '2', '3'],
      attribution: '&copy; <a href="https://maps.google.com" target="_blank" rel="noreferrer">Google Maps</a>',
    };

    if (mapApiKey) {
      if (mapApiKey.startsWith('pk.')) {
        tileUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/256/{z}/{x}/{y}?access_token=${mapApiKey}`;
        tileOptions = {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.mapbox.com/" target="_blank" rel="noreferrer">Mapbox</a>',
        };
      } else {
        tileUrl = `https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&key=${mapApiKey}`;
      }
    }

    // High-Resolution UAE Google Maps Street Tile Layer
    const tileLayer = L.tileLayer(tileUrl, tileOptions);
    tileLayer.addTo(map);

    // Create markers layer group
    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;

    mapInstanceRef.current = map;

    // Resize observer to ensure full container responsiveness
    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });
    resizeObserver.observe(mapRef.current);

    return () => {
      resizeObserver.disconnect();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update user location marker & accuracy circle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !userLat || !userLng) return;

    if (userMarkerRef.current) {
      map.removeLayer(userMarkerRef.current);
    }

    const userIcon = L.divIcon({
      className: 'custom-user-marker',
      html: `
        <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 24px; height: 24px; border-radius: 50%; background: rgba(0, 149, 255, 0.35); animation: pulseRing 1.8s infinite;"></div>
          <div style="width: 14px; height: 14px; border-radius: 50%; background: #007AFF; border: 2.5px solid #FFFFFF; box-shadow: 0 2px 6px rgba(0,0,0,0.4);"></div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    const marker = L.marker([userLat, userLng], { icon: userIcon, zIndexOffset: 1000 }).addTo(map);
    userMarkerRef.current = marker;
  }, [userLat, userLng]);

  // Update cached places and group activity markers on map
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    // Combine places and group activities into a unified array
    const allItems = [
      ...places.map(p => ({ ...p, isGroup: false })),
      ...groups.filter(g => g.lat && g.lng).map(g => ({ ...g, isGroup: true })),
    ];

    allItems.forEach(item => {
      if (!item.lat || !item.lng) return;

      const isVisited = visitedIds.has(item.id);
      const isSelected = selectedPlaceId === item.id;
      
      // Determine Pin Type & Styling based on legend categories
      let pinEmoji = '📍';
      let pinBg = 'var(--color-yellow)';

      if (item.isGroup) {
        pinEmoji = '🎉';
        pinBg = 'var(--color-pink)';
      } else if (item.category === 'cafe' || item.category === 'food' || item.category === 'nightlife') {
        pinEmoji = item.category === 'cafe' ? '☕' : '🌮';
        pinBg = 'var(--color-yellow)';
      } else if (item.category === 'attraction' || item.category === 'culture' || item.category === 'shopping') {
        pinEmoji = item.category === 'culture' ? '🏛️' : '⭐';
        pinBg = 'var(--color-mint)';
      } else if (item.category === 'outdoor' || item.category === 'sports') {
        pinEmoji = '🏖️';
        pinBg = 'var(--color-sky)';
      }

      const customIcon = L.divIcon({
        className: 'custom-neo-marker',
        html: `
          <div style="
            position: relative;
            background-color: ${pinBg};
            border: ${isSelected ? '3px' : '2.5px'} solid #000000;
            border-radius: ${item.isGroup ? '50%' : '12px 12px 12px 0'};
            width: ${isSelected ? '44px' : '36px'};
            height: ${isSelected ? '44px' : '36px'};
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: ${isSelected ? '22px' : '18px'};
            box-shadow: ${isSelected ? '5px 5px 0 #000000' : '3px 3px 0 #000000'};
            cursor: pointer;
            transform: scale(${isSelected ? '1.2' : '1'});
            transition: transform 0.2s ease;
          ">
            <span>${pinEmoji}</span>
            ${item.isGroup ? '<div style="position: absolute; inset: -4px; border-radius: 50%; border: 2px solid #FF2E93; animation: pulseRing 1.8s infinite;"></div>' : ''}
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
      });

      const marker = L.marker([item.lat, item.lng], {
        icon: customIcon,
        zIndexOffset: isSelected ? 800 : 100,
      });

      marker.bindPopup(`
        <div style="font-family: inherit; padding: 4px; min-width: 140px;">
          <div style="font-size: 10px; font-weight: 900; text-transform: uppercase; color: #555;">${CATEGORY_EMOJI[item.category] || '📍'} ${item.category || 'spot'}</div>
          <div style="font-size: 14px; font-weight: 900; margin: 2px 0; color: #000;">${item.name}</div>
          ${item.rating ? `<div style="font-size: 12px; font-weight: 800; color: #000;">⭐ ${item.rating} / 5.0</div>` : ''}
        </div>
      `, { offset: [0, -32] });

      marker.on('click', () => {
        map.flyTo([item.lat, item.lng], Math.max(map.getZoom(), 15), { duration: 0.8 });
        onSelectPlace?.(item.id);
      });

      layer.addLayer(marker);
    });
  }, [places, groups, selectedPlaceId, visitedIds, onSelectPlace]);

  // Smooth fly to selected place when selected from list
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedPlaceId) return;

    const target = places.find(p => p.id === selectedPlaceId) || groups.find(g => g.id === selectedPlaceId);
    if (target && target.lat && target.lng) {
      map.flyTo([target.lat, target.lng], 16, { duration: 1.0 });
    }
  }, [selectedPlaceId, places, groups]);

  // Locate Me Action: center directly on user location
  const handleLocateMe = () => {
    const map = mapInstanceRef.current;
    if (map && userLat && userLng) {
      map.flyTo([userLat, userLng], 15, { duration: 1.0 });
    }
  };

  // Zoom controls
  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn(1);
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut(1);
  };

  const handleResetView = () => {
    mapInstanceRef.current?.flyTo([initialLat, initialLng], 13, { duration: 1.0 });
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '380px',
        backgroundColor: '#F5F5F3',
        overflow: 'hidden',
      }}
    >
      {/* ─── Leaflet Real-Time UAE Map Element ─── */}
      <div ref={mapRef} style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }} />

      {/* ─── Map Legend Overlay (Bottom Left) ─── */}
      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          left: '16px',
          zIndex: 500,
          backgroundColor: 'var(--color-paper)',
          border: '2.5px solid var(--color-black)',
          borderRadius: '12px',
          padding: '10px 14px',
          boxShadow: '4px 4px 0 var(--color-black)',
          fontSize: '11px',
          fontWeight: 900,
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}
      >
        <div style={{ textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '2px', fontSize: '10px' }}>
          🗺️ MAP LEGEND
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--color-yellow)', border: '2px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>☕</span>
          <span>Cafes & Dining</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--color-mint)', border: '2px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>⭐</span>
          <span>Attractions & Culture</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--color-sky)', border: '2px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>🏖️</span>
          <span>Beaches & Outdoors</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--color-pink)', border: '2px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>🎉</span>
          <span>Custom Party Pins</span>
        </div>
      </div>

      {/* ─── Top Center Host Activity Button ─── */}
      <button
        className="neo-btn neo-btn--primary"
        onClick={onHostActivity}
        style={{
          position: 'absolute',
          top: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 500,
          fontWeight: 900,
          boxShadow: '3.5px 3.5px 0 #000000',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '12px',
          padding: '8px 16px',
          backgroundColor: 'var(--color-yellow)',
          color: 'var(--color-black)'
        }}
      >
        <Sparkles size={14} fill="var(--color-black)" /> + HOST MEETUP
      </button>

      {/* ─── Top Right Custom Controls (Zoom, Compass, Locate Me) ─── */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          zIndex: 500,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {/* Compass / Reset View Button */}
        <button
          className="neo-btn neo-btn--icon"
          onClick={handleResetView}
          title="Reset View to Dubai"
          style={{
            width: '40px',
            height: '40px',
            padding: 0,
            borderRadius: '50%',
            backgroundColor: 'var(--color-cream)',
            border: '2px solid var(--color-black)',
            boxShadow: '2.5px 2.5px 0 var(--color-black)',
            display: 'flex',
            alignItems: 'center',
            justify: 'center'
          }}
        >
          <Compass size={18} color="var(--color-black)" />
        </button>

        {/* Zoom In */}
        <button
          className="neo-btn neo-btn--icon"
          onClick={handleZoomIn}
          title="Zoom In"
          style={{
            width: '40px',
            height: '40px',
            padding: 0,
            borderRadius: '8px',
            backgroundColor: 'var(--color-cream)',
            border: '2px solid var(--color-black)',
            boxShadow: '2.5px 2.5px 0 var(--color-black)',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justify: 'center'
          }}
        >
          <Plus size={18} />
        </button>

        {/* Zoom Out */}
        <button
          className="neo-btn neo-btn--icon"
          onClick={handleZoomOut}
          title="Zoom Out"
          style={{
            width: '40px',
            height: '40px',
            padding: 0,
            borderRadius: '8px',
            backgroundColor: 'var(--color-cream)',
            border: '2px solid var(--color-black)',
            boxShadow: '2.5px 2.5px 0 var(--color-black)',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justify: 'center'
          }}
        >
          <Minus size={18} />
        </button>

        {/* Locate Me Action Button */}
        <button
          className="neo-btn neo-btn--icon"
          onClick={handleLocateMe}
          title="Locate Me"
          style={{
            width: '46px',
            height: '46px',
            padding: 0,
            borderRadius: '50%',
            backgroundColor: 'var(--color-blue)',
            border: '2.5px solid var(--color-black)',
            boxShadow: '3.5px 3.5px 0 var(--color-black)',
            marginTop: '4px',
            display: 'flex',
            alignItems: 'center',
            justify: 'center'
          }}
        >
          <Navigation size={20} color="var(--color-black)" style={{ transform: 'rotate(45deg)' }} />
        </button>
      </div>

      {/* Pulse Animation Style */}
      <style>{`
        @keyframes pulseRing {
          0% { transform: scale(0.8); opacity: 0.9; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        .custom-neo-marker {
          background: none !important;
          border: none !important;
        }
        .leaflet-div-icon {
          background: none !important;
          border: none !important;
        }
      `}</style>
    </div>
  );
}
