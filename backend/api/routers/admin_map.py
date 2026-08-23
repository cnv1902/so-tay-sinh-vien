from fastapi import APIRouter, HTTPException, Query
from core.map_engine import map_engine

router = APIRouter(
    prefix="/map",
    tags=["Admin Map"]
)

@router.get("/route")
def get_map_route(
    start: str = Query(..., description="Tọa độ điểm bắt đầu dạng lat,lng (Ví dụ: 18.659,105.696)"),
    end: str = Query(..., description="Tọa độ điểm kết thúc dạng lat,lng (Ví dụ: 18.660,105.697)")
):
    try:
        start_lat, start_lng = map(float, start.split(","))
        end_lat, end_lng = map(float, end.split(","))
    except ValueError:
        raise HTTPException(status_code=400, detail="Định dạng tọa độ không hợp lệ. Vui lòng truyền theo dạng lat,lng")
        
    try:
        route_geojson = map_engine.find_route(start_lat, start_lng, end_lat, end_lng)
        return route_geojson
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))
