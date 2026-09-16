import React, { useRef, useMemo, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Keyboard,
  ScrollView,
  Animated,
  PanResponder,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { colors } from "../../design";
import type { Location } from "../../types/location";
import LocationItem from "./LocationItem";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// Các mức chiều cao (snap points) tính theo px thực tế
const SNAP_SEARCH_COLLAPSED = Math.round(SCREEN_HEIGHT * 0.32); // Hiện ô tìm kiếm + 2-3 kết quả
const SNAP_SEARCH_EXPANDED = Math.round(SCREEN_HEIGHT * 0.82);  // Mở rộng gần hết màn hình
const SNAP_DETAIL = Math.round(SCREEN_HEIGHT * 0.45);          // Khung thông tin chi tiết
const SNAP_ROUTING_COLLAPSED = Math.round(SCREEN_HEIGHT * 0.36);// Khung chọn 2 điểm đi/đến
const SNAP_ROUTING_EXPANDED = Math.round(SCREEN_HEIGHT * 0.78); // Khi đang gõ tìm điểm đến
const SNAP_NAVIGATING = 92;                                    // Thanh điều hướng thu gọn khi đang đi

type SheetState = "search" | "detail" | "routing";

interface Props {
  locations: Location[];
  selectedLocation: Location | null;
  onSelectLocation: (loc: Location | null) => void;
  onDrawRoute: (start: Location | "USER_LOCATION", end: Location) => void;
  onClearRoute: () => void;
  onStartNavigation?: () => void;
  isNavigating?: boolean;
}

export default function MapSmartSheet({
  locations,
  selectedLocation,
  onSelectLocation,
  onDrawRoute,
  onClearRoute,
  onStartNavigation,
  isNavigating = false,
}: Props) {
  const { t } = useTranslation();
  const [sheetState, setSheetState] = useState<SheetState>("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [routingStart, setRoutingStart] = useState<Location | "USER_LOCATION">("USER_LOCATION");
  const [routingEnd, setRoutingEnd] = useState<Location | null>(null);
  const [activeInput, setActiveInput] = useState<"start" | "end" | null>(null);
  const [routingSearch, setRoutingSearch] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  // Animated Height cho Bottom Sheet thuần React Native (chạy mượt 60fps, 100% tương thích)
  const currentHeightRef = useRef(SNAP_SEARCH_COLLAPSED);
  const animatedHeight = useRef(new Animated.Value(SNAP_SEARCH_COLLAPSED)).current;

  // Hàm animate chuyển độ cao
  const animateToHeight = (targetHeight: number) => {
    currentHeightRef.current = targetHeight;
    Animated.spring(animatedHeight, {
      toValue: targetHeight,
      useNativeDriver: false,
      bounciness: 4,
      speed: 14,
    }).start();
  };

  // Đồng bộ độ cao khi đổi trạng thái (Navigating / Search / Detail / Routing)
  useEffect(() => {
    if (isNavigating) {
      setIsExpanded(false);
      animateToHeight(SNAP_NAVIGATING);
    } else if (selectedLocation) {
      setSheetState("detail");
      setIsExpanded(false);
      animateToHeight(SNAP_DETAIL);
    } else if (sheetState === "detail") {
      setSheetState("search");
      setIsExpanded(false);
      animateToHeight(SNAP_SEARCH_COLLAPSED);
    }
  }, [isNavigating, selectedLocation]);

  // Bộ lọc địa điểm tìm kiếm
  const filteredLocs = useMemo(() => {
    if (!searchQuery.trim()) return locations;
    const q = searchQuery.toLowerCase();
    return locations.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        (l.category && l.category.toLowerCase().includes(q)) ||
        (l.purpose && l.purpose.toLowerCase().includes(q)) ||
        (l.description && l.description.toLowerCase().includes(q))
    );
  }, [searchQuery, locations]);

  // Bộ lọc khi tìm điểm đi / điểm đến trong phần Routing
  const routingLocs = useMemo(() => {
    if (!routingSearch.trim()) return locations;
    const q = routingSearch.toLowerCase();
    return locations.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        (l.purpose && l.purpose.toLowerCase().includes(q))
    );
  }, [routingSearch, locations]);

  // Xử lý cử chỉ vuốt kéo tay lên/xuống (PanResponder)
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !isNavigating,
        onMoveShouldSetPanResponder: (_, gestureState) => !isNavigating && Math.abs(gestureState.dy) > 5,
        onPanResponderGrant: () => {
          // Lưu vị trí trước khi kéo
        },
        onPanResponderMove: (_, gestureState) => {
          if (isNavigating) return;
          const newH = currentHeightRef.current - gestureState.dy;
          const minH = sheetState === "detail" ? SNAP_DETAIL : SNAP_SEARCH_COLLAPSED;
          const maxH = sheetState === "detail" ? SNAP_SEARCH_EXPANDED : SNAP_SEARCH_EXPANDED;
          if (newH >= minH - 40 && newH <= maxH + 40) {
            animatedHeight.setValue(newH);
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          if (isNavigating) return;
          if (sheetState === "detail") {
            // Khi ở màn hình Detail
            if (gestureState.dy > 60) {
              onSelectLocation(null);
            } else {
              animateToHeight(SNAP_DETAIL);
            }
          } else {
            // Khi ở Search hoặc Routing
            if (gestureState.dy < -40 || gestureState.vy < -0.4) {
              setIsExpanded(true);
              animateToHeight(SNAP_SEARCH_EXPANDED);
            } else if (gestureState.dy > 40 || gestureState.vy > 0.4) {
              Keyboard.dismiss();
              setIsExpanded(false);
              animateToHeight(SNAP_SEARCH_COLLAPSED);
            } else {
              // Trở về mốc gần nhất
              const target = isExpanded ? SNAP_SEARCH_EXPANDED : SNAP_SEARCH_COLLAPSED;
              animateToHeight(target);
            }
          }
        },
      }),
    [sheetState, isExpanded, isNavigating]
  );

  const selectLoc = (loc: Location) => {
    Keyboard.dismiss();
    onSelectLocation(loc);
  };

  const startRouting = () => {
    setRoutingEnd(selectedLocation);
    setSheetState("routing");
    setIsExpanded(false);
    animateToHeight(SNAP_ROUTING_COLLAPSED);
    if (selectedLocation) onDrawRoute("USER_LOCATION", selectedLocation);
  };

  const cancelRouting = () => {
    onClearRoute();
    setSheetState("search");
    onSelectLocation(null);
    setSearchQuery("");
    setActiveInput(null);
    setIsExpanded(false);
    animateToHeight(SNAP_SEARCH_COLLAPSED);
  };

  const selectRouting = (loc: Location | "USER_LOCATION") => {
    Keyboard.dismiss();
    setRoutingSearch("");
    if (activeInput === "start") setRoutingStart(loc);
    else setRoutingEnd(loc as Location);
    const ns = activeInput === "start" ? loc : routingStart;
    const ne = activeInput === "end" ? loc : routingEnd;
    setActiveInput(null);
    animateToHeight(SNAP_ROUTING_COLLAPSED);
    if (ns && ne && ne !== "USER_LOCATION") onDrawRoute(ns, ne as Location);
  };

  return (
    <Animated.View style={[s.sheet, { height: animatedHeight }]}>
      {/* VÙNG TAY CẦM KÉO VUỐT — Kéo để mở rộng hoặc thu gọn */}
      <View {...panResponder.panHandlers} style={s.handleArea}>
        <View style={s.handleIndicator} />
      </View>

      <View style={s.bodyContainer}>
        {/* ==================== TRẠNG THÁI DẪN ĐƯỜNG (NAVIGATING) ==================== */}
        {isNavigating ? (
          <View style={s.navigatingRow}>
            <View style={s.navigatingIconBox}>
              <Ionicons name="navigate" size={22} color="#10B981" />
            </View>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={s.navigatingLabel}>{t("map.headingTo")}</Text>
              <Text style={s.navigatingTitle} numberOfLines={1}>
                {routingEnd?.name || selectedLocation?.name || t("map.routeTitle")}
              </Text>
            </View>
            <TouchableOpacity
              style={s.stopNavBtn}
              onPress={() => {
                onClearRoute();
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="stop-circle" size={18} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={s.stopNavBtnText}>{t("map.stopNavigation")}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* ==================== TRẠNG THÁI 1: TÌM KIẾM ==================== */}
            {sheetState === "search" && (
              <View style={{ flex: 1 }}>
            {/* Thanh Search Bar nổi bật, tương phản cao */}
            <View style={s.searchBarWrapper}>
              <View style={s.searchBar}>
                <Ionicons name="search" size={20} color="#94A3B8" />
                <TextInput
                  style={s.searchInput}
                  placeholder={t("map.searchPlaceholder", "Tìm kiếm...")}
                  placeholderTextColor="#94A3B8"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onFocus={() => {
                    setIsExpanded(true);
                    animateToHeight(SNAP_SEARCH_EXPANDED);
                  }}
                  returnKeyType="search"
                  autoCorrect={false}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setSearchQuery("")}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close-circle" size={18} color="#94A3B8" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Danh sách địa điểm */}
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={s.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {filteredLocs.length === 0 ? (
                <View style={s.empty}>
                  <Ionicons name="search-outline" size={32} color="#94A3B8" />
                  <Text style={s.emptyText}>
                    {locations.length === 0
                      ? t("common.loading")
                      : t("common.emptyData")}
                  </Text>
                </View>
              ) : (
                filteredLocs.map((item) => (
                  <LocationItem
                    key={item.id}
                    location={item}
                    onPress={() => selectLoc(item)}
                  />
                ))
              )}
            </ScrollView>
          </View>
        )}

        {/* ==================== TRẠNG THÁI 2: CHI TIẾT ĐỊA ĐIỂM ==================== */}
        {sheetState === "detail" && selectedLocation && (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={s.detailScrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity
              style={s.closeBtn}
              onPress={() => onSelectLocation(null)}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <View style={s.detailHeader}>
              <View style={s.detailIcon}>
                <Ionicons name="location" size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.detailTitle} numberOfLines={2}>
                  {selectedLocation.name}
                </Text>
                {selectedLocation.phone && (
                  <Text style={s.detailMeta}>
                    📞 {selectedLocation.phone}
                  </Text>
                )}
              </View>
            </View>

            <View style={s.descBox}>
              <Ionicons
                name="information-circle-outline"
                size={18}
                color={colors.primary}
                style={{ marginTop: 2 }}
              />
              <Text style={s.descText} numberOfLines={4}>
                {selectedLocation.description ||
                  selectedLocation.purpose ||
                  t("common.emptyData")}
              </Text>
            </View>

            <TouchableOpacity
              style={s.navBtn}
              onPress={startRouting}
              activeOpacity={0.85}
            >
              <Ionicons name="navigate" size={20} color="#fff" />
              <Text style={s.navBtnText}>{t("home.exploreMap")}</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* ==================== TRẠNG THÁI 3: DẪN ĐƯỜNG (ROUTING) ==================== */}
        {sheetState === "routing" && (
          <View style={{ flex: 1 }}>
            <View style={s.routingHeader}>
              <View style={{ width: 40 }} />
              <Text style={s.routingTitle}>{t("map.routeTitle")}</Text>
              <TouchableOpacity onPress={cancelRouting}>
                <Text style={s.cancelText}>{t("common.cancel")}</Text>
              </TouchableOpacity>
            </View>

            <View style={s.routingBox}>
              <View style={s.timeline}>
                <Ionicons
                  name="ellipse-outline"
                  size={14}
                  color={colors.textSecondary}
                />
                <View style={s.timelineLine} />
                <Ionicons name="location" size={16} color={colors.primary} />
              </View>

              <View style={{ flex: 1, gap: 8 }}>
                <TextInput
                  style={[
                    s.routeInput,
                    activeInput === "start" && s.routeInputActive,
                  ]}
                  placeholder={t("map.startPoint")}
                  placeholderTextColor="#64748B"
                  value={
                    activeInput === "start"
                      ? routingSearch
                      : routingStart === "USER_LOCATION"
                        ? t("map.yourLocation")
                        : (routingStart as Location)?.name || ""
                  }
                  onFocus={() => {
                    setActiveInput("start");
                    setRoutingSearch("");
                    animateToHeight(SNAP_ROUTING_EXPANDED);
                  }}
                  onChangeText={(v) => {
                    setRoutingSearch(v);
                    setActiveInput("start");
                  }}
                />
                <TextInput
                  style={[
                    s.routeInput,
                    activeInput === "end" && s.routeInputActive,
                  ]}
                  placeholder={t("map.destinationPoint")}
                  placeholderTextColor="#64748B"
                  value={
                    activeInput === "end"
                      ? routingSearch
                      : routingEnd?.name || ""
                  }
                  onFocus={() => {
                    setActiveInput("end");
                    setRoutingSearch("");
                    animateToHeight(SNAP_ROUTING_EXPANDED);
                  }}
                  onChangeText={(v) => {
                    setRoutingSearch(v);
                    setActiveInput("end");
                  }}
                />
              </View>

              <TouchableOpacity
                style={s.swapBtn}
                onPress={() => {
                  if (routingStart !== "USER_LOCATION" && routingEnd) {
                    setRoutingStart(routingEnd);
                    setRoutingEnd(routingStart as Location);
                    onDrawRoute(routingEnd, routingStart as Location);
                  }
                }}
              >
                <Ionicons
                  name="swap-vertical"
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {/* Nút bắt đầu dẫn đường */}
            {routingStart && routingEnd && !activeInput && (
              <TouchableOpacity
                style={s.startBtn}
                onPress={() => {
                  if (onStartNavigation) onStartNavigation();
                  animateToHeight(SNAP_NAVIGATING);
                }}
                activeOpacity={0.85}
              >
                <Ionicons
                  name="navigate"
                  size={18}
                  color="#fff"
                  style={{ marginRight: 6 }}
                />
                <Text style={s.startBtnText}>{t("map.startNavigation")}</Text>
              </TouchableOpacity>
            )}

            {/* Danh sách địa điểm chọn khi đang gõ vào ô điểm đi / điểm đến */}
            {activeInput && (
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={s.scrollContent}
                keyboardShouldPersistTaps="handled"
              >
                {activeInput === "start" && (
                  <LocationItem
                    location={{
                      id: "USER_LOCATION",
                      name: t("map.yourLocation"),
                      description: "GPS",
                      coordinate: { latitude: 0, longitude: 0 },
                      category: "other",
                      isInsideCampus: true,
                    }}
                    onPress={() => selectRouting("USER_LOCATION")}
                    isGps
                  />
                )}
                {routingLocs.map((item) => (
                  <LocationItem
                    key={item.id}
                    location={item}
                    onPress={() => selectRouting(item)}
                  />
                ))}
              </ScrollView>
            )}
          </View>
        )}
      </>
    )}
  </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    zIndex: 99,
  },
  handleArea: {
    width: "100%",
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  handleIndicator: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#94A3B8",
  },
  bodyContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  searchBarWrapper: {
    marginBottom: 8,
  },
  // Ô tìm kiếm — viền xám mờ nhẹ, nền sáng tinh tế
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: "#0F172A",
    height: 48,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  empty: {
    paddingVertical: 36,
    alignItems: "center",
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
  },
  detailScrollContent: {
    paddingBottom: 30,
  },
  closeBtn: {
    position: "absolute",
    top: 0,
    right: 0,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    marginBottom: 12,
    paddingRight: 40,
  },
  detailIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#EBF0F7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0D1B2A",
  },
  detailMeta: {
    fontSize: 13,
    color: "#4A6080",
    marginTop: 2,
  },
  descBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
    gap: 8,
  },
  descText: {
    flex: 1,
    fontSize: 13,
    color: "#4A6080",
    lineHeight: 20,
  },
  navBtn: {
    backgroundColor: "#1E3A5F",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 50,
    borderRadius: 50,
    gap: 8,
    marginTop: 4,
  },
  navBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  routingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  routingTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0D1B2A",
  },
  cancelText: {
    color: "#1E3A5F",
    fontWeight: "600",
    fontSize: 15,
  },
  routingBox: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 12,
    alignItems: "center",
  },
  timeline: {
    alignItems: "center",
    marginRight: 10,
    height: 96,
    justifyContent: "space-between",
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#CBD5E1",
    marginVertical: 4,
  },
  routeInput: {
    height: 44,
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    color: "#0F172A",
    fontSize: 14,
  },
  routeInputActive: {
    borderColor: "#1E3A5F",
    backgroundColor: "#EBF0F7",
  },
  swapBtn: {
    width: 32,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1E3A5F",
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 12,
  },
  startBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  navigatingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 4,
    paddingBottom: 8,
  },
  navigatingIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  navigatingLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "500",
  },
  navigatingTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  stopNavBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EF4444",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
  },
  stopNavBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
});
