import firebase_admin
from firebase_admin import credentials, firestore

cred = credentials.Certificate("firebase-service-account.json")  # Put this JSON in your backend folder
firebase_admin.initialize_app(cred)

db = firestore.client()
