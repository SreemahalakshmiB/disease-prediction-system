from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import joblib
import os

app = Flask(__name__, static_folder="../frontend/build")
CORS(app)

model = joblib.load("model.pkl")

@app.route("/predict", methods=["POST"])
def predict():
    data = request.json

    features = [[
        float(data['age']),
        float(data['cp']),
        float(data['bp']),
        float(data['cholesterol']),
        float(data['sugar']),
        float(data['thalach']),
        float(data['exang'])
    ]]

    proba = model.predict_proba(features)
    risk_percentage = round(proba[0][1] * 100, 2)

    prediction = model.predict(features)

    if prediction[0] == 0:
        result = "Low Risk"
    else:
        result = "High Risk"

    return jsonify({
        "prediction": result,
        "risk": risk_percentage
    })

# Serve React static files
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve(path):
    if path != "" and os.path.exists(app.static_folder + "/" + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, "index.html")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)