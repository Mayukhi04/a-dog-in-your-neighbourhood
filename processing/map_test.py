# download oproad_gb.gpkg from https://osdatahub.os.uk/data/downloads/open/OpenRoads

import argparse
import json
from pathlib import Path

import geopandas as gpd
import requests
from shapely.geometry import box


def parse_args():
    parser = argparse.ArgumentParser(description="Generate a road maze JSON for a UK postcode.")
    parser.add_argument("postcode", nargs="?", default=None, help="UK postcode to generate a map for")
    parser.add_argument(
        "--output",
        default=None,
        help="Optional output path for the generated JSON. Defaults to the existing project map file.",
    )
    return parser.parse_args()


args = parse_args()
postcode = (args.postcode or input("Enter a UK postcode: ")).strip()

# Configuration
script_folder = Path(__file__).resolve().parent
gpkg_path = script_folder / "oproad_gb.gpkg"

# Physical aspect ratio of the cut-out: 62 mm x 46 mm
cutout_width_mm = 62
cutout_height_mm = 46
aspect_ratio = cutout_width_mm / cutout_height_mm

# Geographic dimensions in metres
map_width = 1000
map_height = map_width / aspect_ratio

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

# Define a rectangular bounding box centred on the postcode
half_width = map_width / 2
half_height = map_height / 2

min_x = easting - half_width
max_x = easting + half_width
min_y = northing - half_height
max_y = northing + half_height

# Load roads intersecting the rectangular area
roads = gpd.read_file(
    gpkg_path,
    layer="road_link",
    engine="pyogrio",
    bbox=(min_x, min_y, max_x, max_y),
)

# Clip roads to the exact rectangular boundary
cutout = box(min_x, min_y, max_x, max_y)
roads["geometry"] = roads.geometry.intersection(cutout)

# Remove empty geometries
roads = roads[
    roads.geometry.notna() & ~roads.geometry.is_empty
]

# Convert clipped roads to local game coordinates
features = []

for geom in roads.geometry:
    if geom.geom_type == "LineString":
        lines = [geom]
    elif geom.geom_type == "MultiLineString":
        lines = list(geom.geoms)
    elif geom.geom_type == "GeometryCollection":
        lines = [
            part for part in geom.geoms
            if part.geom_type == "LineString"
        ]
    else:
        continue

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
    "width": map_width,
    "height": round(map_height, 2),
    "roads": features,
}

if args.output:
    output_path = Path(args.output)
else:
    output_path = script_folder / "../a-dog-in-your-neighbourhood/public/road_maze.json"

output_path.parent.mkdir(parents=True, exist_ok=True)

with open(output_path, "w") as f:
    json.dump(game_map, f, separators=(",", ":"))

print(f"Exported {len(features)} road segments to {output_path}")
print(f"Map dimensions: {map_width} m x {map_height:.2f} m")
print(f"Aspect ratio: {cutout_width_mm}:{cutout_height_mm}")
