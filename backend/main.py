from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import cv2
import os
import tempfile
import collections
import base64
from google import genai
from PIL import Image
import numpy as np
from datetime import datetime
from pymongo import MongoClient
from fastapi.responses import JSONResponse
from bson.json_util import dumps
from bson import ObjectId
from typing import Optional

# Initialize FastAPI app
app = FastAPI()

# Google Gemini API
genai_client = genai.Client(api_key="AIzaSyCkwbmGMWKltdkcDROczIqXoyfcD2KTLGU")

# MongoDB connection
client = MongoClient("mongodb://localhost:27017")  # Or use your MongoDB Atlas URI
db = client["accident_detection"]
accident_logs = db["logs"]

# Frame buffer to capture clip
frame_buffer = collections.deque(maxlen=120)
accident_frame = None

# Valid vehicle types
VALID_VEHICLE_TYPES = ["car", "truck", "bus", "bike", "auto", "other"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def extract_frames(video_path, frame_interval=240):
    cap = cv2.VideoCapture(video_path)
    frames_for_analysis = []
    frame_count = 0

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        frame_buffer.append(frame)

        if frame_count % frame_interval == 0:
            img = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
            frames_for_analysis.append((img, frame))

        frame_count += 1

    cap.release()
    return frames_for_analysis

def save_video(frames, output_path, fps=30):
    if not frames:
        print("No frames to save.")
        return None

    try:
        height, width, _ = frames[0].shape
        fourcc = cv2.VideoWriter_fourcc(*'avc1')  # H.264 codec
        out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

        for frame in frames:
            out.write(frame)

        out.release()
        print("Video saved to:", output_path)
        return output_path
    except Exception as e:
        print("Error saving video:", e)
        return None

def analyze_frame_with_gemini(frame: Image):
    try:
        response = genai_client.models.generate_content(
            model="gemini-2.0-flash-lite",
            contents=[frame, "Is there an accident? Reply True or False."]
        )
        print("Gemini response:", response.text)
        return response.text.strip().lower()
    except Exception as e:
        print("Gemini API error:", e)
        return "false"

def detect_vehicle_type(frame: Image):
    try:
        response = genai_client.models.generate_content(
            model="gemini-2.0-flash-lite",
            contents=[frame, "What type of vehicle is in this accident? Choose one: car, truck, bus, bike, auto, or other."]
        )
        response_text = response.text.strip().lower()
        print("Vehicle detection response:", response_text)
        
        # Extract the vehicle type from the response
        for vehicle_type in VALID_VEHICLE_TYPES:
            if vehicle_type in response_text:
                return vehicle_type
        
        return "other"  # Default if no specific vehicle type is detected
    except Exception as e:
        print("Gemini API error in vehicle detection:", e)
        return "other"

def frame_to_base64(frame):
    _, buffer = cv2.imencode('.jpg', frame)
    return base64.b64encode(buffer).decode('utf-8')

@app.post("/upload/")
async def upload_video(
    file: UploadFile = File(...),
    vehicle_type: Optional[str] = Form(None)  # Accept manual vehicle type input
):
    frame_buffer.clear()
    global accident_frame
    accident_frame = None

    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as temp_video:
        temp_video.write(await file.read())
        video_path = temp_video.name

    try:
        frames = extract_frames(video_path)
        os.remove(video_path)

        detected_vehicle_type = None

        for pil_frame, cv_frame in frames:
            result = analyze_frame_with_gemini(pil_frame)
            if "true" in result:
                accident_frame = cv_frame
                
                # Detect vehicle type if not provided manually
                if not vehicle_type or vehicle_type not in VALID_VEHICLE_TYPES:
                    detected_vehicle_type = detect_vehicle_type(pil_frame)
                else:
                    detected_vehicle_type = vehicle_type.lower()

                # Save video
                os.makedirs("videos", exist_ok=True)
                video_filename = f"accident_clip_{os.getpid()}.mp4"
                video_output_path = os.path.join("videos", video_filename)
                saved_video_path = save_video(list(frame_buffer), video_output_path)

                # Save image
                os.makedirs("images", exist_ok=True)
                frame_filename = f"accident_frame_{os.getpid()}.jpg"
                frame_path = os.path.join("images", frame_filename)
                cv2.imwrite(frame_path, accident_frame)

                # Save metadata to MongoDB
                now = datetime.now()
                accident_logs.insert_one({
                    "timestamp": now,
                    "video_path": video_output_path,
                    "image_path": frame_path,
                    "vehicle_type": detected_vehicle_type
                })

                return {
                    "accident_detected": True,
                    "video_path": f"/accident_video/{video_filename}",
                    "frame_path": f"/accident_frame/{frame_filename}",
                    "frame_base64": frame_to_base64(accident_frame),
                    "vehicle_type": detected_vehicle_type
                }

        return {"accident_detected": False}

    except Exception as e:
        print(f"Error processing video: {str(e)}")
        return {"error": str(e)}

@app.post("/report_accident/")
async def report_accident(
    vehicle_type: str = Form(...),
    file: UploadFile = File(...)
):
    """
    Endpoint to directly report an accident with vehicle type information
    """
    # Validate vehicle type
    if vehicle_type.lower() not in VALID_VEHICLE_TYPES:
        return {"error": f"Invalid vehicle type. Valid types are: {', '.join(VALID_VEHICLE_TYPES)}"}
    
    # Process the upload with the specified vehicle type
    return await upload_video(file=file, vehicle_type=vehicle_type)

@app.get("/accident_video/{filename}")
async def get_video(filename: str):
    file_path = os.path.join("videos", filename)
    if os.path.exists(file_path):
        return FileResponse(
            file_path,
            media_type="video/mp4",
            filename="accident_clip.mp4",
            headers={
                "Content-Disposition": "attachment; filename=accident_clip.mp4",
                "Accept-Ranges": "bytes",
            },
        )
    return {"error": "File not found"}

@app.get("/accident_frame/{filename}")
async def get_frame(filename: str):
    file_path = os.path.join("images", filename)
    if os.path.exists(file_path):
        return FileResponse(
            file_path,
            media_type="image/jpeg",
            filename="accident_frame.jpg",
        )
    return {"error": "File not found"}

@app.get("/accident_images/")
async def get_all_accident_images():
    """
    Returns all accident images with date, time, and vehicle type.
    """
    try:
        # Get all records from MongoDB
        records = accident_logs.find({}, {"_id": 0, "timestamp": 1, "image_path": 1, "vehicle_type": 1})

        # Format results into a list
        results = []
        for record in records:
            results.append({
                "timestamp": record["timestamp"].strftime("%Y-%m-%d %H:%M:%S"),
                "image_path": record["image_path"],
                "vehicle_type": record.get("vehicle_type", "unknown")
            })

        return JSONResponse(content={"images": results})

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
    
@app.get("/accident_videos/")
async def get_all_accident_videos():
    """
    Returns all accident videos with date, time, video path, image path, and vehicle type.
    """
    try:
        records = accident_logs.find({}, 
            {"_id": 0, "timestamp": 1, "video_path": 1, "image_path": 1, "vehicle_type": 1})

        results = []
        for record in records:
            results.append({
                "timestamp": record["timestamp"].strftime("%Y-%m-%d %H:%M:%S"),
                "video_path": record["video_path"],
                "image_path": record.get("image_path", None),
                "vehicle_type": record.get("vehicle_type", "unknown")
            })

        return {"videos": results}

    except Exception as e:
        return {"error": str(e)}

@app.get("/vehicle_types/")
async def get_vehicle_types():
    """
    Returns counts of accidents by vehicle type
    """
    try:
        pipeline = [
            {
                "$group": {
                    "_id": "$vehicle_type",
                    "count": {"$sum": 1}
                }
            },
            {
                "$sort": {"count": -1}
            }
        ]
        
        results = list(accident_logs.aggregate(pipeline))
        formatted_results = [{"vehicle_type": r.get("_id", "unknown"), "count": r["count"]} for r in results]
        
        return {"vehicle_stats": formatted_results}
    
    except Exception as e:
        return {"error": str(e)}
 