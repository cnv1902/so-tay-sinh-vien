import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Map, Camera, GeoJSONSource, Layer } from '@maplibre/maplibre-react-native';

import MapPlaceholder from './MapPlaceholder';

interface VinhUniMapProps {
  routeGeoJSON?: any;
  userLocation?: { latitude: number; longitude: number } | null;
  buildings?: any;
  loading?: boolean;
  error?: string | null;
}

const emptyGeoJSON = { type: 'FeatureCollection', features: [] };

export default function VinhUniMap({ routeGeoJSON, userLocation, buildings, loading, error }: VinhUniMapProps = {}) {

  if (loading || error || !buildings) {
    return <MapPlaceholder />;
  }

  const userLocationData = userLocation ? {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Point',
          coordinates: [userLocation.longitude, userLocation.latitude]
        }
      }
    ]
  } : emptyGeoJSON;

  return (
    <View style={styles.container}>
      <Map
        style={StyleSheet.absoluteFill}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
        logoEnabled={false}
        attributionEnabled={false}
      >
        <Camera
          zoom={16}
          center={[105.695, 18.660]}
        />

        {/* Bắt buộc phải khởi tạo luôn tất cả source để tránh crash khi load style */}
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
            'fill-extrusion-opacity': 0.9,
          }}
        />

        <GeoJSONSource id="route-source" data={routeGeoJSON || emptyGeoJSON} />
        <Layer
          id="route-layer"
          type="line"
          source="route-source"
          paint={{
            'line-color': '#EF4444',
            'line-width': 5,
            'line-opacity': 0.8,
          }}
        />

        <GeoJSONSource id="user-location-source" data={userLocationData} />
        
        {/* Lớp viền mờ lan tỏa (Aura/Glow effect) */}
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

        {/* Điểm xanh dương chính xác ở giữa */}
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
      </Map>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});