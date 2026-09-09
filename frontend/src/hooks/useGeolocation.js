/**
 * useGeolocation.js — React hook for geolocation with fallback
 */

import { useState, useEffect } from 'react';
import { DEFAULT_LAT, DEFAULT_LNG } from '../lib/geo.js';

export function useGeolocation() {
  const [position, setPosition] = useState({
    lat: DEFAULT_LAT,
    lng: DEFAULT_LNG,
    error: null,
    loading: true,
    isDefault: true,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setPosition(prev => ({
        ...prev,
        loading: false,
        error: 'Geolocation not supported',
      }));
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          error: null,
          loading: false,
          isDefault: false,
        });
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
        setPosition(prev => ({
          ...prev,
          loading: false,
          error: err.message,
          // Keep default coordinates as fallback
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return position;
}
