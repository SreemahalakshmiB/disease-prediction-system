import React, { useState, useEffect } from "react";

function App() {
     // <-- FIXED HERE

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
  const [history, setHistory] = useState([]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const fetchHistory = async () => {
    try {
      const response = await fetch(`/history`);
      if (!response.ok) throw new Error("History fetch failed");
      const data = await response.json();
      setHistory(data);
    } catch (error) {
      console.error("History error:", error);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

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
      const response = await fetch(`/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error("Prediction failed");

      const data = await response.json();
      setResult(data.prediction);
      setRisk(data.risk);

      fetchHistory();

    } catch (error) {
      console.error("Prediction error:", error);
      alert("Backend connection error");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1>Heart disease prediction</h1>
        

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
          </div>
        )}

        {history.length > 0 && (
          <div style={{ marginTop: "25px" }}>
            <h2>Previous Predictions</h2>

            <table style={styles.table}>
              <thead>
                <tr>
                  <th>Age</th>
                  <th>BP</th>
                  <th>Chol</th>
                  <th>Risk</th>
                  <th>Prediction</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item, index) => (
                  <tr key={index}>
                    <td>{item.age}</td>
                    <td>{item.bp}</td>
                    <td>{item.cholesterol}</td>
                    <td>{item.risk}%</td>
                    <td>{item.prediction}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
      <footer style={styles.footer}>
  Developed by Bathini Sree Mahalakshmi
</footer>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    background: "linear-gradient(to right, #4facfe, #00f2fe)",
    padding: "20px"
  },
  card: {
    background: "white",
    padding: "30px",
    borderRadius: "12px",
    width: "340px",
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
  },
  table: {
    width: "100%",
    marginTop: "10px",
    borderCollapse: "collapse",
    fontSize: "12px"
  }
  footer: {
  marginTop: "20px",
  fontSize: "13px",
  color: "#555",
  textAlign: "center"
}
};

export default App;