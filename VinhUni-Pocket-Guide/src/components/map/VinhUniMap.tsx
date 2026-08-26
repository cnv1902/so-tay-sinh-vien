import React from 'react';
import { StyleSheet, View, Animated } from 'react-native';
import { Map, Camera, GeoJSONSource, Layer, ViewAnnotation } from '@maplibre/maplibre-react-native';

import MapPlaceholder from './MapPlaceholder';
import NavigationPuck from './NavigationPuck';

interface VinhUniMapProps {
  routeGeoJSON?: any;
  userLocation?: { latitude: number; longitude: number } | null;
  heading?: number;
  animatedHeading?: Animated.Value;
  isNavigating?: boolean;
  buildings?: any;
  loading?: boolean;
  error?: string | null;
  onMarkerPress?: (location: any) => void;
}

const emptyGeoJSON = {
  type: 'FeatureCollection' as const,
  features: [],
};

export default function VinhUniMap({
  routeGeoJSON,
  userLocation,
  heading = 0,
  animatedHeading,
  isNavigating = false,
  buildings,
  loading,
  error,
}: VinhUniMapProps = {}) {

  if (loading || error || !buildings) {
    return <MapPlaceholder />;
  }

  const userLocationData = userLocation ? {
    type: 'FeatureCollection' as const,
    features: [
      {
        type: 'Feature' as const,
        properties: {},
        geometry: {
          type: 'Point' as const,
          coordinates: [userLocation.longitude, userLocation.latitude]
        }
      }
    ]
  } : emptyGeoJSON;

  const centerCoord: [number, number] = userLocation && isNavigating
    ? [userLocation.longitude, userLocation.latitude]
    : [105.695, 18.660];

  return (
    <View style={styles.container}>
      <Map
        style={StyleSheet.absoluteFill}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
      >
        <Camera
          zoom={isNavigating ? 19 : 16}
          pitch={isNavigating ? 45 : 0}
          bearing={isNavigating ? heading : 0}
          center={centerCoord}
          duration={isNavigating ? 300 : 800}
        />

        {/* 1. Lớp tòa nhà 3D và nhãn */}
        <GeoJSONSource
          id="vinhuni-buildings-source"
          data={buildings || emptyGeoJSON}
        />
        <Layer
          id="vinhuni-buildings-3d"
          type="fill-extrusion"
          source="vinhuni-buildings-source"
          paint={{
            'fill-extrusion-height': ['coalesce', ['get', 'height'], 10],
            'fill-extrusion-base': 0,
            'fill-extrusion-color': ['coalesce', ['get', 'color'], '#3B82F6'],
            'fill-extrusion-opacity': 0.8,
          }}
        />
        <Layer
          id="vinhuni-buildings-labels"
          type="symbol"
          source="vinhuni-buildings-source"
          filter={['==', ['get', 'is_building'], 1]}
          layout={{
            'text-field': '{name}',
            'text-size': 11,
            'text-anchor': 'center',
            'text-offset': [0, 0],
            'text-allow-overlap': false,
          }}
          paint={{
            'text-color': '#1E293B',
            'text-halo-color': '#FFFFFF',
            'text-halo-width': 1.5,
          }}
        />

        {/* 2. Tuyến đường dẫn đường */}
        <GeoJSONSource id="route-source" data={routeGeoJSON || emptyGeoJSON} />
        {/* Viền ngoài phát sáng của tuyến đường */}
        <Layer
          id="route-glow-layer"
          type="line"
          source="route-source"
          paint={{
            'line-color': '#3B82F6',
            'line-width': 8,
            'line-opacity': 0.4,
          }}
        />
        {/* Tim đường chính */}
        <Layer
          id="route-layer"
          type="line"
          source="route-source"
          paint={{
            'line-color': isNavigating ? '#10B981' : '#2563EB',
            'line-width': 5,
            'line-opacity': 0.95,
          }}
        />

        {/* 3. Con trỏ vị trí & Hướng di chuyển (Navigation Puck) */}
        {userLocation && animatedHeading ? (
          <ViewAnnotation
            id="user-nav-puck-annotation"
            lngLat={[userLocation.longitude, userLocation.latitude]}
          >
            <NavigationPuck animatedHeading={animatedHeading} isNavigating={isNavigating} />
          </ViewAnnotation>
        ) : (

          <>
            <GeoJSONSource id="user-location-source" data={userLocationData} />
            <Layer
              key="user-location-glow-layer"
              id="user-location-glow-layer"
              type="circle"
              source="user-location-source"
              paint={{
                'circle-radius': 20,
                'circle-color': '#007AFF',
                'circle-opacity': 0.2,
                'circle-stroke-width': 1,
                'circle-stroke-color': '#007AFF',
                'circle-stroke-opacity': 0.1
              }}
            />
            <Layer
              key="user-location-layer"
              id="user-location-layer"
              type="circle"
              source="user-location-source"
              paint={{
                'circle-radius': 7,
                'circle-color': '#007AFF',
                'circle-stroke-width': 3,
                'circle-stroke-color': '#ffffff',
              }}
            />
          </>
        )}
      </Map>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});