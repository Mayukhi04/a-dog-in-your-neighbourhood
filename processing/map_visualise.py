
import json
from pathlib import Path

import matplotlib.pyplot as plt
from matplotlib.collections import LineCollection

# Load the exported road maze
script_folder = Path(__file__).resolve().parent
json_path = script_folder / "road_maze.json"

with open(json_path, "r") as f:
    maze = json.load(f)

width = maze["width"]
height = maze["height"]
roads = maze["roads"]

# Convert road paths into line segments for efficient plotting
line_collection = LineCollection(
    roads,
    colors="white",
    linewidths=1.2,
)

# Plot
fig, ax = plt.subplots(figsize=(12, 12))
fig.patch.set_facecolor("black")
ax.set_facecolor("black")

ax.add_collection(line_collection)
ax.set_xlim(0, width)
ax.set_ylim(0, height)
ax.set_aspect("equal")
ax.set_axis_off()

plt.tight_layout(pad=0)
plt.show()

print(f"Map dimensions: {width} m × {height} m")
print(f"Road segments: {len(roads)}")
