import json
import networkx as nx
from scipy.spatial import KDTree
import math
import numpy as np
from shapely.geometry import shape, Point, Polygon, LineString, GeometryCollection
from shapely.ops import unary_union
import os
import pickle

class MapEngine:
    def __init__(self):
        self.G = nx.Graph()
        self.kd_tree = None
        self.node_list = []
        self.is_initialized = False

    def haversine(self, lon1, lat1, lon2, lat2):
        R = 6371000  # radius of Earth in meters
        phi_1, phi_2 = math.radians(lat1), math.radians(lat2)
        delta_phi = math.radians(lat2 - lat1)
        delta_lambda = math.radians(lon2 - lon1)
        a = math.sin(delta_phi / 2.0) ** 2 + math.cos(phi_1) * math.cos(phi_2) * math.sin(delta_lambda / 2.0) ** 2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c

    def load_graph(self, geojson_path: str, walkable_path: str = None, buildings_path: str = None):
        print(f"Loading GeoJSON from {geojson_path} and building graph...")
        try:
            cache_path = geojson_path + ".pkl"
            
            # Kiểm tra thời gian sửa đổi file để quyết định có dùng cache hay không
            use_cache = False
            if os.path.exists(cache_path):
                cache_mtime = os.path.getmtime(cache_path)
                use_cache = True
                for p in filter(None, [geojson_path, walkable_path, buildings_path]):
                    if os.path.exists(p) and os.path.getmtime(p) > cache_mtime:
                        use_cache = False
                        break
                        
            if use_cache:
                print(f"Loading cached graph from {cache_path}...")
                with open(cache_path, "rb") as f:
                    cached_data = pickle.load(f)
                    self.G, self.kd_tree, self.node_list = cached_data
                self.is_initialized = True
                print(f"Map Graph loaded from cache successfully with {len(self.node_list)} nodes and {len(self.G.edges())} edges.")
                return

            # 1. ĐỌC WALKABLE AREA TRƯỚC ĐỂ LÀM KHUÔN CẮT
            walkable_polygons = []
            walkable_union = None
            
            if walkable_path and os.path.exists(walkable_path):
                print(f"Loading walkable areas from {walkable_path}...")
                with open(walkable_path, "r", encoding="utf-8") as f:
                    walkable_geojson = json.load(f)
                for feature in walkable_geojson.get("features", []):
                    geometry = feature.get("geometry")
                    if geometry and geometry.get("type") in ["Polygon", "MultiPolygon"]:
                        walkable_polygons.append(shape(geometry))
            
            if walkable_polygons:
                walkable_union = unary_union(walkable_polygons)

            # 2. ĐỌC TÒA NHÀ & ĐỤC LỖ (BOOLEAN DIFFERENCE)
            buildings = []
            if buildings_path and os.path.exists(buildings_path):
                print(f"Loading buildings from {buildings_path}...")
                with open(buildings_path, "r", encoding="utf-8") as f:
                    buildings_geojson = json.load(f)
                for feature in buildings_geojson.get("features", []):
                    geometry = feature.get("geometry")
                    if geometry and geometry.get("type") in ["Polygon", "MultiPolygon"]:
                        b_shape = shape(geometry)
                        
                        # CHÌA KHÓA: Lấy tòa nhà trừ đi vùng đi bộ (Khoét lỗ các khe hẹp xuyên tòa)
                        if walkable_union:
                            b_shape = b_shape.difference(walkable_union)
                            
                        # Lưu lại các mảng khối nhà sau khi cắt (bỏ qua nếu bị cắt hết)
                        if not b_shape.is_empty:
                            if b_shape.geom_type in ['Polygon', 'MultiPolygon']:
                                buildings.append(b_shape)
                            elif b_shape.geom_type == 'GeometryCollection':
                                for sub_geom in b_shape.geoms:
                                    if sub_geom.geom_type in ['Polygon', 'MultiPolygon']:
                                        buildings.append(sub_geom)

            # 3. BỘ LỌC VA CHẠM THÔNG MINH MỚI
            from shapely.strtree import STRtree
            
            tree = None
            if buildings:
                tree = STRtree(buildings)

            def is_line_colliding_with_buildings(p1, p2):
                if not buildings or not tree:
                    return False
                line = LineString([p1, p2])
                possible_matches = tree.query(line)
                for idx in possible_matches:
                    building = buildings[idx]
                    intersection = line.intersection(building)
                    # Chỉ coi là đâm xuyên tường nếu phần chìm vào tòa nhà dài hơn 10cm (1e-6)
                    # Điều này cho phép đường đi đi bám sát mép tường mà không bị xóa!
                    if not intersection.is_empty and intersection.length > 1e-6:
                        return True
                return False

            with open(geojson_path, "r", encoding="utf-8") as f:
                geojson = json.load(f)

            # 4. LOAD BASE PATHS (Tuyệt đối tin tưởng đường bạn tự vẽ, không check va chạm)
            for feature in geojson.get("features", []):
                geometry = feature.get("geometry")
                if not geometry or geometry.get("type") != "LineString":
                    continue
                coords = feature["geometry"]["coordinates"]
                for i in range(len(coords) - 1):
                    p1, p2 = tuple(coords[i]), tuple(coords[i+1])
                    dist = self.haversine(p1[0], p1[1], p2[0], p2[1])
                    self.G.add_edge(p1, p2, weight=dist)

            # 5. GENERATE GRID (HẠ STEP XUỐNG ĐỂ CHUI LỌT KHE HẸP)
            if walkable_polygons:
                # 0.000015 = ~1.5 mét (Đảm bảo khe hẹp nhất vẫn có node)
                step = 0.000015 
                
                for poly in walkable_polygons:
                    minx, miny, maxx, maxy = poly.bounds
                    x_coords = np.arange(minx, maxx, step)
                    y_coords = np.arange(miny, maxy, step)

                    grid_dict = {}
                    for ix, x in enumerate(x_coords):
                        for iy, y in enumerate(y_coords):
                            p = Point(x, y)
                            if poly.contains(p):
                                node = (float(x), float(y))
                                grid_dict[(ix, iy)] = node
                                self.G.add_node(node)

                    # Nối lưới 8 hướng an toàn
                    directions = [(0,1), (1,0), (0,-1), (-1,0), (1,1), (-1,1), (1,-1), (-1,-1)]
                    for (ix, iy), u in grid_dict.items():
                        for dx, dy in directions:
                            nx_ix, nx_iy = ix + dx, iy + dy
                            if (nx_ix, nx_iy) in grid_dict:
                                v = grid_dict[(nx_ix, nx_iy)]
                                if not self.G.has_edge(u, v):
                                    if not is_line_colliding_with_buildings(u, v):
                                        dist = self.haversine(u[0], u[1], v[0], v[1])
                                        self.G.add_edge(u, v, weight=dist)

            self.node_list = list(self.G.nodes())

            # 6. SNAP RÌA ĐỂ NỐI MẠNG CHUNG (CỨU CÁC ĐẢO CÔ LẬP)
            if self.node_list:
                temp_tree = KDTree(self.node_list)
                for u in self.node_list:
                    # R = 0.000035 (~ 3.5 mét). 
                    # Bán kính này đủ ngắn để không nhảy tắt qua thảm cỏ, 
                    # nhưng đủ dài để nối điểm trong lưới ra lối đi kề bên!
                    indices = temp_tree.query_ball_point(u, r=0.000035)
                    for idx in indices:
                        v = self.node_list[idx]
                        if u != v and not self.G.has_edge(u, v):
                            if not is_line_colliding_with_buildings(u, v):
                                dist = self.haversine(u[0], u[1], v[0], v[1])
                                if dist > 0:
                                    self.G.add_edge(u, v, weight=dist)

            if not self.node_list:
                print("Warning: Map Graph has no nodes.")
                return

            self.kd_tree = KDTree(self.node_list)
            self.is_initialized = True
            
            print("Saving graph to cache...")
            with open(cache_path, "wb") as f:
                pickle.dump((self.G, self.kd_tree, self.node_list), f)
                
            print(f"Map Graph built successfully with {len(self.node_list)} nodes and {len(self.G.edges())} edges.")
        except Exception as e:
            print(f"Error building Map Graph: {e}")

    def find_route(self, start_lat: float, start_lng: float, end_lat: float, end_lng: float):
        if not self.is_initialized:
            raise Exception("Map engine is not initialized.")

        # KDTree uses (lon, lat) because node_list is (lon, lat)
        _, start_idx = self.kd_tree.query([start_lng, start_lat])
        _, end_idx = self.kd_tree.query([end_lng, end_lat])

        start_node = self.node_list[start_idx]
        end_node = self.node_list[end_idx]

        try:
            path = nx.shortest_path(self.G, source=start_node, target=end_node, weight="weight")
            return {
                "type": "Feature",
                "properties": {
                    "start": start_node,
                    "end": end_node
                },
                "geometry": {
                    "type": "LineString",
                    "coordinates": path
                }
            }
        except nx.NetworkXNoPath:
            raise Exception("No route found between the points")

map_engine = MapEngine()