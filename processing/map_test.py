# download oproad_gb.gpkg from https://osdatahub.os.uk/data/downloads/open/OpenRoads

import geopandas as gpd
import requests
import json
from pathlib import Path

# Configuration
script_folder = Path(__file__).resolve().parent
gpkg_path = script_folder / "oproad_gb.gpkg"

postcode = input("Enter a UK postcode: ").strip()
half_size = 500  # 500 m in each direction

# Look up postcode in British National Grid
url = f"https://api.postcodes.io/postcodes/{requests.utils.quote(postcode)}"
response = requests.get(url, timeout=15)
response.raise_for_status()

result = response.json().get("result")
if not result:
    raise ValueError("Postcode not found.")

easting = result["eastings"]
northing = result["northings"]

if easting is None or northing is None:
    raise ValueError("Postcode has no British National Grid coordinates.")

# Bounding box
min_x = easting - half_size
max_x = easting + half_size
min_y = northing - half_size
max_y = northing + half_size

# Load only roads within the selected area
roads = gpd.read_file(
    gpkg_path,
    layer="road_link",
    engine="pyogrio",
    bbox=(min_x, min_y, max_x, max_y),
)

# Convert road geometries into local game coordinates
features = []

for geom in roads.geometry:
    if geom is None or geom.is_empty:
        continue

    # Handle both LineString and MultiLineString
    lines = [geom] if geom.geom_type == "LineString" else (
        list(geom.geoms) if geom.geom_type == "MultiLineString" else []
    )

    for line in lines:
        points = [
            [
                round(x - min_x, 2),
                round(max_y - y, 2),
            ]
            for x, y in line.coords
        ]

        if len(points) >= 2:
            features.append(points)

# Save game-ready JSON
game_map = {
    "width": max_x - min_x,
    "height": max_y - min_y,
    "roads": features,
}

output_path = script_folder / "road_maze.json"
with open(output_path, "w") as f:
    json.dump(game_map, f, separators=(",", ":"))

print(f"Exported {len(features)} road segments to {output_path}")