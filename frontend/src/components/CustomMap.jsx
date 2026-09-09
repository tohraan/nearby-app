import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { MapPin, Navigation, Plus, Minus, Compass, Star, Check, Sparkles } from 'lucide-react';
import { CATEGORY_EMOJI, formatDistance, haversineKm } from '../lib/geo.js';

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
  // Center map on user or default location
  const [center, setCenter] = useState({ lat: userLat || 25.2048, lng: userLng || 55.2708 });
  const [zoom, setZoom] = useState(14.5); // Zoom factor: 11 to 18
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredItem, setHoveredItem] = useState(null);

  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Handle window resizing for full responsiveness
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Update center when user location is obtained
  useEffect(() => {
    if (userLat && userLng) {
      setCenter({ lat: userLat, lng: userLng });
    }
  }, [userLat, userLng]);

  // Fly/Pan map to selected place when user taps a place from list or map
  useEffect(() => {
    if (selectedPlaceId) {
      const target = places.find(p => p.id === selectedPlaceId) || groups.find(g => g.id === selectedPlaceId);
      if (target && target.lat && target.lng) {
        setCenter({ lat: target.lat, lng: target.lng });
        setPanOffset({ x: 0, y: 0 });
      }
    }
  }, [selectedPlaceId, places, groups]);

  // Locate Me Action: reset pan offset and center directly on user position
  const handleLocateMe = () => {
    if (userLat && userLng) {
      setCenter({ lat: userLat, lng: userLng });
      setPanOffset({ x: 0, y: 0 });
      setZoom(15);
    }
  };

  // Convert (lat, lng) geographic coordinates to container pixel (x, y)
  const latLngToPixel = useCallback((lat, lng) => {
    const cosLat = Math.cos((center.lat * Math.PI) / 180);
    const metersPerDegreeLat = 111320;
    const metersPerDegreeLng = 111320 * cosLat;

    // Zoom scale factor (pixels per meter)
    const scale = Math.pow(1.85, zoom - 12) * 0.12;

    const dx = (lng - center.lng) * metersPerDegreeLng * scale + panOffset.x;
    const dy = (center.lat - lat) * metersPerDegreeLat * scale + panOffset.y;

    const x = dimensions.width / 2 + dx;
    const y = dimensions.height / 2 + dy;

    return { x, y };
  }, [center, zoom, panOffset, dimensions]);

  // Mouse drag handlers
  const handleMouseDown = (e) => {
    if (e.target.closest('.neo-btn') || e.target.closest('.map-marker')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Mouse wheel zoom handler
  const handleWheel = (e) => {
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 0.4 : -0.4;
    setZoom(prev => Math.min(Math.max(prev + zoomDelta, 11), 18));
  };

  // Touch event handlers for mobile devices
  const touchStartRef = useRef({ dist: 0, initialZoom: 14.5 });

  const handleTouchStart = (e) => {
    if (e.target.closest('.neo-btn') || e.target.closest('.map-marker')) return;
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX - panOffset.x, y: e.touches[0].clientY - panOffset.y });
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartRef.current = { dist, initialZoom: zoom };
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 1 && isDragging) {
      setPanOffset({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      });
    } else if (e.touches.length === 2 && touchStartRef.current.dist > 0) {
      const newDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const scale = newDist / touchStartRef.current.dist;
      const newZoom = Math.min(Math.max(touchStartRef.current.initialZoom + (scale - 1) * 3, 11), 18);
      setZoom(newZoom);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    touchStartRef.current.dist = 0;
  };

  // Calculate user pixel location
  const userPixel = useMemo(() => {
    if (!userLat || !userLng) return null;
    return latLngToPixel(userLat, userLng);
  }, [userLat, userLng, latLngToPixel]);

  // Combine places and group activities into a unified list
  const allItems = useMemo(() => {
    const pList = places.map(p => ({ ...p, isGroup: false }));
    const gList = groups.filter(g => g.lat && g.lng).map(g => ({ ...g, isGroup: true }));
    return [...pList, ...gList];
  }, [places, groups]);

  // Dynamic spatial clustering & viewport filtering
  const mapElements = useMemo(() => {
    const points = allItems.map(item => ({
      ...item,
      pos: latLngToPixel(item.lat, item.lng)
    })).filter(pt =>
      pt.pos.x >= -60 && pt.pos.x <= dimensions.width + 60 &&
      pt.pos.y >= -60 && pt.pos.y <= dimensions.height + 60
    );

    const clusters = [];
    const visitedIndices = new Set();
    const clusterThreshold = 38; // px

    for (let i = 0; i < points.length; i++) {
      if (visitedIndices.has(i)) continue;
      const groupList = [points[i]];
      visitedIndices.add(i);

      for (let j = i + 1; j < points.length; j++) {
        if (visitedIndices.has(j)) continue;
        const dx = points[i].pos.x - points[j].pos.x;
        const dy = points[i].pos.y - points[j].pos.y;
        if (Math.sqrt(dx * dx + dy * dy) < clusterThreshold) {
          groupList.push(points[j]);
          visitedIndices.add(j);
        }
      }

      if (groupList.length > 1) {
        const avgX = groupList.reduce((sum, p) => sum + p.pos.x, 0) / groupList.length;
        const avgY = groupList.reduce((sum, p) => sum + p.pos.y, 0) / groupList.length;
        const avgLat = groupList.reduce((sum, p) => sum + p.lat, 0) / groupList.length;
        const avgLng = groupList.reduce((sum, p) => sum + p.lng, 0) / groupList.length;

        clusters.push({
          isCluster: true,
          id: `cluster-${i}`,
          count: groupList.length,
          pos: { x: avgX, y: avgY },
          lat: avgLat,
          lng: avgLng,
          items: groupList,
        });
      } else {
        clusters.push({
          isCluster: false,
          ...groupList[0]
        });
      }
    }

    return clusters;
  }, [allItems, latLngToPixel, dimensions]);

  // Scaled Vector District & Feature Coordinates (Relative to Map Center)
  const mapFeatures = useMemo(() => {
    // English District Labels and Stylized Vector Features mapped geographically around center
    const districts = [
      { name: 'DOWNTOWN CENTER', lat: center.lat + 0.008, lng: center.lng - 0.005, type: 'commercial', color: 'var(--color-yellow)' },
      { name: 'ARTS & CULINARY QUARTER', lat: center.lat - 0.006, lng: center.lng - 0.008, type: 'culture', color: 'var(--color-pink)' },
      { name: 'FINANCIAL DISTRICT', lat: center.lat + 0.012, lng: center.lng + 0.006, type: 'business', color: 'var(--color-blue)' },
      { name: 'WATERFRONT PROMENADE', lat: center.lat - 0.010, lng: center.lng + 0.010, type: 'water', color: '#70D6FF' },
      { name: 'CENTRAL PARK TRAILS', lat: center.lat + 0.002, lng: center.lng + 0.012, type: 'park', color: 'var(--color-mint)' },
      { name: 'TECH & INNOVATION HUB', lat: center.lat - 0.014, lng: center.lng - 0.002, type: 'tech', color: '#E0AAFF' },
    ];

    // Roads & Highways vector paths
    const roads = [
      // Main Avenue North-South
      [
        { lat: center.lat + 0.025, lng: center.lng - 0.002 },
        { lat: center.lat - 0.025, lng: center.lng + 0.002 }
      ],
      // Boulevard East-West
      [
        { lat: center.lat + 0.004, lng: center.lng - 0.025 },
        { lat: center.lat - 0.002, lng: center.lng + 0.025 }
      ],
      // Ring Road Diagonal
      [
        { lat: center.lat - 0.015, lng: center.lng - 0.020 },
        { lat: center.lat + 0.015, lng: center.lng + 0.020 }
      ],
    ];

    return { districts, roads };
  }, [center]);

  // Calculate approximate scale distance for UI
  const scaleText = useMemo(() => {
    const p1 = latLngToPixel(center.lat, center.lng);
    const p2 = latLngToPixel(center.lat + 0.005, center.lng);
    const pixelsFor500m = Math.abs(p1.y - p2.y) * (500 / 556);
    if (pixelsFor500m > 150) return '200 m';
    if (pixelsFor500m > 60) return '500 m';
    return '1 km';
  }, [center, latLngToPixel]);

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        backgroundColor: 'var(--color-cream)',
        overflow: 'hidden',
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
      }}
    >
      {/* ─── Vector Canvas & Background Graphics (100% English & Custom) ─── */}
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      >
        <defs>
          {/* Neo-Brutalist Grid Pattern */}
          <pattern id="gridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
            <circle cx="20" cy="20" r="1.5" fill="rgba(0,0,0,0.12)" />
          </pattern>

          {/* Park Polygon Fill Pattern */}
          <pattern id="parkPattern" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="5" cy="5" r="2" fill="var(--color-mint)" opacity="0.3" />
            <circle cx="15" cy="15" r="2" fill="var(--color-mint)" opacity="0.3" />
          </pattern>
        </defs>

        {/* Base Grid Background */}
        <rect width="100%" height="100%" fill="url(#gridPattern)" />

        {/* Render Vector Highways & Major Roads */}
        {mapFeatures.roads.map((road, idx) => {
          const p1 = latLngToPixel(road[0].lat, road[0].lng);
          const p2 = latLngToPixel(road[1].lat, road[1].lng);
          return (
            <g key={`road-${idx}`}>
              {/* Outer Casing Line */}
              <line
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke="var(--color-black)"
                strokeWidth="10"
                strokeLinecap="round"
                opacity="0.85"
              />
              {/* Inner Road Fill */}
              <line
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke="#FFFFFF"
                strokeWidth="6"
                strokeLinecap="round"
              />
              {/* Dashed Centerline */}
              <line
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke="var(--color-yellow)"
                strokeWidth="1.5"
                strokeDasharray="8 6"
                strokeLinecap="round"
              />
            </g>
          );
        })}

        {/* Render Vector District Zones & English Labels */}
        {mapFeatures.districts.map((dist, idx) => {
          const p = latLngToPixel(dist.lat, dist.lng);
          // Only render visible labels
          if (p.x < -100 || p.x > dimensions.width + 100 || p.y < -100 || p.y > dimensions.height + 100) {
            return null;
          }

          return (
            <g key={`district-${idx}`} transform={`translate(${p.x}, ${p.y})`}>
              {/* Vector Zone Background Box */}
              <rect
                x="-70"
                y="-25"
                width="140"
                height="50"
                rx="12"
                fill={dist.color}
                opacity="0.25"
                stroke="var(--color-black)"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
              {/* English District Badge */}
              <text
                x="0"
                y="4"
                textAnchor="middle"
                fill="var(--color-black)"
                fontSize="10"
                fontWeight="900"
                letterSpacing="1.2"
                style={{ textTransform: 'uppercase', fontFamily: 'sans-serif' }}
              >
                {dist.name}
              </text>
            </g>
          );
        })}
      </svg>

      {/* ─── Map Coordinates & English Scale Footer (Bottom Left) ─── */}
      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          left: '16px',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          pointerEvents: 'none',
        }}
      >
        <div
          className="neo-card"
          style={{
            padding: '4px 10px',
            fontSize: '11px',
            fontWeight: 800,
            backgroundColor: 'var(--color-cream)',
            border: '2px solid var(--color-black)',
            boxShadow: '2px 2px 0 var(--color-black)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span style={{ display: 'inline-block', width: '20px', height: '2px', backgroundColor: 'var(--color-black)' }} />
          <span>{scaleText}</span>
        </div>

        <div
          className="neo-card"
          style={{
            padding: '4px 10px',
            fontSize: '11px',
            fontWeight: 800,
            backgroundColor: 'var(--color-yellow)',
            border: '2px solid var(--color-black)',
            boxShadow: '2px 2px 0 var(--color-black)',
          }}
        >
          {center.lat.toFixed(4)}° N, {center.lng.toFixed(4)}° E
        </div>
      </div>

      {/* ─── Top Right Controls (Zoom, Compass, Locate Me) ─── */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          zIndex: 200,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        {/* Compass Button */}
        <button
          className="neo-btn neo-btn--icon"
          onClick={() => setPanOffset({ x: 0, y: 0 })}
          title="Reset View"
          style={{
            width: '42px',
            height: '42px',
            padding: 0,
            borderRadius: '50%',
            backgroundColor: 'var(--color-cream)',
          }}
        >
          <Compass size={20} color="var(--color-black)" />
        </button>

        {/* Zoom In Button */}
        <button
          className="neo-btn neo-btn--icon"
          onClick={() => setZoom(prev => Math.min(prev + 0.8, 18))}
          title="Zoom In"
          style={{
            width: '42px',
            height: '42px',
            padding: 0,
            borderRadius: '10px',
            backgroundColor: 'var(--color-cream)',
            fontWeight: 'bold',
            fontSize: '18px',
          }}
        >
          <Plus size={20} />
        </button>

        {/* Zoom Out Button */}
        <button
          className="neo-btn neo-btn--icon"
          onClick={() => setZoom(prev => Math.max(prev - 0.8, 11))}
          title="Zoom Out"
          style={{
            width: '42px',
            height: '42px',
            padding: 0,
            borderRadius: '10px',
            backgroundColor: 'var(--color-cream)',
            fontWeight: 'bold',
            fontSize: '18px',
          }}
        >
          <Minus size={20} />
        </button>

        {/* Locate Me Action Button */}
        <button
          className="neo-btn neo-btn--icon"
          onClick={handleLocateMe}
          title="Locate Me"
          style={{
            width: '48px',
            height: '48px',
            padding: 0,
            borderRadius: '50%',
            backgroundColor: 'var(--color-blue)',
            boxShadow: '3px 3px 0 var(--color-black)',
            marginTop: '4px',
          }}
        >
          <Navigation size={22} color="var(--color-black)" style={{ transform: 'rotate(45deg)' }} />
        </button>
      </div>

      {/* ─── Top Center Host Activity Button ─── */}
      <button
        className="neo-btn neo-btn--primary"
        style={{
          position: 'absolute',
          top: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 200,
          padding: '10px 20px',
          boxShadow: '4px 4px 0px var(--color-black)',
          fontWeight: 900,
          letterSpacing: '0.03em',
        }}
        onClick={onHostActivity}
      >
        <Sparkles size={16} style={{ display: 'inline', marginRight: '6px' }} />
        HOST ACTIVITY
      </button>

      {/* ─── User Location Pulsing Marker ─── */}
      {userPixel && (
        <div
          style={{
            position: 'absolute',
            left: `${userPixel.x}px`,
            top: `${userPixel.y}px`,
            transform: 'translate(-50%, -50%)',
            zIndex: 100,
            pointerEvents: 'none',
          }}
        >
          {/* Radar Ripple Animation */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '54px',
              height: '54px',
              transform: 'translate(-50%, -50%)',
              borderRadius: '50%',
              backgroundColor: 'var(--color-blue)',
              opacity: 0.35,
              animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
            }}
          />
          {/* User Core Avatar Dot */}
          <div
            style={{
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-blue)',
              border: '3px solid var(--color-black)',
              boxShadow: '0 0 10px rgba(0, 240, 255, 0.8), 2px 2px 0 var(--color-black)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-black)',
              }}
            />
          </div>
          {/* English Tag */}
          <div
            style={{
              position: 'absolute',
              top: '26px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'var(--color-black)',
              color: 'var(--color-cream)',
              fontSize: '10px',
              fontWeight: 800,
              padding: '2px 6px',
              borderRadius: '4px',
              whiteSpace: 'nowrap',
              border: '1px solid var(--color-cream)',
            }}
          >
            YOU ARE HERE
          </div>
        </div>
      )}

      {/* ─── Interactive Markers & Clusters Rendering ─── */}
      {mapElements.map(item => {
        // Handle Cluster Markers
        if (item.isCluster) {
          return (
            <div
              key={item.id}
              className="map-marker"
              onClick={(e) => {
                e.stopPropagation();
                setCenter({ lat: item.lat, lng: item.lng });
                setZoom(prev => Math.min(prev + 1.5, 18));
              }}
              style={{
                position: 'absolute',
                left: `${item.pos.x}px`,
                top: `${item.pos.y}px`,
                transform: 'translate(-50%, -50%)',
                zIndex: 80,
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  backgroundColor: 'var(--color-black)',
                  color: 'var(--color-cream)',
                  borderRadius: '50%',
                  width: '38px',
                  height: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '14px',
                  border: '3px solid var(--color-cream)',
                  boxShadow: '3px 3px 0 var(--color-black)',
                  transition: 'transform 0.15s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                {item.count}
              </div>
            </div>
          );
        }

        // Handle Individual Item Markers (Places & Activities)
        const isVisited = visitedIds.has(item.id);
        const isActive = selectedPlaceId === item.id;
        const emoji = CATEGORY_EMOJI[item.category] || '📍';
        const bgColor = item.isGroup
          ? 'var(--color-pink)'
          : (isActive ? 'var(--color-mint)' : 'var(--color-yellow)');

        return (
          <div
            key={item.id}
            className="map-marker"
            onClick={(e) => {
              e.stopPropagation();
              onSelectPlace(item.id);
            }}
            onMouseEnter={() => setHoveredItem(item)}
            onMouseLeave={() => setHoveredItem(null)}
            style={{
              position: 'absolute',
              left: `${item.pos.x}px`,
              top: `${item.pos.y}px`,
              zIndex: isActive ? 150 : 90,
              cursor: 'pointer',
              transform: `translate(-50%, ${item.isGroup ? '-50%' : '-100%'}) scale(${isActive ? 1.3 : 1})`,
              transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            }}
          >
            {/* Trail / Visited Checkmark Marker */}
            {isVisited ? (
              <div
                style={{
                  backgroundColor: 'var(--color-mint)',
                  border: '3px solid var(--color-black)',
                  borderRadius: '12px',
                  padding: '4px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: 900,
                  fontSize: '12px',
                  boxShadow: '3px 3px 0 var(--color-black)',
                }}
              >
                <Check size={14} strokeWidth={3} />
                <span>{emoji}</span>
              </div>
            ) : (
              /* Custom Neo-Brutalist Map Pin */
              <div
                style={{
                  backgroundColor: bgColor,
                  border: `${isActive ? '3px' : '2.5px'} solid var(--color-black)`,
                  borderRadius: item.isGroup ? '50%' : '14px 14px 14px 0',
                  width: item.isGroup ? '42px' : '40px',
                  height: item.isGroup ? '42px' : '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                  boxShadow: isActive ? '5px 5px 0px var(--color-black)' : '3px 3px 0px var(--color-black)',
                  position: 'relative',
                }}
              >
                {emoji}
                {/* Activity Pulse Indicator */}
                {item.isGroup && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '-2px',
                      right: '-2px',
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-yellow)',
                      border: '2px solid var(--color-black)',
                    }}
                  />
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* ─── Hover English Tooltip Card ─── */}
      {hoveredItem && !selectedPlaceId && (
        <div
          style={{
            position: 'absolute',
            left: `${hoveredItem.pos.x}px`,
            top: `${hoveredItem.pos.y - 50}px`,
            transform: 'translate(-50%, -100%)',
            zIndex: 300,
            pointerEvents: 'none',
            backgroundColor: 'var(--color-black)',
            color: 'var(--color-cream)',
            padding: '6px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 800,
            border: '2px solid var(--color-cream)',
            boxShadow: '3px 3px 0 var(--color-black)',
            whiteSpace: 'nowrap',
          }}
        >
          <span>{CATEGORY_EMOJI[hoveredItem.category]} {hoveredItem.name}</span>
          {hoveredItem.rating && <span style={{ marginLeft: '6px', color: 'var(--color-yellow)' }}>★ {hoveredItem.rating}</span>}
        </div>
      )}
    </div>
  );
}
