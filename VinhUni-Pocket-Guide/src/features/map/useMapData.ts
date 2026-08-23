import { useEffect, useState } from 'react';

import {
  fetchBuildings,
  fetchDepartments,
  fetchPaths,
  fetchWalkableAreas,
} from '../../services/locations/geojsonService';

type MapData = {
  buildings: any;
  departments: any;
  paths: any;
  walkableAreas: any;
};

export function useMapData() {
  const [data, setData] = useState<MapData>({
    buildings: null,
    departments: null,
    paths: null,
    walkableAreas: null,
  });

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(
    null,
  );

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);

        const [
          buildings,
          departments,
          paths,
          walkableAreas,
        ] = await Promise.all([
          fetchBuildings(),
          fetchDepartments(),
          fetchPaths(),
          fetchWalkableAreas(),
        ]);

        if (!mounted) {
          return;
        }

        setData({
          buildings,
          departments,
          paths,
          walkableAreas,
        });

        setError(null);
      } catch (err) {
        if (!mounted) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : 'Không thể tải dữ liệu bản đồ.',
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  return {
    ...data,
    loading,
    error,
  };
}