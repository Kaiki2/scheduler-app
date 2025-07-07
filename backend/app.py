# ─────────────────────────────────────────────
# 🔧 Imports & Initial Setup
# ─────────────────────────────────────────────
import uuid
from datetime import datetime
from functools import wraps

from dateutil.rrule import rrulestr
from firebase_admin import auth
from flask import Flask, request, jsonify
from flask_cors import CORS

from firebase_config import db

app = Flask(__name__)
CORS(app)  # Allow cross-origin requests from frontend
# ─────────────────────────────────────────────


# ─────────────────────────────────────────────
# 🔒 Auth Helpers
# ─────────────────────────────────────────────
def verify_token(req):
    auth_header = req.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split("Bearer ")[1]
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token["uid"]
    except Exception as e:
        print("Token verification failed:", e)
        return None

def verify_token_required(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        uid = verify_token(request)
        if not uid:
            return jsonify({"error": "Unauthorized"}), 401
        return func(uid=uid, *args, **kwargs)
    return wrapper
# ─────────────────────────────────────────────


# ─────────────────────────────────────────────
# 🔗 Firestore Helpers
# ─────────────────────────────────────────────
def get_user_events_ref(uid):
    return db.collection("users").document(uid).collection("events")

def get_user_overrides_ref(uid):
    return db.collection("users").document(uid).collection("event_overrides")
# ─────────────────────────────────────────────


# ─────────────────────────────────────────────
# 📡 Status Route
# ─────────────────────────────────────────────
@app.route("/")
def home():
    return "Scheduler Backend Running"
# ─────────────────────────────────────────────


# ─────────────────────────────────────────────
# ➕ Create Event (One-time or Recurring)
# ─────────────────────────────────────────────
@app.route("/api/events", methods=["POST"])
@verify_token_required
def create_event(uid):
    data = request.json

    event_id = str(uuid.uuid4())
    required_fields = ["title", "start", "end"]

    for field in required_fields:
        if not data.get(field):
            return jsonify({"error": f"Missing required field: {field}"}), 400

    title = data.get("title", "").strip()
    if not title:
        return jsonify({"error": "Title cannot be empty"}), 400

    event = {
        "title": title,
        "start": data["start"],
        "end": data["end"],
        "recurrence": data.get("recurrence") or None,
        "description": data.get("description", "").strip(),
        "created_at": datetime.now().isoformat()
    }

    get_user_events_ref(uid).document(event_id).set(event)
    return jsonify({"id": event_id, **event})
# ─────────────────────────────────────────────


# ─────────────────────────────────────────────
# 📆 Get Events (with date filter + recurrence expansion)
# ─────────────────────────────────────────────
@app.route("/api/events", methods=["GET"])
@verify_token_required
def get_events(uid):
    date_filter = request.args.get("date")
    if date_filter == "":
        date_filter = None  # treat empty string as no filter
    events_ref = get_user_events_ref(uid)
    docs = events_ref.stream()
    events = []

    for doc in docs:
        event = doc.to_dict()
        event["id"] = doc.id

        if date_filter:
            try:
                filter_date = datetime.fromisoformat(date_filter).date()
                start_dt = datetime.fromisoformat(event["start"])
                end_dt = datetime.fromisoformat(event["end"])

                if not event.get("recurrence"):
                    if start_dt.date() <= filter_date <= end_dt.date():
                        events.append(event)
                else:
                    rule = rrulestr(event["recurrence"], dtstart=start_dt, forceset=True)
                    occurrences = list(rule.between(
                        datetime.combine(filter_date, datetime.min.time()),
                        datetime.combine(filter_date, datetime.max.time()),
                        inc=True
                    ))

                    for occ in occurrences:
                        instance = event.copy()
                        instance["id"] = f"{event['id']}_{occ.date()}"
                        instance["start"] = occ.isoformat()
                        instance["end"] = (occ + (end_dt - start_dt)).isoformat()
                        instance["isRecurringInstance"] = True
                        instance["originalId"] = doc.id

                        # Check override
                        override_doc = get_user_overrides_ref(uid).document(instance["id"]).get()
                        if override_doc.exists:
                            override = override_doc.to_dict()
                            if override.get("deleted"):
                                continue
                            instance.update(override)

                        events.append(instance)

            except Exception as e:
                print("Error processing event:", e)
                continue
        else:
            events.append(event)

    return jsonify(events)
# ─────────────────────────────────────────────


# ─────────────────────────────────────────────
# ✏️ Update Main Event (not individual instance)
# ─────────────────────────────────────────────
@app.route("/api/events/<event_id>", methods=["PUT"])
@verify_token_required
def update_event(uid, event_id):
    data = request.json
    get_user_events_ref(uid).document(event_id).update(data)
    return jsonify({"message": "Event updated"})
# ─────────────────────────────────────────────


# ─────────────────────────────────────────────
# ❌ Delete Main Event (not instance)
# ─────────────────────────────────────────────
@app.route("/api/events/<event_id>", methods=["DELETE"])
@verify_token_required
def delete_event(uid, event_id):
    get_user_events_ref(uid).document(event_id).delete()
    return jsonify({"message": "Event deleted"})
# ─────────────────────────────────────────────


# ─────────────────────────────────────────────
# ✏️ Override One Recurring Instance
# ─────────────────────────────────────────────
@app.route("/api/events/<event_id>/override", methods=["PUT"])
@verify_token_required
def override_recurring_event(uid, event_id):
    date_str = request.args.get("date")
    if not date_str:
        return jsonify({"error": "Missing date parameter"}), 400
    try:
        datetime.fromisoformat(date_str)
    except ValueError:
        return jsonify({"error": "Invalid date format"}), 400

    override_id = f"{event_id}_{date_str}"
    data = request.json

    allowed_fields = {"title", "start", "end", "description"}
    filtered_data = {k: v for k, v in data.items() if k in allowed_fields}
    filtered_data["title"] = filtered_data.get("title", "").strip()
    filtered_data["description"] = filtered_data.get("description", "").strip()
    filtered_data["originalId"] = event_id
    filtered_data["isRecurringInstance"] = True
    filtered_data["overriddenAt"] = datetime.now().isoformat()

    get_user_overrides_ref(uid).document(override_id).set(filtered_data)
    return jsonify({"message": "Override saved", "id": override_id})
# ─────────────────────────────────────────────


# ─────────────────────────────────────────────
# ❌ Delete One Recurring Instance (soft delete)
# ─────────────────────────────────────────────
@app.route("/api/events/<event_id>/override", methods=["DELETE"])
@verify_token_required
def delete_recurring_instance(uid, event_id):
    date_str = request.args.get("date")
    if not date_str:
        return jsonify({"error": "Missing date parameter"}), 400
    try:
        datetime.fromisoformat(date_str)
    except ValueError:
        return jsonify({"error": "Invalid date format"}), 400

    override_id = f"{event_id}_{date_str}"
    get_user_overrides_ref(uid).document(override_id).set({"deleted": True})
    return jsonify({"message": "Instance marked as deleted"})
# ─────────────────────────────────────────────


# ─────────────────────────────────────────────
# 🚀 Launch App
# ─────────────────────────────────────────────
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
