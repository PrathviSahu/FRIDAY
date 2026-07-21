"""
FRIDAY Weather Service
Fetches live weather data using Open-Meteo (no API key required).
Defaults to user's IP-based location or fallback coordinates.
"""
import urllib.request
import json

# Fallback: Bhopal/Indore area (23.25, 77.41) or Delhi (28.61, 77.20)
DEFAULT_LAT = 23.2599
DEFAULT_LON = 77.4126
DEFAULT_CITY = "Bhopal"


def _get_ip_location() -> tuple[float, float, str]:
    """Fetch current location via ip-api.com."""
    try:
        req = urllib.request.Request(
            "http://ip-api.com/json/",
            headers={"User-Agent": "Mozilla/5.0"}
        )
        with urllib.request.urlopen(req, timeout=3) as resp:
            data = json.loads(resp.read().decode())
            if data.get("status") == "success":
                return (
                    float(data.get("lat", DEFAULT_LAT)),
                    float(data.get("lon", DEFAULT_LON)),
                    str(data.get("city", DEFAULT_CITY))
                )
    except Exception as e:
        print(f"[Weather] IP location lookup failed: {e}")
    return DEFAULT_LAT, DEFAULT_LON, DEFAULT_CITY


def get_weather(city_name: str | None = None) -> dict:
    """Fetch live weather data from Open-Meteo API."""
    lat, lon, city = _get_ip_location()

    # Weather WMO code mapping
    WEATHER_CODES = {
        0: ("Clear Sky", "☀️"),
        1: ("Mainly Clear", "🌤️"),
        2: ("Partly Cloudy", "⛅"),
        3: ("Overcast", "☁️"),
        45: ("Foggy", "🌫️"),
        48: ("Rime Fog", "🌫️"),
        51: ("Light Drizzle", "🌧️"),
        53: ("Moderate Drizzle", "🌧️"),
        55: ("Dense Drizzle", "🌧️"),
        61: ("Slight Rain", "🌧️"),
        63: ("Moderate Rain", "🌧️"),
        65: ("Heavy Rain", "🌧️"),
        80: ("Rain Showers", "🌦️"),
        95: ("Thunderstorm", "🌩️"),
    }

    try:
        url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min&timezone=auto"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=4) as resp:
            data = json.loads(resp.read().decode())
            curr = data.get("current", {})
            daily = data.get("daily", {})

            code = curr.get("weather_code", 0)
            condition, icon = WEATHER_CODES.get(code, ("Clear", "☀️"))

            return {
                "city": city,
                "temperature": round(curr.get("temperature_2m", 25)),
                "feels_like": round(curr.get("apparent_temperature", 25)),
                "humidity": curr.get("relative_humidity_2m", 60),
                "wind_speed": round(curr.get("wind_speed_10m", 10)),
                "condition": condition,
                "icon": icon,
                "temp_max": round(daily.get("temperature_2m_max", [28])[0]),
                "temp_min": round(daily.get("temperature_2m_min", [20])[0]),
                "is_day": bool(curr.get("is_day", 1)),
            }
    except Exception as e:
        print(f"[Weather] Error fetching weather: {e}")
        return {
            "city": city,
            "temperature": 27,
            "feels_like": 28,
            "humidity": 55,
            "wind_speed": 12,
            "condition": "Partly Cloudy",
            "icon": "⛅",
            "temp_max": 30,
            "temp_min": 22,
            "is_day": True,
        }
