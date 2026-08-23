import re
import httpx

async def extract_lat_lng(url: str) -> tuple[float, float]:
    """
    Extracts latitude and longitude from a Google Maps URL,
    including short links (maps.app.goo.gl) which require following redirects.
    """
    if not url: 
        return 0.0, 0.0
    
    if not url.startswith("http"): 
        url = "https://" + url
    
    try:
        # Resolve short URLs by following redirects
        async with httpx.AsyncClient(follow_redirects=True, timeout=10.0) as client:
            response = await client.get(url)
            final_url = str(response.url)
            
            # Priority 1: Exact coordinates from !3d and !4d
            match_3d4d = re.search(r'!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)', final_url)
            if match_3d4d: 
                return float(match_3d4d.group(1)), float(match_3d4d.group(2))
            
            # Priority 2: Viewport coordinates after @
            match_at = re.search(r'@(-?\d+\.\d+),(-?\d+\.\d+)', final_url)
            if match_at: 
                return float(match_at.group(1)), float(match_at.group(2))
            
    except Exception:
        # Ignore network errors or parsing errors and return 0.0, 0.0
        pass
    
    return 0.0, 0.0
