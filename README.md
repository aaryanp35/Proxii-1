# Proxii Travel (Streamlit)

Proxii Travel is a Python Streamlit app that scores destinations by neighborhood vibe using Google Maps Places signals and persona-based weighting.

## Run Locally

1. Install dependencies:

```bash
python3 -m pip install -r requirements_streamlit.txt
```

2. Set your Google Maps API key:

```bash
export MAPS_API_KEY=your_google_maps_api_key
```

3. Start the app:

```bash
streamlit run proxii_travel/app.py
```

## Included Files

- `proxii_travel/app.py`: Main Streamlit application
- `requirements_streamlit.txt`: Python dependencies
- `.env.example`: Environment variable template
