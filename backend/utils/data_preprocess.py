import pandas as pd
import numpy as np

def clean_uploaded_data(file_path):
    # Read Excel/CSV depending on extension
    if file_path.endswith(".csv"):
        df = pd.read_csv(file_path)
    else:
        df = pd.read_excel(file_path)

    # Drop completely empty rows/columns
    df.dropna(how="all", inplace=True)
    df.dropna(axis=1, how="all", inplace=True)

    # ✅ Safely check if first row contains headers
    try:
        if df.iloc[0].astype(str).str.contains("county|date", case=False).any():
            df.columns = df.iloc[0]
            df = df[1:]
    except Exception:
        pass  # skip if non-string cells cause issues

    df.reset_index(drop=True, inplace=True)

    # ✅ Convert numeric-like columns safely (no deprecated errors='ignore')
    for col in df.columns:
        try:
            df[col] = pd.to_numeric(df[col])
        except Exception:
            pass  # keep non-numeric columns as-is

    # ✅ Detect and fix timestamp-like columns (nanoseconds or milliseconds)
    for col in df.columns:
        if pd.api.types.is_numeric_dtype(df[col]):
            max_val = df[col].max()
            if max_val > 1e15:  # nanoseconds
                df[col] = pd.to_datetime(df[col], unit="ns", errors="coerce")
            elif 1e12 < max_val < 1e15:  # milliseconds
                df[col] = pd.to_datetime(df[col], unit="ms", errors="coerce")

    # ✅ Replace any remaining NaNs with 0 or blanks for safety
    for col in df.columns:
        if pd.api.types.is_numeric_dtype(df[col]):
            df[col] = df[col].fillna(0)
        else:
            df[col] = df[col].fillna("")

    return df
