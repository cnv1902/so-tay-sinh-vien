/**
 * features/map/useLiveNavigation.ts
 * =================================
 * Hook theo dõi vị trí + hướng di chuyển thiết bị theo thời gian thực (Realtime GPS & Compass).
 * Tối ưu hóa hiệu năng cho máy cấu hình thấp:
 * - Tách riêng animation 60fps của mũi tên la bàn khỏi React state (giảm 90% re-renders).
 * - Sử dụng useNativeDriver: false để hoạt động chuẩn xác trong ViewAnnotation trên Android.
 * - Tính toán chính xác góc rẽ và cảnh báo quay đầu khi đi/nhìn ngược hướng.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { Animated } from 'react-native';
import * as Location from 'expo-location';
import i18n from '../../i18n';

export interface LatLng {
  latitude: number;
  longitude: number;
}

export type TurnIcon =
  | 'straight'
  | 'slight-left'
  | 'slight-right'
  | 'left'
  | 'right'
  | 'sharp-left'
  | 'sharp-right'
  | 'uturn'
  | 'arrive';

export interface TurnPoint {
  index: number;
  coordinate: LatLng;
  distanceFromStart: number; // mét tính dọc tuyến
  icon: TurnIcon;
}

export interface LiveNavState {
  currentPosition: LatLng | null;
  heading: number; // 0-360 độ (0 = Bắc)
  headingSource: 'compass' | 'course' | null;
  progressMeters: number;
  remainingMeters: number;
  estimatedSeconds: number;
  distanceToNextTurn: number | null;
  nextInstruction: string | null;
  nextIcon: TurnIcon | null;
  isOffRoute: boolean;
  arrived: boolean;
}

const EARTH_RADIUS = 6371000;
const OFF_ROUTE_THRESHOLD = 30; // mét: lệch quá xa tuyến coi như đi lệch đường
const ARRIVE_THRESHOLD = 12;    // mét: đến gần điểm đích
const MIN_TURN_ANGLE = 18;      // độ: lọc bỏ các khúc cua quá nhỏ do nhiễu GPS

function toRad(deg: number) { return (deg * Math.PI) / 180; }
function toDeg(rad: number) { return (rad * 180) / Math.PI; }

export function distanceMeters(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function bearingBetween(a: LatLng, b: LatLng): number {
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

export function shortestAngleDiff(from: number, to: number): number {
  let diff = (to - from) % 360;
  if (diff < -180) diff += 360;
  if (diff > 180) diff -= 360;
  return diff;
}

export function classifyTurn(deltaDeg: number): TurnIcon {
  const abs = Math.abs(deltaDeg);
  if (abs < MIN_TURN_ANGLE) return 'straight';
  if (abs > 145) return 'uturn';
  if (abs > 95) return deltaDeg > 0 ? 'sharp-right' : 'sharp-left';
  if (abs > 35) return deltaDeg > 0 ? 'right' : 'left';
  return deltaDeg > 0 ? 'slight-right' : 'slight-left';
}

export function formatDistance(m: number): string {
  if (m < 8) return i18n.t('common.rightAhead', 'Ngay phía trước');
  if (m < 1000) return `${Math.round(m / 5) * 5} ${i18n.t('common.meters', 'm')}`;
  return `${(m / 1000).toFixed(1)} ${i18n.t('common.kilometers', 'km')}`;
}

export function formatDuration(seconds: number): string {
  const mins = Math.ceil(seconds / 60);
  if (mins < 1) return i18n.t('common.lessThan1Min', 'Dưới 1 phút');
  return `${mins} ${i18n.t('common.minutes', 'phút')}`;
}

export function instructionText(icon: TurnIcon, distance: number): string {
  const d = formatDistance(distance);
  const isNear = distance < 10;

  switch (icon) {
    case 'straight':
      return isNear
        ? i18n.t('map.maneuvers.straightNow', 'Đi thẳng tiếp')
        : i18n.t('map.maneuvers.straight', { distance: d, defaultValue: `Đi thẳng ${d}` });
    case 'slight-left':
      return isNear
        ? i18n.t('map.maneuvers.slightLeftNow', 'Chếch sang trái')
        : i18n.t('map.maneuvers.slightLeft', { distance: d, defaultValue: `Chếch sang trái sau ${d}` });
    case 'slight-right':
      return isNear
        ? i18n.t('map.maneuvers.slightRightNow', 'Chếch sang phải')
        : i18n.t('map.maneuvers.slightRight', { distance: d, defaultValue: `Chếch sang phải sau ${d}` });
    case 'left':
      return isNear
        ? i18n.t('map.maneuvers.leftNow', 'Rẽ trái ngay')
        : i18n.t('map.maneuvers.left', { distance: d, defaultValue: `Rẽ trái sau ${d}` });
    case 'right':
      return isNear
        ? i18n.t('map.maneuvers.rightNow', 'Rẽ phải ngay')
        : i18n.t('map.maneuvers.right', { distance: d, defaultValue: `Rẽ phải sau ${d}` });
    case 'sharp-left':
      return isNear
        ? i18n.t('map.maneuvers.sharpLeftNow', 'Cua gắt sang trái')
        : i18n.t('map.maneuvers.sharpLeft', { distance: d, defaultValue: `Cua gắt sang trái sau ${d}` });
    case 'sharp-right':
      return isNear
        ? i18n.t('map.maneuvers.sharpRightNow', 'Cua gắt sang phải')
        : i18n.t('map.maneuvers.sharpRight', { distance: d, defaultValue: `Cua gắt sang phải sau ${d}` });
    case 'uturn':
      return isNear
        ? i18n.t('map.maneuvers.uturnNow', 'Vui lòng quay đầu lại')
        : i18n.t('map.maneuvers.uturn', { distance: d, defaultValue: `Quay đầu lại sau ${d}` });
    case 'arrive':
      return i18n.t('map.maneuvers.arrive', 'Đã đến điểm đích');
  }
}

export function buildTurnPoints(route: LatLng[]): TurnPoint[] {
  if (!route || route.length < 2) return [];
  const turns: TurnPoint[] = [];
  const cumDistances: number[] = [0];
  let cumDist = 0;

  for (let i = 1; i < route.length; i++) {
    cumDist += distanceMeters(route[i - 1], route[i]);
    cumDistances.push(cumDist);
  }

  for (let i = 1; i < route.length - 1; i++) {
    const bearingIn = bearingBetween(route[i - 1], route[i]);
    const bearingOut = bearingBetween(route[i], route[i + 1]);
    const delta = shortestAngleDiff(bearingIn, bearingOut);
    const icon = classifyTurn(delta);
    if (icon === 'straight') continue;
    turns.push({ index: i, coordinate: route[i], distanceFromStart: cumDistances[i], icon });
  }

  turns.push({
    index: route.length - 1,
    coordinate: route[route.length - 1],
    distanceFromStart: cumDistances[cumDistances.length - 1],
    icon: 'arrive',
  });

  return turns;
}

export function snapToRoute(position: LatLng, route: LatLng[]) {
  if (!route || route.length < 2) return { distFromRoute: 0, distAlongRoute: 0, segIndex: 0 };
  let best = { distFromRoute: Infinity, distAlongRoute: 0, segIndex: 0 };
  let cumDist = 0;

  for (let i = 0; i < route.length - 1; i++) {
    const a = route[i];
    const b = route[i + 1];
    const segLen = distanceMeters(a, b);
    const dx = b.latitude - a.latitude;
    const dy = b.longitude - a.longitude;
    const denom = dx * dx + dy * dy || 1;
    const t = segLen === 0 ? 0 : Math.max(0, Math.min(1,
      ((position.latitude - a.latitude) * dx + (position.longitude - a.longitude) * dy) / denom
    ));
    const projected: LatLng = { latitude: a.latitude + t * dx, longitude: a.longitude + t * dy };
    const distFromRoute = distanceMeters(position, projected);
    const distAlongRoute = cumDist + segLen * t;

    if (distFromRoute < best.distFromRoute) {
      best = { distFromRoute, distAlongRoute, segIndex: i };
    }
    cumDist += segLen;
  }
  return best;
}

export function useLiveNavigation(route: LatLng[], isNavigating: boolean = false) {
  const [state, setState] = useState<LiveNavState>({
    currentPosition: null,
    heading: 0,
    headingSource: null,
    progressMeters: 0,
    remainingMeters: 0,
    estimatedSeconds: 0,
    distanceToNextTurn: null,
    nextInstruction: null,
    nextIcon: null,
    isOffRoute: false,
    arrived: false,
  });

  const animatedHeading = useRef(new Animated.Value(0)).current;
  const headingValueRef = useRef(0);
  const turnsRef = useRef<TurnPoint[]>(buildTurnPoints(route));
  const totalLengthRef = useRef(0);
  const lastStateHeadingUpdate = useRef<number>(0);

  useEffect(() => {
    turnsRef.current = buildTurnPoints(route);
    totalLengthRef.current = route && route.length > 1
      ? route.reduce((sum, p, i) => (i === 0 ? 0 : sum + distanceMeters(route[i - 1], p)), 0)
      : 0;
  }, [route]);

  const applyHeading = useCallback((newHeading: number, source: 'compass' | 'course') => {
    if (typeof newHeading !== 'number' || isNaN(newHeading) || newHeading < 0) return;
    const normalized = ((newHeading % 360) + 360) % 360;

    const diff = shortestAngleDiff(headingValueRef.current, normalized);
    const target = headingValueRef.current + diff;
    headingValueRef.current = target;

    // useNativeDriver: false bắt buộc trên Android cho View bên trong MapLibre ViewAnnotation
    Animated.timing(animatedHeading, {
      toValue: target,
      duration: 180,
      useNativeDriver: false,
    }).start();

    // Giảm tần suất cập nhật React State để máy yếu không bị quá tải CPU/giật lag
    const now = Date.now();
    if (now - lastStateHeadingUpdate.current > 350) {
      lastStateHeadingUpdate.current = now;
      setState(prev => {
        if (Math.abs(shortestAngleDiff(prev.heading, normalized)) < 3) return prev;
        return { ...prev, heading: normalized, headingSource: source };
      });
    }
  }, [animatedHeading]);

  useEffect(() => {
    let posSub: Location.LocationSubscription | undefined;
    let headSub: Location.LocationSubscription | undefined;
    let cancelled = false;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted' || cancelled) return;

      // 1. Theo dõi GPS: 1s một lần (chuẩn GPS 1Hz, tránh nghẽn luồng xử lý trên máy yếu)
      posSub = await Location.watchPositionAsync(
        {
          accuracy: isNavigating ? Location.Accuracy.BestForNavigation : Location.Accuracy.Balanced,
          timeInterval: isNavigating ? 1000 : 2500,
          distanceInterval: isNavigating ? 1 : 4,
          mayShowUserSettingsDialog: true,
        },
        (loc) => {
          const pos: LatLng = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
          const snap = snapToRoute(pos, route);
          const remainingMeters = Math.max(0, totalLengthRef.current - snap.distAlongRoute);
          const estimatedSeconds = Math.round(remainingMeters / 1.2);
          const arrived = remainingMeters < ARRIVE_THRESHOLD;

          // Hướng đoạn đường hiện tại để so khớp với hướng người dùng đang quay mặt
          let nextInstruction: string | null = null;
          let nextIcon: TurnIcon | null = null;
          let distanceToNextTurn: number | null = null;

          if (arrived) {
            nextInstruction = i18n.t('map.arrivedText', 'Bạn đã đến điểm đích');
            nextIcon = 'arrive';
          } else if (route && route.length > 1) {
            const segStart = route[snap.segIndex] || pos;
            const segEnd = route[snap.segIndex + 1] || segStart;
            const pathBearing = bearingBetween(segStart, segEnd);
            const currentH = ((headingValueRef.current % 360) + 360) % 360;
            const headingVsPath = shortestAngleDiff(currentH, pathBearing);

            // Nếu người dùng đang nhìn hoặc đi ngược hẳn chiều tuyến đường (> 130 độ)
            if (Math.abs(headingVsPath) > 130 && route.length > 2) {
              nextInstruction = i18n.t('map.maneuvers.uturnNow', 'Vui lòng quay đầu lại');
              nextIcon = 'uturn';
              distanceToNextTurn = 0;
            } else {
              // Tìm khúc cua kế tiếp
              const nextTurn = turnsRef.current.find(t => t.distanceFromStart >= snap.distAlongRoute + 6);
              if (nextTurn) {
                distanceToNextTurn = Math.max(0, nextTurn.distanceFromStart - snap.distAlongRoute);
                nextInstruction = instructionText(nextTurn.icon, distanceToNextTurn);
                nextIcon = nextTurn.icon;
              } else {
                distanceToNextTurn = remainingMeters;
                nextInstruction = instructionText('straight', remainingMeters);
                nextIcon = 'straight';
              }
            }
          }

          setState(prev => ({
            ...prev,
            currentPosition: pos,
            progressMeters: snap.distAlongRoute,
            remainingMeters,
            estimatedSeconds,
            distanceToNextTurn,
            nextInstruction,
            nextIcon,
            isOffRoute: route.length > 1 && snap.distFromRoute > OFF_ROUTE_THRESHOLD,
            arrived,
          }));

          // Khi di chuyển tốc độ nhanh (> 1.2 m/s), tham khảo thêm hướng GPS course
          if (loc.coords.heading != null && loc.coords.heading >= 0 && (loc.coords.speed ?? 0) > 1.2) {
            applyHeading(loc.coords.heading, 'course');
          }
        }
      );

      // 2. Theo dõi la bàn từ tính (xoay máy tại chỗ)
      try {
        headSub = await Location.watchHeadingAsync((h) => {
          const heading = (h.trueHeading != null && h.trueHeading >= 0) ? h.trueHeading : h.magHeading;
          if (typeof heading === 'number' && !isNaN(heading) && heading >= 0) {
            applyHeading(heading, 'compass');
          }
        });
      } catch (e) {
        console.warn('Lỗi mở cảm biến la bàn:', e);
      }
    })();

    return () => {
      cancelled = true;
      posSub?.remove();
      headSub?.remove();
    };
  }, [route, isNavigating, applyHeading]);

  return { ...state, animatedHeading };
}
