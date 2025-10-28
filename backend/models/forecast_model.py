import pandas as pd
from prophet import Prophet
from neuralprophet import NeuralProphet

def generate_forecast(df, column, model_type="prophet", periods=30, mode="longterm"):
    """
    Generates forecasts using Prophet or NeuralProphet.
    Modes:
      - longterm / standalone → forecast future (e.g. next year)
      - rolling / interleaved / short → simulate month-by-month next-step prediction
    """
    df = df.reset_index(drop=True)
    df.columns = [c.lower().replace(" ", "_") for c in df.columns]

    # Identify date/time column
    date_col = df.columns[0]
    df.rename(columns={date_col: "ds", column: "y"}, inplace=True)
    df["ds"] = pd.to_datetime(df["ds"], errors="coerce")
    df.dropna(subset=["ds"], inplace=True)
    df = df.sort_values("ds")

    # Normalize mode name
    mode = mode.lower()
    if mode in ["standalone", "longterm"]:
        mode = "longterm"
    elif mode in ["interleaved", "rolling", "short"]:
        mode = "rolling"
    else:
        raise ValueError(f"Unsupported forecast mode: {mode}")

    # Helper to initialize model fresh each iteration
    def _init_model():
        if model_type == "neuralprophet":
            return NeuralProphet(), "yhat1"
        return Prophet(), "yhat"

    # --- LONGTERM (standard Prophet forecast) ---
    if mode == "longterm":
        model, yhat_col = _init_model()
        model.fit(df)
        future = model.make_future_dataframe(periods=periods, freq="MS")
        forecast = model.predict(future)
        forecast["actual"] = None
        forecast.loc[forecast["ds"].isin(df["ds"]), "actual"] = df["y"].values
        return forecast[["ds", yhat_col, "actual"]]

    # --- ROLLING (step-by-step next-month) ---
    elif mode == "rolling":
        forecasts = []
        unique_dates = df["ds"].drop_duplicates().sort_values().to_list()
        step = 1  # one-month ahead

        for i in range(len(unique_dates) - step):
            cutoff = unique_dates[i]
            next_date = unique_dates[i + step]
            train_df = df[df["ds"] <= cutoff]

            # must have some minimum history
            if len(train_df) < 6:
                continue

            model, yhat_col = _init_model()
            model.fit(train_df)

            # we manually predict exactly the next known date
            future_df = pd.DataFrame({"ds": [next_date]})
            fc = model.predict(future_df)

            pred = fc.iloc[-1:][["ds", yhat_col]].copy()
            pred["actual"] = None
            if next_date in df["ds"].values:
                pred["actual"] = df.loc[df["ds"] == next_date, "y"].values[0]
            forecasts.append(pred)

        if forecasts:
            result = pd.concat(forecasts, ignore_index=True)
        else:
            result = pd.DataFrame(columns=["ds", "yhat", "actual"])

        return result
