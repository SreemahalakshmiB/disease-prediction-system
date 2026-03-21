import React, { useState } from "react";

function App() {
  const [formData, setFormData] = useState({
    age: "",
    bp: "",
    sugar: "",
    cholesterol: "",
    cp: "",
    thalach: "",
    exang: ""
  });

  const [result, setResult] = useState("");
  const [risk, setRisk] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.age ||
      !formData.bp ||
      !formData.sugar ||
      !formData.cholesterol ||
      !formData.cp ||
      !formData.thalach ||
      !formData.exang
    ) {
      alert("Please fill all fields");
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:5000/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      setResult(data.prediction);
      setRisk(data.risk);
    } catch (error) {
      console.error(error);
      alert("Backend connection error");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1>Heart Disease Prediction</h1>

        <form onSubmit={handleSubmit}>
          <input style={styles.input} name="age" placeholder="Age" onChange={handleChange} />
          <input style={styles.input} name="bp" placeholder="Blood Pressure" onChange={handleChange} />
          <input style={styles.input} name="sugar" placeholder="Blood Sugar" onChange={handleChange} />
          <input style={styles.input} name="cholesterol" placeholder="Cholesterol" onChange={handleChange} />
          <input style={styles.input} name="cp" placeholder="Chest Pain (0-3)" onChange={handleChange} />
          <input style={styles.input} name="thalach" placeholder="Max Heart Rate" onChange={handleChange} />
          <input style={styles.input} name="exang" placeholder="Exercise Angina (0/1)" onChange={handleChange} />

          <button style={styles.button} type="submit">Predict</button>
        </form>

        {result && (
          <div style={{ marginTop: "20px" }}>
            <h2 style={{ color: result === "High Risk" ? "red" : "green" }}>
              {result}
            </h2>

            <h3>Risk: {risk}%</h3>

            {/* Risk Progress Bar */}
            <div style={styles.progressContainer}>
              <div
                style={{
                  width: `${risk}%`,
                  background: risk > 60 ? "red" : "green",
                  padding: "6px",
                  color: "white",
                  borderRadius: "10px"
                }}
              >
                {risk}%
              </div>
            </div>

            {/* Doctor Advice */}
            <div style={{ marginTop: "10px" }}>
              {risk > 70 && (
                <p style={{ color: "red" }}>
                  ⚠️ Consult a cardiologist immediately.
                </p>
              )}
              {risk > 40 && risk <= 70 && (
                <p style={{ color: "orange" }}>
                  ⚠️ Maintain proper diet and exercise.
                </p>
              )}
              {risk <= 40 && (
                <p style={{ color: "green" }}>
                  ✅ Healthy condition. Continue good lifestyle.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    background: "linear-gradient(to right, #4facfe, #00f2fe)"
  },
  card: {
    background: "white",
    padding: "30px",
    borderRadius: "12px",
    width: "320px",
    textAlign: "center",
    boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
  },
  input: {
    width: "100%",
    padding: "10px",
    margin: "8px 0",
    borderRadius: "8px",
    border: "1px solid #ccc"
  },
  button: {
    width: "100%",
    padding: "10px",
    background: "#4facfe",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "16px"
  },
  progressContainer: {
    width: "100%",
    background: "#eee",
    borderRadius: "10px",
    marginTop: "10px"
  }
};

export default App;