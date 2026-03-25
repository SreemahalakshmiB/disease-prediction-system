from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import joblib
import os
import sqlite3

# ------------------ PATHS ------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BUILD_DIR = os.path.join(BASE_DIR, "build")

# ------------------ CREATE APP ------------------
app = Flask(__name__, static_folder=BUILD_DIR, static_url_path="")
CORS(app)

# ------------------ LOAD ML MODEL ------------------
possible_paths = [
    os.path.join(BASE_DIR, "model.pkl"),
    "backend/model.pkl",
    "model.pkl"
]

model = None
for path in possible_paths:
    if os.path.exists(path):
        model = joblib.load(path)
        print("Model loaded from:", path)
        break

if model is None:
    raise FileNotFoundError("model.pkl not found")

# ------------------ SQLITE DB ------------------
DB_NAME = "disease_predictions.db"

def init_db():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS predictions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        age REAL,
        cp REAL,
        bp REAL,
        cholesterol REAL,
        sugar REAL,
        thalach REAL,
        exang REAL,
        prediction TEXT,
        risk REAL
    )
    """)

    conn.commit()
    conn.close()

init_db()

# ------------------ PREDICT ROUTE ------------------
@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()

    if not data:
        return jsonify({"error": "No input data"}), 400

    age = float(data['age'])
    cp = float(data['cp'])
    bp = float(data['bp'])
    cholesterol = float(data['cholesterol'])
    sugar = float(data['sugar'])
    thalach = float(data['thalach'])
    exang = float(data['exang'])

    features = [[age, cp, bp, cholesterol, sugar, thalach, exang]]

    proba = model.predict_proba(features)
    risk_percentage = round(proba[0][1] * 100, 2)

    prediction = model.predict(features)

    result = "High Risk" if prediction[0] == 1 else "Low Risk"

    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO predictions
        (age, cp, bp, cholesterol, sugar, thalach, exang, prediction, risk)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        age, cp, bp, cholesterol, sugar, thalach, exang,
        result, risk_percentage
    ))

    conn.commit()
    conn.close()

    return jsonify({
        "prediction": result,
        "risk": risk_percentage
    })


# ------------------ HISTORY ROUTE ------------------
@app.route("/history", methods=["GET"])
def history():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    cursor.execute("""
        SELECT age, cp, bp, cholesterol, sugar, thalach, exang, prediction, risk
        FROM predictions
        ORDER BY id DESC
    """)

    rows = cursor.fetchall()
    conn.close()

    history_data = []
    for row in rows:
        history_data.append({
            "age": row[0],
            "cp": row[1],
            "bp": row[2],
            "cholesterol": row[3],
            "sugar": row[4],
            "thalach": row[5],
            "exang": row[6],
            "prediction": row[7],
            "risk": row[8]
        })

    return jsonify(history_data)


# ------------------ SERVE REACT ------------------
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve(path):
    if path != "" and os.path.exists(os.path.join(BUILD_DIR, path)):
        return send_from_directory(BUILD_DIR, path)
    else:
        return send_from_directory(BUILD_DIR, "index.html")


# ------------------ RUN APP ------------------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)