from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import joblib
import os
import sqlite3
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BUILD_DIR = os.path.join(BASE_DIR, "build")
# ------------------ CREATE APP FIRST ------------------
app = Flask(__name__, static_folder="build", static_url_path="")
CORS(app)

# ------------------ LOAD ML MODEL ------------------

model_path = os.path.join(BASE_DIR, "model.pkl")

if not os.path.exists(model_path):
    model_path = "backend/model.pkl"

model = joblib.load(model_path)

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

    features = [[
        age,
        cp,
        bp,
        cholesterol,
        sugar,
        thalach,
        exang
    ]]

    # ML prediction
    proba = model.predict_proba(features)
    risk_percentage = round(proba[0][1] * 100, 2)

    prediction = model.predict(features)

    if prediction[0] == 0:
        result = "Low Risk"
    else:
        result = "High Risk"

    # Save to SQLite
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
    full_path = os.path.join(app.static_folder, path)

    if path != "" and os.path.exists(full_path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, "index.html")