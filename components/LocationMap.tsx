'use client';

import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    naver: typeof naver;
  }
}

declare namespace naver {
  namespace maps {
    class Map {
      constructor(element: HTMLElement, options: MapOptions);
      setCenter(latlng: LatLng): void;
      setZoom(level: number): void;
      getCenter(): LatLng;
      panTo(latlng: LatLng, options?: object): void;
    }

    class LatLng {
      constructor(lat: number, lng: number);
      lat(): number;
      lng(): number;
    }

    class Marker {
      constructor(options: MarkerOptions);
      setMap(map: Map | null): void;
      setPosition(latlng: LatLng): void;
      setIcon(icon: ImageIcon): void;
      getPosition(): LatLng;
    }

    class InfoWindow {
      constructor(options: InfoWindowOptions);
      open(map: Map, marker: Marker): void;
      close(): void;
      setContent(content: string): void;
    }

    interface MapOptions {
      center: LatLng;
      zoom: number;
      minZoom?: number;
      maxZoom?: number;
    }

    interface MarkerOptions {
      position: LatLng;
      map?: Map;
      icon?: ImageIcon;
      title?: string;
    }

    interface ImageIcon {
      url?: string;
      size?: Size;
      scaledSize?: Size;
      anchor?: Point;
      content?: string;
    }

    interface InfoWindowOptions {
      content: string;
      maxWidth?: number;
      backgroundColor?: string;
      borderColor?: string;
      borderWidth?: number;
      anchorSize?: Size;
      anchorSkew?: boolean;
    }

    class Size {
      constructor(width: number, height: number);
    }

    class Point {
      constructor(x: number, y: number);
    }

    namespace Event {
      function addListener(
        target: object,
        eventName: string,
        handler: (...args: unknown[]) => void,
      ): void;
    }
  }
}

export type WardLocation = {
  wardId: string;
  wardName: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  lastUpdated: string;
  status: 'normal' | 'warning' | 'emergency';
  organizationId: string | null;
};

type Props = {
  locations: WardLocation[];
  onWardClick?: (wardId: string) => void;
  selectedWardId?: string;
};

const STATUS_COLORS: Record<string, string> = {
  normal: '#22c55e',
  warning: '#f59e0b',
  emergency: '#ef4444',
};

const STATUS_LABELS: Record<string, string> = {
  normal: '정상',
  warning: '주의',
  emergency: '비상',
};

export function LocationMap({ locations, onWardClick, selectedWardId }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<naver.maps.Map | null>(null);
  const markersRef = useRef<Map<string, naver.maps.Marker>>(new Map());
  const infoWindowRef = useRef<naver.maps.InfoWindow | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize map
  useEffect(() => {
    const initMap = () => {
      if (!mapRef.current || !window.naver?.maps) return;

      const defaultCenter = new window.naver.maps.LatLng(37.5665, 126.978);
      const map = new window.naver.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: 12,
        minZoom: 7,
        maxZoom: 19,
      });

      mapInstanceRef.current = map;
      infoWindowRef.current = new window.naver.maps.InfoWindow({
        content: '',
        maxWidth: 300,
        backgroundColor: '#ffffff',
        borderColor: '#E9F0DF',
        borderWidth: 1,
        anchorSkew: true,
      });

      setIsMapReady(true);
    };

    // Check if Naver Maps is already loaded
    if (window.naver?.maps) {
      initMap();
      return;
    }

    // Load Naver Maps script
    const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;
    if (!clientId) {
      setError('Naver Map API 키가 설정되지 않았습니다.');
      return;
    }

    const script = document.createElement('script');
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}`;
    script.async = true;
    script.onload = () => initMap();
    script.onerror = () => setError('Naver Map 스크립트 로드 실패');
    document.head.appendChild(script);

    return () => {
      // Cleanup markers
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current.clear();
    };
  }, []);

  // Update markers when locations change
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current) return;

    const map = mapInstanceRef.current;
    const currentMarkerIds = new Set(markersRef.current.keys());
    const newLocationIds = new Set(locations.map(loc => loc.wardId));

    // Remove markers that are no longer in locations
    currentMarkerIds.forEach(id => {
      if (!newLocationIds.has(id)) {
        const marker = markersRef.current.get(id);
        if (marker) {
          marker.setMap(null);
          markersRef.current.delete(id);
        }
      }
    });

    // Add or update markers
    locations.forEach(loc => {
      const position = new window.naver.maps.LatLng(
        loc.latitude,
        loc.longitude,
      );
      const existingMarker = markersRef.current.get(loc.wardId);

      const lastUpdated = new Date(loc.lastUpdated).getTime();
      const now = Date.now();
      const isInactive = (now - lastUpdated) > (24 * 60 * 60 * 1000);

      const statusClass = isInactive ? 'bg-caution' : `bg-${loc.status}`;

      const iconContent = `
        <div class="map-marker-icon ${statusClass}">
          ${loc.wardName.charAt(0)}
        </div>
      `;

      if (existingMarker) {
        existingMarker.setPosition(position);
        existingMarker.setIcon({ content: iconContent });
      } else {
        const marker = new window.naver.maps.Marker({
          position,
          map,
          icon: { content: iconContent },
        });

        window.naver.maps.Event.addListener(marker, 'click', () => {
          onWardClick?.(loc.wardId);
        });

        markersRef.current.set(loc.wardId, marker);
      }
    });

    // Center map on first load if there are locations
    if (locations.length > 0 && markersRef.current.size === locations.length) {
      const bounds = locations.reduce(
        (acc, loc) => ({
          minLat: Math.min(acc.minLat, loc.latitude),
          maxLat: Math.max(acc.maxLat, loc.latitude),
          minLng: Math.min(acc.minLng, loc.longitude),
          maxLng: Math.max(acc.maxLng, loc.longitude),
        }),
        { minLat: 90, maxLat: -90, minLng: 180, maxLng: -180 },
      );

      const centerLat = (bounds.minLat + bounds.maxLat) / 2;
      const centerLng = (bounds.minLng + bounds.maxLng) / 2;
      map.setCenter(new window.naver.maps.LatLng(centerLat, centerLng));
    }
  }, [isMapReady, locations, onWardClick]);

  // Pan to selected ward
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current || !selectedWardId) return;

    const location = locations.find(loc => loc.wardId === selectedWardId);
    if (location) {
      mapInstanceRef.current.panTo(
        new window.naver.maps.LatLng(location.latitude, location.longitude),
        { duration: 300 },
      );
    }
  }, [isMapReady, selectedWardId, locations]);

  if (error) {
    return (
      <div className="map-error-container">
        {error}
      </div>
    );
  }

  return (
    <div ref={mapRef} className="map-container">
      {!isMapReady && (
        <div className="map-loading-overlay">
          지도 로딩 중...
        </div>
      )}
    </div>
  );
}
