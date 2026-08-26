import React from 'react';
import MapPlaceholder from './MapPlaceholder';

interface VinhUniMapProps {
  routeGeoJSON?: any;
  userLocation?: { latitude: number; longitude: number } | null;
  heading?: number;
  animatedHeading?: any;
  isNavigating?: boolean;
  buildings?: any;
  loading?: boolean;
  error?: string | null;
  onMarkerPress?: (location: any) => void;
}

export default function VinhUniMapWeb({
  onMarkerPress,
}: VinhUniMapProps = {}) {
  return <MapPlaceholder onMarkerPress={() => onMarkerPress && onMarkerPress(null)} />;
}

