from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import pandas as pd
from utils.data_preprocess import clean_uploaded_data
from models.forecast_model import generate_forecast
import json
import geopandas as gpd

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER


# --------------------------------------------
# 🟢 Route: Upload Excel/CSV File
# --------------------------------------------
@app.route("/upload", methods=["POST"])
def upload_file():
    file = request.files.get("file")
    if not file:
        return jsonify({"error": "No file uploaded"}), 400

    file_path = os.path.join(app.config["UPLOAD_FOLDER"], file.filename)
    file.save(file_path)
    print(f"Saved file to: {file_path}")

    try:
        # Attempt to read and clean the file
        df = clean_uploaded_data(file_path)
        print("DataFrame head:\n", df.head())
        columns = list(df.columns)
        preview = df.head(10).to_dict(orient="records")
        return jsonify({
            "columns": columns,
            "preview": preview
        })
    except Exception as e:
        import traceback
        traceback.print_exc()  # <-- full error printed in console
        return jsonify({"error": str(e)}), 500



# --------------------------------------------
# 🟣 Route: Generate Chart Data (per-county support)
# --------------------------------------------
@app.route("/visualize", methods=["POST"])
def visualize_data():
    import traceback

    try:
        data = request.get_json(force=True)
        file_path = data.get("file_path")
        x_column = data.get("x_column")
        y_column = data.get("y_column")

        print("\n[🟣 /visualize] Incoming request:")
        print(f"  file_path: {file_path}")
        print(f"  x_column: {x_column}")
        print(f"  y_column: {y_column}")

        if not file_path or not os.path.exists(file_path):
            msg = f"File not found or invalid path: {file_path}"
            print("[❌ ERROR]", msg)
            return jsonify({"error": msg}), 400

        print("[ℹ️] Cleaning uploaded data...")
        df = clean_uploaded_data(file_path)
        print("[✅] Data cleaned successfully. Columns:", df.columns.tolist())
        print("[📊] DataFrame sample:\n", df.head().to_string(index=False))

        if x_column not in df.columns or y_column not in df.columns:
            msg = f"Invalid column(s). Available: {df.columns.tolist()}"
            print("[❌ ERROR]", msg)
            return jsonify({"error": msg}), 400

        # ✅ Sort by X (time) if numeric or datetime
        if pd.api.types.is_datetime64_any_dtype(df[x_column]) or "date" in x_column.lower():
            df[x_column] = pd.to_datetime(df[x_column], errors="coerce")
            df = df.sort_values(by=x_column)

        # ✅ Multi-county logic
        if "county" in df.columns:
            print("[🧭] Grouping data by county...")
            grouped_data = {}
            for county, group in df.groupby("county"):
                grouped_data[county] = {
                    "x": group[x_column].astype(str).tolist(),
                    "y": group[y_column].tolist(),
                }
            print(f"[✅] Prepared multi-county chart for {len(grouped_data)} counties.")
            return jsonify({"multi_series": grouped_data})

        # ✅ Fallback: single chart
        chart_data = {
            "x": df[x_column].astype(str).tolist(),
            "y": df[y_column].tolist(),
        }

        print("[✅] Single-series chart prepared.")
        print(f"  X sample: {chart_data['x'][:5]}")
        print(f"  Y sample: {chart_data['y'][:5]}")

        return jsonify(chart_data)

    except Exception as e:
        print("\n[🔥 Exception in /visualize]")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# --------------------------------------------
#  Route: Forecast Endpoint (Rolling + Longterm)
# --------------------------------------------
@app.route("/forecast", methods=["POST"])
def forecast():
    data = request.get_json()
    file_path = data.get("file_path")
    column = data.get("column")
    periods = int(data.get("periods", 30))
    mode = data.get("mode", "longterm")  # <-- NEW: rolling or longterm

    try:
        df = clean_uploaded_data(file_path)

        if "county" not in df.columns:
            return jsonify({"error": "Missing 'county' column"}), 400
        if column not in df.columns:
            return jsonify({"error": f"Column '{column}' not found"}), 400

        from models.forecast_model import generate_forecast
        all_forecasts = []

        for county, group in df.groupby("county"):
            forecast_df = generate_forecast(
                group,
                column=column,
                model_type=data.get("model_type", "prophet"),
                periods=periods,
                mode=mode
            )
            forecast_df["county"] = county
            all_forecasts.append(forecast_df)

        combined = pd.concat(all_forecasts, ignore_index=True)

        # Grouped response per county
        grouped = (
            combined.groupby("county")
            .apply(lambda g: g.to_dict(orient="records"))
            .to_dict()
        )

        return jsonify({"forecast": grouped, "mode": mode})

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

    
    # -----------------------------
# MAP DATA FOR GEOSPATIAL VIEW
# -----------------------------
@app.route("/mapdata", methods=["POST"])
def map_data():
    """
    Expects a JSON payload with:
    {
        "filename": "uploaded_file.xlsx",
        "value_column": "number of infected",
        "region_column": "county"
    }
    Returns GeoJSON-ready data with values per region.
    """
    try:
        data = request.get_json()
        file_path = f"uploads/{data['filename']}"
        value_col = data['value_column']
        region_col = data['region_column']

        # Load health data
        df = pd.read_excel(file_path)
        # Clean df (drop empty rows)
        df = df[[region_col, value_col]].dropna()

        # Load Kenya counties GeoJSON
        kenya_map = gpd.read_file("geojson/kenya_counties.geojson")

        # Merge data with GeoJSON
        merged = kenya_map.merge(df, left_on="NAME_1", right_on=region_col, how="left")
        merged.fillna(0, inplace=True)  # Set missing counties to 0

        # Convert to GeoJSON format for Plotly/Leaflet
        geojson_data = json.loads(merged.to_json())

        return jsonify({"geojson": geojson_data})

    except Exception as e:
        print("Error generating map data:", e)
        return jsonify({"error": str(e)}), 500
    
if __name__ == "__main__":
    app.run(debug=True)
   

