import { API_BASE_URL, API_STATIC_DATA_URL } from '../api';

export async function fetchGeoJSON(endpoint: string, isStatic: boolean = true) {
  const baseUrl = isStatic ? API_STATIC_DATA_URL : API_BASE_URL;
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Lỗi tải dữ liệu từ: ${url}`);
  }
  return response.json();
}

export async function fetchBuildings() {
  return fetchGeoJSON('/vinhuni_buildings.geojson');
}

export async function fetchDepartments() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/departments`);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn("Lỗi tải departments từ API, fallback sang GeoJSON:", e);
  }
  
  try {
    return await fetchGeoJSON('/vinhuni_departments.geojson');
  } catch {
    return [];
  }
}

export async function fetchPaths() {
  try {
    return await fetchGeoJSON('/vinhuni_paths.geojson');
  } catch {
    return { type: "FeatureCollection", features: [] };
  }
}

export async function fetchWalkableAreas() {
  try {
    return await fetchGeoJSON('/vinhuni_walkable_areas.geojson');
  } catch {
    return { type: "FeatureCollection", features: [] };
  }
}