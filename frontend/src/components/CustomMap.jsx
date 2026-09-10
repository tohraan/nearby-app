/**
 * CustomMap.jsx — Complete Real-Time UAE Street Map Component
 * Powered by Leaflet & CartoDB Voyager 2D Street Tiles (Google Maps style light theme)
 * Renders real UAE streets, highways, coastlines, building footprints, cached places,
 * group meetup pins, user location ("Locate Me"), zoom controls, and custom popups.
 */

import React, { useState, useEffect, useRef } from 'react';
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

  const [isLegendOpen, setIsLegendOpen] = useState(false);

  // Default initial center: Dubai (Burj Khalifa area)
  const initialLat = userLat || 25.1972;
  const initialLng = userLng || 55.2744;

  // Category color palette — shared vertical tints
  const CATEGORY_PIN_COLORS = {
    cafe:          { fill: '#FDEBD0', text: '#8A5300' },
    food:          { fill: '#FDEBD0', text: '#8A5300' },
    nightlife:     { fill: '#FDEBD0', text: '#8A5300' },
    attraction:    { fill: '#D5F5E3', text: '#1B6635' },
    culture:       { fill: '#D5F5E3', text: '#1B6635' },
    outdoor:       { fill: '#D5F5E3', text: '#1B6635' },
    shopping:      { fill: '#D5F5E3', text: '#1B6635' },
    entertainment: { fill: '#D5F5E3', text: '#1B6635' },
    sports:        { fill: '#FADBD8', text: '#A63A16' },
    meetups:       { fill: '#FADBD8', text: '#A63A16' },
    movies:        { fill: '#D6EAF8', text: '#1D4ED8' },
    outing:        { fill: '#EBDEF0', text: '#6B21A8' },
    other:         { fill: '#E5E7EB', text: '#1F2937' },
  };

  // Build a solid teardrop/circle pin HTML for a single place
  const buildPinHtml = (category, isSelected, isGroup) => {
    const colors = isGroup
      ? { fill: '#FF2E93', text: '#FFFFFF' }
      : (CATEGORY_PIN_COLORS[category] || CATEGORY_PIN_COLORS.other);
    const size = isSelected ? 34 : 26;
    const border = isSelected ? '3px solid #FFFFFF' : '2px solid #1C1A17';
    const shadow = isSelected
      ? '0 0 0 2px #1C1A17, 3px 3px 0 #1C1A17'
      : '2px 2px 0 #1C1A17';
    // Teardrop shape: circle with a bottom-point
    return `
      <div style="
        position:relative;
        width:${size}px;
        height:${size}px;
        background-color:${colors.fill};
        border:${border};
        border-radius:50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow:${shadow};
        cursor:pointer;
      "></div>
    `;
  };

  // Build a cluster bubble HTML
  const buildClusterHtml = (count, dominantCategory) => {
    const colors = CATEGORY_PIN_COLORS[dominantCategory] || CATEGORY_PIN_COLORS.other;
    return `
      <div style="
        width:38px; height:38px;
        background-color:${colors.fill};
        border:2.5px solid #1C1A17;
        border-radius:50%;
        display:flex; align-items:center; justify-content:center;
        font-size:13px; font-weight:800;
        color:${colors.text};
        box-shadow:3px 3px 0 #1C1A17;
        cursor:pointer;
      ">${count}</div>
    `;
  };

  // Grid-based lightweight clustering: rounds lat/lng to cluster grid
  const clusterItems = (items, zoom) => {
    if (zoom >= 14) return items.map(item => ({ ...item, _isCluster: false, _clusterItems: [item] }));
    const precision = zoom >= 12 ? 2 : 1; // 2 decimal ≈ 1.1km, 1 decimal ≈ 11km
    const grid = {};
    items.forEach(item => {
      const key = `${item.lat.toFixed(precision)},${item.lng.toFixed(precision)}`;
      if (!grid[key]) grid[key] = [];
      grid[key].push(item);
    });
    return Object.values(grid).map(group => {
      if (group.length === 1) return { ...group[0], _isCluster: false, _clusterItems: group };
      const avgLat = group.reduce((s, i) => s + i.lat, 0) / group.length;
      const avgLng = group.reduce((s, i) => s + i.lng, 0) / group.length;
      const dominant = group[0]; // use first item's category for color
      return {
        ...dominant,
        lat: avgLat,
        lng: avgLng,
        _isCluster: true,
        _clusterCount: group.length,
        _clusterItems: group,
      };
    });
  };

  // Initialize Leaflet Map Instance
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [initialLat, initialLng],
      zoom: 13,
      zoomControl: false,
      attributionControl: false,
    });

    // Clean street map basemap (OpenStreetMap default, or configurable via VITE_MAP_TILE_URL / VITE_MAP_API_KEY)
    const apiKey = import.meta.env.VITE_MAP_API_KEY;
    const tileUrl = import.meta.env.VITE_MAP_TILE_URL || (
      apiKey
        ? `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png?api_key=${apiKey}`
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
    );

    L.tileLayer(tileUrl, {
      maxZoom: 19,
      subdomains: 'abc',
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;
    mapInstanceRef.current = map;

    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
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

  // Update user location marker
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
          <div style="position: absolute; width: 24px; height: 24px; border-radius: 50%; background: rgba(0, 122, 255, 0.3); animation: pulseRing 1.8s infinite;"></div>
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

    const allItems = [
      ...places.map(p => ({ ...p, isGroup: false })),
      ...groups.filter(g => g.lat && g.lng).map(g => ({ ...g, isGroup: true })),
    ].filter(item => item.lat && item.lng);

    // Apply clustering at current zoom level
    const currentZoom = map.getZoom();
    const clustered = clusterItems(allItems, currentZoom);

    clustered.forEach(item => {
      const isSelected = !item._isCluster && selectedPlaceId === item.id;

      let iconHtml, iconSize, iconAnchor;

      if (item._isCluster) {
        // Render count bubble
        iconHtml = buildClusterHtml(item._clusterCount, item.category);
        iconSize = [38, 38];
        iconAnchor = [19, 19];
      } else {
        // Render teardrop pin — rotated square = diamond/teardrop shape
        iconHtml = buildPinHtml(item.category, isSelected, item.isGroup);
        const pinSize = isSelected ? 34 : 26;
        iconSize = [pinSize, pinSize];
        iconAnchor = [pinSize / 2, pinSize]; // anchor at bottom tip
      }

      const customIcon = L.divIcon({
        className: 'custom-neo-marker',
        html: iconHtml,
        iconSize,
        iconAnchor,
      });

      const marker = L.marker([item.lat, item.lng], {
        icon: customIcon,
        zIndexOffset: isSelected ? 800 : 100,
      });

      if (item._isCluster) {
        // Clicking a cluster zooms in to reveal individual pins
        marker.on('click', () => {
          map.flyTo([item.lat, item.lng], Math.min(currentZoom + 2, 16), { duration: 0.7 });
        });
      } else {
        // Single place popup
        marker.bindPopup(`
          <div style="font-family: inherit; padding: 4px; min-width: 140px;">
            <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #666;">${CATEGORY_EMOJI[item.category] || '📍'} ${item.category || 'spot'}</div>
            <div style="font-family: var(--font-serif); font-size: 15px; font-weight: 700; margin: 2px 0; color: #1C1A17;">${item.name}</div>
            ${item.rating ? `<div style="font-size: 12px; font-weight: 600; color: #1C1A17;">⭐ ${item.rating} / 5.0</div>` : ''}
          </div>
        `, { offset: [0, -16] });

        marker.on('click', () => {
          map.flyTo([item.lat, item.lng], Math.max(map.getZoom(), 15), { duration: 0.8 });
          onSelectPlace?.(item.id);
        });
      }

      layer.addLayer(marker);
    });

    // Re-cluster when zoom changes
    const onZoomEnd = () => {
      layer.clearLayers();
      const newZoom = map.getZoom();
      const reClustered = clusterItems(allItems, newZoom);
      reClustered.forEach(item => {
        const isItemSelected = !item._isCluster && selectedPlaceId === item.id;
        let html, size, anchor;
        if (item._isCluster) {
          html = buildClusterHtml(item._clusterCount, item.category);
          size = [38, 38]; anchor = [19, 19];
        } else {
          html = buildPinHtml(item.category, isItemSelected, item.isGroup);
          const ps = isItemSelected ? 34 : 26;
          size = [ps, ps]; anchor = [ps / 2, ps];
        }
        const icon = L.divIcon({ className: 'custom-neo-marker', html, iconSize: size, iconAnchor: anchor });
        const m = L.marker([item.lat, item.lng], { icon, zIndexOffset: isItemSelected ? 800 : 100 });
        if (item._isCluster) {
          m.on('click', () => map.flyTo([item.lat, item.lng], Math.min(newZoom + 2, 16), { duration: 0.7 }));
        } else {
          m.bindPopup(`
            <div style="font-family: inherit; padding: 4px; min-width: 140px;">
              <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #666;">${CATEGORY_EMOJI[item.category] || '📍'} ${item.category || 'spot'}</div>
              <div style="font-size: 15px; font-weight: 700; margin: 2px 0; color: #1C1A17;">${item.name}</div>
              ${item.rating ? `<div style="font-size: 12px; font-weight: 600; color: #1C1A17;">⭐ ${item.rating} / 5.0</div>` : ''}
            </div>
          `, { offset: [0, -16] });
          m.on('click', () => {
            map.flyTo([item.lat, item.lng], Math.max(map.getZoom(), 15), { duration: 0.8 });
            onSelectPlace?.(item.id);
          });
        }
        layer.addLayer(m);
      });
    };

    map.on('zoomend', onZoomEnd);
    return () => { map.off('zoomend', onZoomEnd); };
  }, [places, groups, selectedPlaceId, visitedIds, onSelectPlace]);

  // Smooth fly to selected place
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedPlaceId) return;

    const target = places.find(p => p.id === selectedPlaceId) || groups.find(g => g.id === selectedPlaceId);
    if (target && target.lat && target.lng) {
      map.flyTo([target.lat, target.lng], 16, { duration: 1.0 });
    }
  }, [selectedPlaceId, places, groups]);

  const handleLocateMe = () => {
    const map = mapInstanceRef.current;
    if (map && userLat && userLng) {
      map.flyTo([userLat, userLng], 15, { duration: 1.0 });
    }
  };

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

      {/* ─── Collapsible Map Legend Overlay (Bottom Left) ─── */}
      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          left: '16px',
          zIndex: 500,
          backgroundColor: 'var(--color-paper)',
          border: '2px solid var(--color-black)',
          borderRadius: '10px',
          padding: isLegendOpen ? '10px 14px' : '6px 12px',
          boxShadow: '3px 3px 0 var(--color-black)',
          fontSize: '11px',
          fontWeight: 700,
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          transition: 'all 0.2s ease'
        }}
      >
        <button
          onClick={() => setIsLegendOpen(!isLegendOpen)}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justify: 'space-between',
            gap: '8px',
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--text-primary)'
          }}
        >
          <span>🗺️ Map Legend</span>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{isLegendOpen ? '▲' : '▼'}</span>
        </button>

        {isLegendOpen && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px', paddingTop: '6px', borderTop: '1px solid var(--border-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '18px', height: '18px', borderRadius: '4px', backgroundColor: '#E8D5C4', border: '1.5px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}>☕</span>
              <span>Cafes & Coffee</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '18px', height: '18px', borderRadius: '4px', backgroundColor: '#FFE8D6', border: '1.5px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}>🍽️</span>
              <span>Food & Dining</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '18px', height: '18px', borderRadius: '4px', backgroundColor: '#FCF3CF', border: '1.5px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}>⭐</span>
              <span>Attractions</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '18px', height: '18px', borderRadius: '4px', backgroundColor: '#D4EFDF', border: '1.5px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}>🌿</span>
              <span>Outdoors & Parks</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '18px', height: '18px', borderRadius: '4px', backgroundColor: '#F5B7D2', border: '1.5px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}>🎉</span>
              <span>Group Meetups</span>
            </div>
          </div>
        )}
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
