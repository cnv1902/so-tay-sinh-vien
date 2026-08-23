import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState, useEffect } from 'react';
import * as LocationExpo from 'expo-location';
import { useNavigationStore } from '../../stores/useNavigationStore';
import { API_BASE_URL } from '../../services/api';
import VinhUniMap from '../../components/map/VinhUniMap';
import { useMapData } from '../../features/map/useMapData';
import MapCategories from '../../components/map/MapCategories';
import CurrentLocationButton from '../../components/map/CurrentLocationButton';
import MapSmartSheet from '../../components/map/MapSmartSheet';

import {
  colors,
  radius,
  shadows,
  spacing,
  typography,
} from '../../design';
import type { Location } from '../../types/location';

export default function MapScreen() {
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [routeGeoJSON, setRouteGeoJSON] = useState<any>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  
  // Routing states
  const [routingStart, setRoutingStart] = useState<Location | 'USER_LOCATION' | null>(null);
  const [routingEnd, setRoutingEnd] = useState<Location | null>(null);

  const { destination, clearDestination } = useNavigationStore();
  const { buildings, departments, loading, error } = useMapData();

  useEffect(() => {
    (async () => {
      const isLocationEnabled = await LocationExpo.hasServicesEnabledAsync();
      if (!isLocationEnabled) {
        Alert.alert(
          'Dịch vụ vị trí đang tắt',
          'Vui lòng bật GPS (Vị trí) trong cài đặt thiết bị để hiển thị vị trí của bạn trên bản đồ.',
          [{ text: 'Đã hiểu' }]
        );
        return;
      }

      let { status } = await LocationExpo.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Chưa cấp quyền vị trí',
          'Bạn cần cấp quyền truy cập vị trí để ứng dụng có thể hiển thị bạn đang ở đâu trong khuôn viên trường.',
          [{ text: 'Đóng' }]
        );
        return;
      }

      try {
        let loc = await LocationExpo.getCurrentPositionAsync({});
        setUserLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      } catch (e) {
        console.warn('Không thể lấy vị trí hiện tại:', e);
      }
    })();
  }, []);

  useEffect(() => {
    if (destination && userLocation) {
      setRoutingEnd(destination as any);
      setRoutingStart('USER_LOCATION');
      clearDestination();
    }
  }, [destination, userLocation]);

  useEffect(() => {
    if (routingStart && routingEnd) {
       const startCoords = routingStart === 'USER_LOCATION' 
           ? userLocation 
           : routingStart.coordinate;
       const endCoords = routingEnd.coordinate;
       
       if (startCoords && endCoords) {
           fetchRoute(startCoords.latitude, startCoords.longitude, endCoords.latitude, endCoords.longitude);
       }
    } else {
       setRouteGeoJSON(null);
    }
  }, [routingStart, routingEnd, userLocation]);

  const fetchRoute = async (startLat: number, startLng: number, endLat: number, endLng: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/map/route?start=${startLat},${startLng}&end=${endLat},${endLng}`);
      if (res.ok) {
        const data = await res.json();
        setRouteGeoJSON(data);
      }
    } catch (error) {
      console.error("Lỗi lấy đường đi:", error);
    }
  };

  const allLocations = useMemo(() => {
    if (!departments) return [];
    
    // Nếu là dữ liệu mảng trực tiếp từ Database API (/api/admin/departments)
    if (Array.isArray(departments)) {
      return departments.map((d: any) => {
        const lat = d.latitude || d.building?.latitude || 18.6658;
        const lng = d.longitude || d.building?.longitude || 105.6945;
        return {
          id: String(d.id),
          name: d.name,
          description: d.function_description || d.description || undefined,
          category: d.is_building ? 'building' : 'administration',
          floor: d.floor,
          room: d.room_number,
          phone: d.phone_number,
          coordinate: {
            latitude: lat,
            longitude: lng,
          },
          purpose: d.function_description || d.description || d.name,
        } as Location;
      });
    }

    // Nếu là GeoJSON FeatureCollection
    if (departments.features) {
      return departments.features.map((f: any, index: number) => {
        const props = f.properties;
        const coords = f.geometry.coordinates;
        return {
          id: props.id ? String(props.id) : `dept-${index}`,
          name: props.name || 'Không tên',
          description: props.function_description || props.description || props.note || undefined,
          category: props.is_building ? 'building' : (props.category || 'other'),
          floor: props.floor,
          room: props.room_number,
          phone: props.phone_number,
          coordinate: {
            latitude: coords[1],
            longitude: coords[0]
          },
          purpose: props.function_description || props.description || props.type,
        } as Location;
      });
    }

    return [];
  }, [departments]);

  return (
    <View style={styles.container}>
      <VinhUniMap 
        routeGeoJSON={routeGeoJSON} 
        userLocation={userLocation} 
        buildings={buildings}
        loading={loading}
        error={error}
        onMarkerPress={setSelectedLocation}
      />

      <View style={styles.top}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Bản đồ VinhUni</Text>
            <Text style={styles.subtitle}>Bản đồ khuôn viên Đại học Vinh</Text>
          </View>
          <TouchableOpacity style={styles.settings}>
            <Ionicons name="options-outline" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

      </View>

      <View style={styles.locationButton}>
        <CurrentLocationButton />
      </View>

      <MapSmartSheet 
        locations={allLocations}
        selectedLocation={selectedLocation}
        onSelectLocation={setSelectedLocation}
        onDrawRoute={(start, end) => {
            setRoutingStart(start);
            setRoutingEnd(end);
        }}
        onClearRoute={() => {
            setRoutingStart(null);
            setRoutingEnd(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  top: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 56,
    paddingHorizontal: spacing.lg,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },

  title: {
    fontSize: typography.size.xxl,
    fontWeight: '700',
    color: colors.textPrimary,
  },

  subtitle: {
    marginTop: 2,
    fontSize: typography.size.xs,
    color: colors.textSecondary,
  },

  settings: {
    width: 44,
    height: 44,
    borderRadius: radius.round,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    ...shadows.medium,
  },

  locationButton: {
    position: 'absolute',
    right: spacing.lg,
    bottom: 140, // Đẩy lên xíu tránh dính vào bottomCard
  },

  bottomCardWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    overflow: 'hidden',
    ...shadows.large,
  },
  
  bottomCard: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl, // Thêm khoảng trống bottom
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
  },

  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: radius.round,
    backgroundColor: 'rgba(15, 23, 42, 0.2)',
    marginBottom: spacing.lg,
  },

  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
  },

  cardContent: {
    flex: 1,
    marginLeft: spacing.md,
  },

  cardTitle: {
    fontSize: typography.size.md,
    fontWeight: '700',
    color: colors.textPrimary,
  },

  cardSubtitle: {
    marginTop: 4,
    fontSize: typography.size.xs,
    lineHeight: 18,
    color: colors.textSecondary,
  },
});