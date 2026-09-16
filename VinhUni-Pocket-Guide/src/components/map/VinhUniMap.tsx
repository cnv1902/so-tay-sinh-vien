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
  zoomLevel?: number;
  bearing?: number;
  pitch?: number;
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
  zoomLevel,
  bearing = 0,
  pitch = 0,
}: VinhUniMapProps = {}) {

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

  const normalizedRouteGeoJSON = React.useMemo(() => {
    if (!routeGeoJSON) return emptyGeoJSON;
    if (routeGeoJSON.type === "FeatureCollection") return routeGeoJSON;
    if (routeGeoJSON.type === "Feature") {
      return {
        type: "FeatureCollection",
        features: [routeGeoJSON],
      };
    }
    return routeGeoJSON;
  }, [routeGeoJSON]);

  const VINH_UNI_CENTER: [number, number] = React.useMemo(() => [105.695, 18.660], []);

  // Tâm camera: Luôn có tọa độ hợp lệ, mặc định tại Đại học Vinh (không bao giờ undefined để tránh bay về [0,0])
  const [cameraCenter, setCameraCenter] = React.useState<[number, number]>(() => {
    return userLocation ? [userLocation.longitude, userLocation.latitude] : [105.695, 18.660];
  });

  const isInteractingRef = React.useRef(false);
  const interactionTimer = React.useRef<any>(null);

  const handleTouchStart = React.useCallback(() => {
    isInteractingRef.current = true;
    if (interactionTimer.current) clearTimeout(interactionTimer.current);
    interactionTimer.current = setTimeout(() => {
      isInteractingRef.current = false;
    }, 5000);
  }, []);

  // Cập nhật tâm camera khi người dùng di chuyển thực tế (> 8 mét)
  React.useEffect(() => {
    if (!userLocation || isInteractingRef.current) return;
    const dLat = (userLocation.latitude - cameraCenter[1]) * 111000;
    const dLng = (userLocation.longitude - cameraCenter[0]) * 105000;
    const dist = Math.sqrt(dLat * dLat + dLng * dLng);

    if (dist > 8) {
      setCameraCenter([userLocation.longitude, userLocation.latitude]);
    }
  }, [userLocation?.latitude, userLocation?.longitude]);

  // Khi bắt đầu dẫn đường: Căn giữa vị trí xuất phát
  React.useEffect(() => {
    if (isNavigating && userLocation) {
      isInteractingRef.current = false;
      setCameraCenter([userLocation.longitude, userLocation.latitude]);
    }
  }, [isNavigating]);

  const currentZoom = zoomLevel !== undefined ? zoomLevel : (isNavigating ? 18 : 16.5);
  // Không ép bearing về 0 để người dùng xoay 2 ngón tay không bị giật
  const currentBearing = bearing !== 0 ? bearing : undefined;
  const currentPitch = pitch !== undefined ? pitch : 0;

  if (loading || error || !buildings) {
    return <MapPlaceholder />;
  }

  return (
    <View style={styles.container} onTouchStart={handleTouchStart}>
      <Map
        style={StyleSheet.absoluteFill}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
      >
        <Camera
          initialViewState={{
            center: VINH_UNI_CENTER,
            zoom: 16.5,
          }}
          center={cameraCenter}
          zoom={currentZoom}
          pitch={currentPitch}
          bearing={currentBearing}
          duration={500}
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
        <GeoJSONSource id="route-source" data={normalizedRouteGeoJSON} />
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
            <NavigationPuck
              animatedHeading={animatedHeading}
              mapBearing={currentBearing}
              isNavigating={isNavigating}
            />
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