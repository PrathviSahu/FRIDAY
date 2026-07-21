from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
import uvicorn
import os

# Ensure temp_audio directory exists
os.makedirs('temp_audio', exist_ok=True)

app = FastAPI()
app.mount('/temp_audio', StaticFiles(directory='temp_audio'), name='temp_audio')

if __name__ == "__main__":
uvicorn.run(app, host="0.0.0.0", port=8000)