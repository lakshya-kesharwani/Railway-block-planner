from pymongo import MongoClient
from app.core.config import settings
client = MongoClient(settings.MONGODB_URL)
db = client[settings.DATABASE_NAME]

users_collection = db["users"]
users_collection.create_index("email", unique=True)


try:
    client.admin.command("ping")
    print("MongoDB connection successful!")
except Exception as e:
    print("MongoDB connection failed:", e)