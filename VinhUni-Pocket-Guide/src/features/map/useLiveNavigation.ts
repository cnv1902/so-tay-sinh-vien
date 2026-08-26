/**
 * features/map/useLiveNavigation.ts
 * =================================
 * Hook theo dõi vị trí + hướng di chuyển thiết bị theo thời gian thực (Realtime GPS & Compass).
 * Tự động chiếu (snap) vị trí bám theo tim đường walking (A*) và tính toán chỉ dẫn rẽ (Turn-by-Turn).
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { Animated } from 'react-native';
import * as Location from 'expo-location';

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
const ARRIVE_THRESHOLD = 15;    // mét: đến gần điểm đích
const MIN_TURN_ANGLE = 15;      // độ: lọc bỏ các khúc cua quá nhỏ do nhiễu GPS

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
  if (m < 10) return 'ngay trước mặt';
  if (m < 1000) return `${Math.round(m / 5) * 5} m`;
  return `${(m / 1000).toFixed(1)} km`;
}

export function formatDuration(seconds: number): string {
  const mins = Math.ceil(seconds / 60);
  if (mins < 1) return '< 1 phút';
  return `${mins} phút`;
}

export function instructionText(icon: TurnIcon, distance: number): string {
  const d = formatDistance(distance);
  switch (icon) {
    case 'straight': return distance < 10 ? 'Tiếp tục đi thẳng' : `Đi thẳng ${d}`;
    case 'slight-left': return distance < 10 ? 'Rẽ chếch sang trái' : `Rẽ nhẹ trái sau ${d}`;
    case 'slight-right': return distance < 10 ? 'Rẽ chếch sang phải' : `Rẽ nhẹ phải sau ${d}`;
    case 'left': return distance < 10 ? 'Rẽ trái ngay bây giờ' : `Rẽ trái sau ${d}`;
    case 'right': return distance < 10 ? 'Rẽ phải ngay bây giờ' : `Rẽ phải sau ${d}`;
    case 'sharp-left': return distance < 10 ? 'Cua gấp sang trái' : `Cua gấp trái sau ${d}`;
    case 'sharp-right': return distance < 10 ? 'Cua gấp sang phải' : `Cua gấp phải sau ${d}`;
    case 'uturn': return distance < 10 ? 'Quay đầu lại' : `Quay đầu sau ${d}`;
    case 'arrive': return 'Bạn đã đến điểm đích';
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
  if (!route || route.length < 2) return { distFromRoute: 0, distAlongRoute: 0 };
  let best = { distFromRoute: Infinity, distAlongRoute: 0 };
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
      best = { distFromRoute, distAlongRoute };
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
  const totalLengthRef = useRef(
    route && route.length > 1
      ? route.reduce((sum, p, i) => (i === 0 ? 0 : sum + distanceMeters(route[i - 1], p)), 0)
      : 0
  );

  useEffect(() => {
    turnsRef.current = buildTurnPoints(route);
    totalLengthRef.current = route && route.length > 1
      ? route.reduce((sum, p, i) => (i === 0 ? 0 : sum + distanceMeters(route[i - 1], p)), 0)
      : 0;
  }, [route]);

  const applyHeading = useCallback((newHeading: number, source: 'compass' | 'course') => {
    setState(prev => {
      if (prev.headingSource === 'course' && source === 'compass') return prev;
      return { ...prev, heading: newHeading, headingSource: source };
    });
    const diff = shortestAngleDiff(headingValueRef.current, newHeading);
    const target = headingValueRef.current + diff;
    headingValueRef.current = target;
    Animated.timing(animatedHeading, { toValue: target, duration: 250, useNativeDriver: true }).start();
  }, [animatedHeading]);

  useEffect(() => {
    let posSub: Location.LocationSubscription | undefined;
    let headSub: Location.LocationSubscription | undefined;
    let cancelled = false;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted' || cancelled) return;

      // 1. Theo dõi GPS tốc độ cao cho Navigation
      posSub = await Location.watchPositionAsync(
        {
          accuracy: isNavigating ? Location.Accuracy.BestForNavigation : Location.Accuracy.High,
          timeInterval: isNavigating ? 1000 : 2500,
          distanceInterval: isNavigating ? 1.5 : 3,
        },
        (loc) => {
          const pos: LatLng = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
          const snap = snapToRoute(pos, route);
          const nextTurn = turnsRef.current.find(t => t.distanceFromStart >= snap.distAlongRoute);
          const distanceToNextTurn = nextTurn ? nextTurn.distanceFromStart - snap.distAlongRoute : null;
          const arrived = !!nextTurn && nextTurn.icon === 'arrive' && (distanceToNextTurn ?? Infinity) < ARRIVE_THRESHOLD;
          const remainingMeters = Math.max(0, totalLengthRef.current - snap.distAlongRoute);
          // Tốc độ đi bộ trung bình ~1.2 m/s
          const estimatedSeconds = Math.round(remainingMeters / 1.2);

          setState(prev => ({
            ...prev,
            currentPosition: pos,
            progressMeters: snap.distAlongRoute,
            remainingMeters,
            estimatedSeconds,
            distanceToNextTurn,
            nextInstruction: nextTurn ? instructionText(nextTurn.icon, distanceToNextTurn ?? 0) : null,
            nextIcon: nextTurn?.icon ?? null,
            isOffRoute: route.length > 1 && snap.distFromRoute > OFF_ROUTE_THRESHOLD,
            arrived,
          }));

          // Khi di chuyển tốc độ > 0.4 m/s, ưu tiên dùng heading từ GPS course
          if (loc.coords.heading != null && loc.coords.heading >= 0 && (loc.coords.speed ?? 0) > 0.4) {
            applyHeading(loc.coords.heading, 'course');
          }
        }
      );

      // 2. Theo dõi la bàn từ tính (khi đứng yên)
      headSub = await Location.watchHeadingAsync((h) => {
        const heading = h.trueHeading >= 0 ? h.trueHeading : h.magHeading;
        applyHeading(heading, 'compass');
      });
    })();

    return () => {
      cancelled = true;
      posSub?.remove();
      headSub?.remove();
    };
  }, [route, isNavigating, applyHeading]);

  return { ...state, animatedHeading };
}
