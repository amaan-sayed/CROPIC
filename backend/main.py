from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import time
import random
import torch
from torchvision import models, transforms
from PIL import Image
import io
from dotenv import load_dotenv
import os
from pymongo import MongoClient
import cloudinary
import cloudinary.uploader
import torch.nn as nn
from rembg import remove
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

# --- LOAD ENV ---
load_dotenv()

PORT = int(os.getenv("PORT", 8000))
MONGO_URI = os.getenv("MONGO_URI")

CLOUDINARY_NAME = os.getenv("CLOUDINARY_NAME")
CLOUDINARY_KEY = os.getenv("CLOUDINARY_KEY")
CLOUDINARY_SECRET = os.getenv("CLOUDINARY_SECRET")

# Replace this with your actual MongoDB URI (local or Atlas)
MONGO_DETAILS ="mongodb+srv://hasanyasmeen008_db_user:amaan_sayed@cluster0.r0jzdzc.mongodb.net/cropic?appName=Cluster0"
client = AsyncIOMotorClient(MONGO_DETAILS)
database = client.cropic_db
report_collection = database.get_collection("reports")

# Helper to convert MongoDB data to JSON-friendly format
def report_helper(report) -> dict:
    return {
        "id": str(report["_id"]),
        "status": report["status"],
        "time": report["time"],
        "coordinates": report["coordinates"],
        "location": report.get("location", ""),
        "cropStage": report.get("cropStage", "")
    }

# --- APP ---
app = FastAPI()

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- MONGODB ---
client = MongoClient(MONGO_URI)
db = client["cropic"]
collection = db["submissions"]

# --- CLOUDINARY ---
cloudinary.config(
    cloud_name=CLOUDINARY_NAME,
    api_key=CLOUDINARY_KEY,
    api_secret=CLOUDINARY_SECRET
)

# --- AI MODEL ---
# --- AI MODEL (REAL TRAINED MODEL) ---


# --- AI MODEL (REAL TRAINED MODEL) ---

# --- AI MODEL (REAL TRAINED MODEL) ---

def conv_block(in_channels, out_channels, pool=False):
    layers = [nn.Conv2d(in_channels, out_channels, kernel_size=3, padding=1),
              nn.BatchNorm2d(out_channels),
              nn.ReLU(inplace=True)]
    if pool: layers.append(nn.MaxPool2d(2))
    return nn.Sequential(*layers)

class ResNet9(nn.Module):
    def __init__(self, in_channels, num_classes):
        super().__init__()
        self.conv1 = conv_block(in_channels, 64)
        self.conv2 = conv_block(64, 128, pool=True)
        self.res1 = nn.Sequential(conv_block(128, 128), conv_block(128, 128))
        self.conv3 = conv_block(128, 256, pool=True)
        self.conv4 = conv_block(256, 512, pool=True)
        self.res2 = nn.Sequential(conv_block(512, 512), conv_block(512, 512))
        
        # AdaptiveAvgPool guarantees the output math always matches nn.Linear(512)
        self.classifier = nn.Sequential(nn.AdaptiveAvgPool2d(1),
                                        nn.Flatten(),
                                        nn.Linear(512, num_classes))

    def forward(self, xb):
        out = self.conv1(xb)
        out = self.conv2(out)
        out = self.res1(out) + out
        out = self.conv3(out)
        out = self.conv4(out)
        out = self.res2(out) + out
        out = self.classifier(out)
        return out

NUM_CLASSES = 38  
model = ResNet9(3, NUM_CLASSES)
model.load_state_dict(torch.load("plant_disease_model.pth", map_location=torch.device('cpu')))
model.eval()

# FIX: Resize proportionally, center crop to square, and NO normalization
transform = transforms.Compose([
    transforms.Resize(256), 
    transforms.CenterCrop(256),
    transforms.ToTensor()
])

# FIX: Your exact alphabetical ImageFolder classes
classes = [
    "Apple___Apple_scab", "Apple___Black_rot", "Apple___Cedar_apple_rust", "Apple___healthy",
    "Blueberry___healthy", "Cherry_(including_sour)___Powdery_mildew", "Cherry_(including_sour)___healthy",
    "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot", "Corn_(maize)___Common_rust_",
    "Corn_(maize)___Northern_Leaf_Blight", "Corn_(maize)___healthy", "Grape___Black_rot",
    "Grape___Esca_(Black_Measles)", "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)", "Grape___healthy",
    "Orange___Haunglongbing_(Citrus_greening)", "Peach___Bacterial_spot", "Peach___healthy",
    "Pepper,_bell___Bacterial_spot", "Pepper,_bell___healthy", "Potato___Early_blight",
    "Potato___Late_blight", "Potato___healthy", "Raspberry___healthy", "Soybean___healthy",
    "Squash___Powdery_mildew", "Strawberry___Leaf_scorch", "Strawberry___healthy",
    "Tomato___Bacterial_spot", "Tomato___Early_blight", "Tomato___Late_blight",
    "Tomato___Leaf_Mold", "Tomato___Septoria_leaf_spot", "Tomato___Spider_mites Two-spotted_spider_mite",
    "Tomato___Target_Spot", "Tomato___Tomato_Yellow_Leaf_Curl_Virus", "Tomato___Tomato_mosaic_virus",
    "Tomato___healthy"
]

# --- DASHBOARD API ---
@app.get("/api/user/dashboard")
async def get_dashboard_data():
    submissions = list(collection.find().sort("_id", -1))

    for sub in submissions:
        sub["id"] = str(sub["_id"])
        del sub["_id"]

    total = len(submissions)
    alerts = len([s for s in submissions if s["status"] != "Healthy"])
    healthy = total - alerts

    return {
        "userCenter": [19.1825, 73.1841],
        "stats": {
            "totalAnalyzed": total,
            "alertsFlagged": alerts,
            "healthyPercentage": round((healthy / total) * 100, 1) if total else 100
        },
        "submissions": submissions
    }

# --- ANALYZE API ---
@app.post("/api/analyze")
async def analyze_crop_image(file: UploadFile = File(...)):
    contents = await file.read()

    # ---> THE MAGIC STEP <---
    # This strips away the dirt, fingers, and background!
    no_bg_bytes = remove(contents) 

    # Upload to Cloudinary (Upload the original or the clean one, up to you!)
    upload_result = cloudinary.uploader.upload(contents)
    image_url = upload_result["secure_url"]

    # Preprocess the CLEANED image for PyTorch
    # We must use .convert("RGB") because rembg adds a transparent layer (RGBA)
    image = Image.open(io.BytesIO(no_bg_bytes)).convert("RGB")
    image = transform(image).unsqueeze(0)

    
    # ✅ AI prediction (REAL)
    with torch.no_grad():
        outputs = model(image)
        probs = torch.softmax(outputs, dim=1)
        confidence, predicted = torch.max(probs, 1)

    label = classes[predicted.item()]
    confidence = confidence.item() * 100

    # ✅ SMART STATUS LOGIC (based on label, NOT confidence)
    if "healthy" in label.lower():
        status_result = "Healthy"
    elif "blight" in label.lower() or "rot" in label.lower():
        status_result = "Disease Detected"
    elif "rust" in label.lower():
        status_result = "Pest Alert"
    else:
        status_result = "Check Required"

    # ✅ Save to MongoDB
    new_submission = {
        "time": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "location": "Auto-detected",
        "status": status_result,
        "disease": label,   # 🔥 NEW FIELD (important)
        "image": image_url,
        "confidence": round(confidence, 1),
        "coordinates": [
            19.1825 + random.uniform(-0.01, 0.01),
            73.1841 + random.uniform(-0.01, 0.01)
        ]
    }

    result = collection.insert_one(new_submission)
    new_submission["id"] = str(result.inserted_id)

    return {
        "filename": file.filename,
        "status": status_result,
        "disease": label,
        "confidence": round(confidence, 1),
        "image": image_url,
        "recommendation": f"Detected: {label}"
    }
# In your main.py or api.py

# --- OFFICER PORTAL API ---

# 1. Get all reports for the Officer to review
@app.get("/api/officer/reports")
async def get_reports_for_officer():
    # We fetch all submissions from the database so the officer can see the history
    # .sort("_id", -1) puts the newest ones at the top
    reports = list(collection.find().sort("_id", -1))
    
    for report in reports:
        report["id"] = str(report["_id"])
        del report["_id"]
    
    return reports

# 2. Update the status (Approved/Rejected)
@app.patch("/api/reports/{report_id}/status")
async def update_report_status(report_id: str, status_update: dict):
    new_status = status_update.get("status") # Expecting "Approved" or "Rejected"
    
    if not new_status:
        return {"error": "No status provided"}

    # Update the document in MongoDB using the report_id
    result = collection.update_one(
        {"_id": ObjectId(report_id)},
        {"$set": {"status": new_status}}
    )

    if result.modified_count == 0:
        return {"error": "Report not found or status unchanged"}

    return {"message": f"Report {new_status} successfully", "id": report_id}

# --- RUN ---
if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=PORT, reload=True)