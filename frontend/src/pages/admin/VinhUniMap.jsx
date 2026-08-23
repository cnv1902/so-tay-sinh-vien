import React, { useState, useEffect, useRef } from 'react';
import Map, { Source, Layer, Marker, GeolocateControl } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Typography, Select, Card, Space, Button, message } from 'antd';
import { SearchOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { getMainApiUrl } from '../../config/api';

const { Title, Text } = Typography;

const calculateCentroid = (geometry) => {
  if (!geometry || !geometry.coordinates) return null;
  let coords = [];
  if (geometry.type === 'MultiPolygon') {
    coords = geometry.coordinates[0][0];
  } else if (geometry.type === 'Polygon') {
    coords = geometry.coordinates[0];
  } else {
    return null;
  }
  
  let sumLon = 0, sumLat = 0;
  coords.forEach(pt => {
    sumLon += pt[0];
    sumLat += pt[1];
  });
  return [sumLon / coords.length, sumLat / coords.length];
};

let cachedBuildingsPromise = null;
let cachedDepartmentsPromise = null;

export default function VinhUniMap() {
  const mapRef = useRef();
  const [buildingsGeojson, setBuildingsGeojson] = useState(null);
  const [departmentsGeojson, setDepartmentsGeojson] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [startPoint, setStartPoint] = useState(null);
  const [endPoint, setEndPoint] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [destinationInfo, setDestinationInfo] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  const getUserLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { longitude, latitude } = position.coords;
          setUserLocation([longitude, latitude]);
          if (mapRef.current) {
            mapRef.current.flyTo({ center: [longitude, latitude], zoom: 17 });
          }
        },
        (error) => {
          message.error('Vui lòng cấp quyền truy cập vị trí để sử dụng tính năng này!');
        },
        { enableHighAccuracy: true }
      );
    } else {
      message.error('Trình duyệt của bạn không hỗ trợ định vị GPS!');
    }
  };

  const mapStyle = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

  const initialViewState = {
    longitude: 105.696,
    latitude: 18.659,
    zoom: 16.5,
    pitch: 60,
    bearing: -20
  };

  useEffect(() => {
    // Load buildings geojson
    if (!cachedBuildingsPromise) {
      cachedBuildingsPromise = fetch(`${getMainApiUrl()}/static/data/vinhuni_buildings.geojson`).then(r => r.json());
    }
    cachedBuildingsPromise
      .then(data => {
        setBuildingsGeojson(data);
      })
      .catch(e => {
        console.error("Error loading buildings", e);
        cachedBuildingsPromise = null;
      });

    // Load departments geojson
    if (!cachedDepartmentsPromise) {
      cachedDepartmentsPromise = fetch(`${getMainApiUrl()}/static/data/vinhuni_departments.geojson`).then(r => r.json());
    }
    cachedDepartmentsPromise
      .then(data => {
        setDepartmentsGeojson(data);
        const uniqueDepartments = [];
        const seenNames = new Set();
        data.features.forEach(f => {
          const name = f.properties?.name;
          if (name && !seenNames.has(name)) {
            seenNames.add(name);
            uniqueDepartments.push({
              value: name,
              label: name,
              centroid: f.geometry.coordinates,
              feature: f
            });
          }
        });
        setDepartments([
          { value: 'MY_LOCATION', label: '📍 Vị trí của bạn' },
          ...uniqueDepartments
        ]);
      })
      .catch(e => {
        console.error("Error loading departments", e);
        cachedDepartmentsPromise = null;
      });
  }, []);

  useEffect(() => {
    if (startPoint && endPoint) {
      let startCoords = null;
      if (startPoint === 'MY_LOCATION') {
        if (!userLocation) return; // Wait until location is fetched
        startCoords = userLocation;
      } else {
        const s = departments.find(b => b.value === startPoint);
        startCoords = s ? s.centroid : null;
      }
      
      const e = departments.find(b => b.value === endPoint);
      if (startCoords && e && e.centroid) {
        // Backend takes start=lat,lng&end=lat,lng
        const startParam = `${startCoords[1]},${startCoords[0]}`;
        const endParam = `${e.centroid[1]},${e.centroid[0]}`;
        
        fetch(`${getMainApiUrl()}/api/admin/map/route?start=${startParam}&end=${endParam}`)
          .then(async (res) => {
            if (!res.ok) {
              const text = await res.text();
              throw new Error("API returned: " + text);
            }
            return res.json();
          })
          .then(data => {
            setRouteData(data);
            if (mapRef.current && data.geometry && data.geometry.coordinates.length > 0) {
              setDestinationInfo(e.feature?.properties || null);
              const coords = data.geometry.coordinates;
              const lons = coords.map(c => c[0]);
              const lats = coords.map(c => c[1]);
              mapRef.current.fitBounds([
                [Math.min(...lons), Math.min(...lats)],
                [Math.max(...lons), Math.max(...lats)]
              ], { padding: 60, duration: 1500 });
            }
          })
          .catch(err => {
            message.error("Không tìm thấy đường đi nội bộ!");
            setRouteData(null);
            setDestinationInfo(null);
          });
      }
    } else {
      setRouteData(null);
      setDestinationInfo(null);
    }
  }, [startPoint, endPoint, departments, userLocation]);

  const extrusionLayer = {
    id: '3d-buildings',
    type: 'fill-extrusion',
    source: 'vinhuni_buildings',
    paint: {
      'fill-extrusion-color': [
        'case',
        ['in', ['get', 'name'], ['literal', [startPoint || '', endPoint || '']]], '#FBBF24',
        ['get', 'color']
      ],
      'fill-extrusion-height': ['get', 'height'],
      'fill-extrusion-base': 0,
      'fill-extrusion-opacity': 0.8
    }
  };

  const routeOutlineLayer = {
    id: 'route-outline-layer',
    type: 'line',
    source: 'route-source',
    paint: {
      'line-color': '#FFFFFF',
      'line-width': 8,
      'line-opacity': 0.8,
    },
    layout: {
      'line-join': 'round',
      'line-cap': 'round'
    }
  };

  const routeLayer = {
    id: 'route-layer',
    type: 'line',
    source: 'route-source',
    paint: {
      'line-color': '#10B981', // Xanh ngọc nổi bật
      'line-width': 4,
      'line-opacity': 0.9,
    },
    layout: {
      'line-join': 'round',
      'line-cap': 'round'
    }
  };

  const departmentsLayer = {
    id: 'departments-layer',
    type: 'symbol',
    source: 'vinhuni_departments',
    filter: [
      'all',
      ['==', ['get', 'is_building'], 0],
      ['in', ['get', 'name'], ['literal', [startPoint || '', endPoint || '']]]
    ],
    layout: {
      'text-field': '{name}',
      'text-size': 13,
      'text-anchor': 'bottom',
      'text-offset': [0, -0.5]
    },
    paint: {
      'text-color': '#EF4444',
      'text-halo-color': '#FFFFFF',
      'text-halo-width': 2
    }
  };

  const buildingsLabelLayer = {
    id: 'buildings-label-layer',
    type: 'symbol',
    source: 'vinhuni_buildings',
    filter: ['==', ['get', 'is_building'], 1],
    layout: {
      'text-field': '{name}',
      'text-size': 13,
      'text-anchor': 'center'
    },
    paint: {
      'text-color': '#111827',
      'text-halo-color': '#FFFFFF',
      'text-halo-width': 2
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ marginBottom: '16px' }}>
        <Title level={4} style={{ margin: 0, color: 'var(--text-main)' }}>Bản đồ Định tuyến Đại học Vinh</Title>
      </div>
      <div style={{ flex: 1, minHeight: 'calc(100vh - 140px)', position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid #d9d9d9' }}>
        
        <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 10, width: 320 }}>
          <Card size="small" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderRadius: 8 }}>
            <Space orientation="vertical" style={{ width: '100%' }} size="middle">
              <div>
                <Text strong style={{ fontSize: 13 }}><EnvironmentOutlined style={{ color: '#10B981' }}/> Điểm xuất phát</Text>
                <Select
                  showSearch
                  allowClear
                  style={{ width: '100%', marginTop: 4 }}
                  placeholder="Chọn điểm xuất phát"
                  options={departments}
                  value={startPoint}
                  onChange={(val) => {
                    setStartPoint(val);
                    if (val === 'MY_LOCATION') {
                      getUserLocation();
                    }
                  }}
                  filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                />
              </div>
              <div>
                <Text strong style={{ fontSize: 13 }}><EnvironmentOutlined style={{ color: '#EF4444' }}/> Điểm đến</Text>
                <Select
                  showSearch
                  allowClear
                  style={{ width: '100%', marginTop: 4 }}
                  placeholder="Chọn điểm cần đến"
                  options={departments}
                  value={endPoint}
                  onChange={setEndPoint}
                  filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                />
              </div>
            </Space>
          </Card>
        </div>

        {destinationInfo && (
          <div style={{ position: 'absolute', bottom: 32, left: 16, zIndex: 10, width: 320 }}>
            <Card size="small" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderRadius: 8, borderLeft: '4px solid #10B981' }}>
              <Title level={5} style={{ margin: 0 }}>{destinationInfo.name}</Title>
              {destinationInfo.floor && <Text type="secondary" style={{ display: 'block' }}>Tầng: {destinationInfo.floor}</Text>}
              {destinationInfo.note && <Text style={{ display: 'block', marginTop: 4 }}>{destinationInfo.note}</Text>}
            </Card>
          </div>
        )}

        <Map
          ref={mapRef}
          mapLib={maplibregl}
          initialViewState={initialViewState}
          mapStyle={mapStyle}
          style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
        >
          {routeData && (
            <Source id="route-source" type="geojson" data={routeData}>
              <Layer {...routeOutlineLayer} />
              <Layer {...routeLayer} />
            </Source>
          )}

          {userLocation && (
            <Marker longitude={userLocation[0]} latitude={userLocation[1]} anchor="center">
              <div style={{
                width: '16px', height: '16px', backgroundColor: '#3B82F6',
                borderRadius: '50%', border: '3px solid white',
                boxShadow: '0 0 10px rgba(0,0,0,0.3)'
              }} />
            </Marker>
          )}
          
          <GeolocateControl position="bottom-right" />

          {buildingsGeojson && (
            <Source id="vinhuni_buildings" type="geojson" data={buildingsGeojson}>
              <Layer {...extrusionLayer} />
              <Layer {...buildingsLabelLayer} />
            </Source>
          )}
          
          {departmentsGeojson && (
            <Source id="vinhuni_departments" type="geojson" data={departmentsGeojson}>
              <Layer {...departmentsLayer} />
            </Source>
          )}
        </Map>
      </div>
    </div>
  );
}
