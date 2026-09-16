import { StyleSheet, Text, TouchableOpacity, View, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState, useEffect } from "react";
import * as LocationExpo from "expo-location";
import { useTranslation } from "react-i18next";
import { useNavigationStore } from "../../stores/useNavigationStore";
import { API_BASE_URL } from "../../services/api";
import VinhUniMap from "../../components/map/VinhUniMap";
import { useMapData } from "../../features/map/useMapData";
import MapCategories from "../../components/map/MapCategories";
import CurrentLocationButton from "../../components/map/CurrentLocationButton";
import MapSmartSheet from "../../components/map/MapSmartSheet";
import { useLiveNavigation } from "../../features/map/useLiveNavigation";
import TurnBanner from "../../components/map/TurnBanner";
import LanguageSwitcher from "../../components/common/LanguageSwitcher";

import { colors, radius, shadows, spacing, typography } from "../../design";
import type { Location } from "../../types/location";

export default function MapScreen() {
  const { t } = useTranslation();
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(16);
  const [bearing, setBearing] = useState<number>(0);
  const [pitch, setPitch] = useState<number>(0);
  const [routeGeoJSON, setRouteGeoJSON] = useState<any>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null,
  );

  // Routing states
  const [routingStart, setRoutingStart] = useState<
    Location | "USER_LOCATION" | null
  >(null);
  const [routingEnd, setRoutingEnd] = useState<Location | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  const { destination, clearDestination } = useNavigationStore();
  const { buildings, departments, loading, error } = useMapData();

  // Trích xuất mảng tọa độ tuyến đường cho Live Navigation (Hỗ trợ cả Feature và FeatureCollection)
  const routeCoordinates = useMemo(() => {
    if (!routeGeoJSON) return [];
    const rawCoords =
      routeGeoJSON?.geometry?.coordinates ||
      routeGeoJSON?.features?.[0]?.geometry?.coordinates ||
      (Array.isArray(routeGeoJSON.coordinates) ? routeGeoJSON.coordinates : null);
    if (!rawCoords || !Array.isArray(rawCoords)) return [];
    return rawCoords.map((c: [number, number]) => ({
      latitude: c[1],
      longitude: c[0],
    }));
  }, [routeGeoJSON]);

  // Hook theo dõi vị trí + hướng thiết bị + tính toán chỉ dẫn rẽ thời gian thực
  const liveNav = useLiveNavigation(routeCoordinates, isNavigating);

  useEffect(() => {
    (async () => {
      const isLocationEnabled = await LocationExpo.hasServicesEnabledAsync();
      if (!isLocationEnabled) {
        Alert.alert(
          t('map.locationServicesOffTitle'),
          t('map.locationServicesOffMsg'),
          [{ text: t('map.understood') }],
        );
        return;
      }

      let { status } = await LocationExpo.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          t('map.locationPermissionDeniedTitle'),
          t('map.locationPermissionDeniedMsg'),
          [{ text: t('common.close') }],
        );
        return;
      }

      try {
        let loc = await LocationExpo.getCurrentPositionAsync({ accuracy: LocationExpo.Accuracy.High });
        setUserLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      } catch (e) {
        console.warn("Không thể lấy vị trí hiện tại:", e);
        setUserLocation({ latitude: 18.6658, longitude: 105.6945 });
      }
    })();
  }, []);

  // Xử lý khi nhận điểm đến từ AI Chatbot
  useEffect(() => {
    if (destination) {
      const destLocation: Location = {
        id: "chat-dest",
        name: destination.name || t('chat.destinationFromChat'),
        category: "administration",
        isInsideCampus: true,
        coordinate: {
          latitude: destination.latitude,
          longitude: destination.longitude,
        },
      };

      setRoutingEnd(destLocation);
      setRoutingStart("USER_LOCATION");
      setSelectedLocation(destLocation);
      setIsNavigating(true);

      // Tự động lấy vị trí hiện tại của người dùng và tính toán đường đi ngay lập tức
      (async () => {
        let startCoords = userLocation;
        try {
          const loc = await LocationExpo.getCurrentPositionAsync({ accuracy: LocationExpo.Accuracy.High });
          startCoords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
          setUserLocation(startCoords);
        } catch (err) {
          if (!startCoords) {
            startCoords = { latitude: 18.6658, longitude: 105.6945 };
            setUserLocation(startCoords);
          }
        }
        if (startCoords) {
          fetchRoute(startCoords.latitude, startCoords.longitude, destination.latitude, destination.longitude);
        }
      })();

      clearDestination();
    }
  }, [destination]);

  // Chỉ gọi backend tính toán lộ trình khi:
  // 1. Người dùng chọn điểm xuất phát hoặc điểm đến mới
  // 2. Hoặc khi người dùng đi lệch tuyến đường (isOffRoute)
  useEffect(() => {
    if (routingStart && routingEnd) {
      const startCoords =
        routingStart === "USER_LOCATION"
          ? liveNav.currentPosition || userLocation || { latitude: 18.6658, longitude: 105.6945 }
          : routingStart.coordinate;
      const endCoords = routingEnd.coordinate;

      if (startCoords && endCoords) {
        fetchRoute(
          startCoords.latitude,
          startCoords.longitude,
          endCoords.latitude,
          endCoords.longitude,
        );
      }
    } else if (!destination) {
      setRouteGeoJSON(null);
      setIsNavigating(false);
    }
  }, [routingStart, routingEnd]);

  // Tự động tính toán lại đường đi khi người dùng đi lệch đường (isOffRoute)
  useEffect(() => {
    if (isNavigating && liveNav.isOffRoute && routingEnd && liveNav.currentPosition) {
      fetchRoute(
        liveNav.currentPosition.latitude,
        liveNav.currentPosition.longitude,
        routingEnd.coordinate.latitude,
        routingEnd.coordinate.longitude,
      );
    }
  }, [liveNav.isOffRoute]);

  const fetchRoute = async (
    startLat: number,
    startLng: number,
    endLat: number,
    endLng: number,
  ) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/admin/map/route?start=${startLat},${startLng}&end=${endLat},${endLng}`,
      );
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
          category: d.is_building ? "building" : "administration",
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
          name: props.name || "Không tên",
          description:
            props.function_description ||
            props.description ||
            props.note ||
            undefined,
          category: props.is_building ? "building" : props.category || "other",
          floor: props.floor,
          room: props.room_number,
          phone: props.phone_number,
          coordinate: {
            latitude: coords[1],
            longitude: coords[0],
          },
          purpose:
            props.function_description || props.description || props.type,
        } as Location;
      });
    }

    return [];
  }, [departments]);

  const currentDisplayPosition = liveNav.currentPosition || userLocation;

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(Number((prev + 1).toFixed(1)), 22));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(Number((prev - 1).toFixed(1)), 11));
  const handleRotateLeft = () => setBearing((prev) => (prev - 45 + 360) % 360);
  const handleRotateRight = () => setBearing((prev) => (prev + 45) % 360);
  const handleResetNorth = () => setBearing(0);
  const handleToggle3D = () => setPitch((prev) => (prev === 0 ? 55 : 0));

  const handleCenterLocation = async () => {
    try {
      let loc = await LocationExpo.getCurrentPositionAsync({ accuracy: LocationExpo.Accuracy.High });
      setUserLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      setZoomLevel(17);
    } catch (e) {
      console.warn("Không thể lấy vị trí hiện tại:", e);
    }
  };

  return (
    <View style={styles.container}>
      <VinhUniMap
        routeGeoJSON={routeGeoJSON}
        userLocation={currentDisplayPosition}
        heading={liveNav.heading}
        animatedHeading={liveNav.animatedHeading}
        isNavigating={isNavigating}
        buildings={buildings}
        loading={loading}
        error={error}
        zoomLevel={zoomLevel}
        bearing={bearing}
        pitch={pitch}
        onMarkerPress={setSelectedLocation}
      />

      {/* Thanh dẫn đường Turn-by-Turn khi đang bật Live Navigation */}
      {isNavigating && routeCoordinates.length > 1 && (
        <TurnBanner
          instruction={liveNav.nextInstruction}
          icon={liveNav.nextIcon}
          distanceToNextTurn={liveNav.distanceToNextTurn}
          remainingMeters={liveNav.remainingMeters}
          estimatedSeconds={liveNav.estimatedSeconds}
          isOffRoute={liveNav.isOffRoute}
          arrived={liveNav.arrived}
          onExit={() => {
            setIsNavigating(false);
            setRoutingStart(null);
            setRoutingEnd(null);
          }}
        />
      )}

      {/* Header thanh tìm kiếm khi không dẫn đường */}
      {!isNavigating && (
        <View style={styles.top}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{t("map.title")}</Text>
              <Text style={styles.subtitle}>{t("map.subtitle")}</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <LanguageSwitcher />
            </View>
          </View>
        </View>
      )}

    {/* Nút Định vị GPS Vị trí hiện tại - LUÔN HIỆN DIỆN */}
      <View style={[styles.locationButton, isNavigating && styles.locationButtonNavigating]}>
        <CurrentLocationButton onPress={handleCenterLocation} />
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
          setIsNavigating(false);
          setSelectedLocation(null);
        }}
        onStartNavigation={() => {
          setIsNavigating(true);
          setZoomLevel(18);
          handleCenterLocation();
        }}
        isNavigating={isNavigating}
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
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 56,
    paddingHorizontal: spacing.lg,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },

  title: {
    fontSize: typography.size.xxl,
    fontWeight: "700",
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
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    ...shadows.medium,
  },

  mapControls: {
    position: "absolute",
    right: spacing.lg,
    bottom: 220, // Nằm trên CurrentLocationButton
  },

  mapControlsNavigating: {
    bottom: 300, // Đẩy lên cao hơn khi lộ trình di chuyển / bottom sheet mở ra
  },

  locationButton: {
    position: "absolute",
    right: spacing.lg,
    bottom: 155, // Vị trí thoáng ở chế độ thường
  },

  locationButtonNavigating: {
    bottom: 235, // Đẩy lên cao để không bị che bởi khối lộ trình
  },

  bottomCardWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    overflow: "hidden",
    ...shadows.large,
  },

  bottomCard: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl, // Thêm khoảng trống bottom
    backgroundColor: "rgba(255, 255, 255, 0.65)",
  },

  handle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: radius.round,
    backgroundColor: "rgba(15, 23, 42, 0.2)",
    marginBottom: spacing.lg,
  },

  cardRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryLight,
  },

  cardContent: {
    flex: 1,
    marginLeft: spacing.md,
  },

  cardTitle: {
    fontSize: typography.size.md,
    fontWeight: "700",
    color: colors.textPrimary,
  },

  cardSubtitle: {
    marginTop: 4,
    fontSize: typography.size.xs,
    lineHeight: 18,
    color: colors.textSecondary,
  },
});
