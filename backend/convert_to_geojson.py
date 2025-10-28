import geopandas as gpd
import os

# Path to your extracted shapefile folder
shapefile_folder = r"C:\Users\zico\Desktop\ken_adm_iebc_20191031_shp"
shapefile_name = "ken_adm_iebc_20191031_adm1.shp"  # ✅ actual .shp file

# Load shapefile
shp_path = os.path.join(shapefile_folder, shapefile_name)
gdf = gpd.read_file(shp_path)

# Optional: Check first few rows
print(gdf.head())

# Convert to GeoJSON
geojson_path = os.path.join(shapefile_folder, "kenya_counties.geojson")
gdf.to_file(geojson_path, driver="GeoJSON")

print(f"✅ GeoJSON saved to: {geojson_path}")
