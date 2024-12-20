import React, { useEffect, useState, useCallback } from "react";

const API_URL = "http://localhost:8080";

function App() {
  const [data, setData] = useState<string | undefined>("");
  const [token, setToken] = useState<string | null>(localStorage.getItem("service_token"));

  const auth = useCallback(async () => {
    const response = await fetch(`${API_URL}/auth`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        serviceId: process.env.REACT_APP_FRONT_END_ID,
        serviceSecret: process.env.REACT_APP_FRONT_END_SECRET
      }),
    });

    if (!response.ok) {
      throw new Error("Authentication failed!");
    }

    const { token } = await response.json();
    localStorage.setItem("service_token", token);
    setToken(token);
  }, []);

  const getData = useCallback(async () => {
    const response = await fetch(API_URL, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch data");
    }

    const { data } = await response.json();
    setData(data);
  }, [token]);

  useEffect(() => {
    if (!token) {
      auth();
    } else {
      getData();
    }
  }, [token, auth, getData]);



  const updateData = async () => {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ data: data }),
    });

    if (!response.ok) {
      throw new Error("Failed to update data");
    }

    getData();
  };

  const verifyData = async () => {
    const response = await fetch(`${API_URL}/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ data: data }),
    });

    if (response.status === 400) {
      const body = await response.json()
      throw new Error(body.error);
    }

    alert("Data is valid!");
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        position: "absolute",
        padding: 0,
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        gap: "20px",
        fontSize: "30px",
      }}
    >
      <div>Saved Data</div>
      <input
        style={{ fontSize: "30px" }}
        type="text"
        value={data || ""}
        onChange={(e) => setData(e.target.value)}
      />

      <div style={{ display: "flex", gap: "10px" }}>
        <button style={{ fontSize: "20px" }} onClick={updateData}>
          Update Data
        </button>
        <button style={{ fontSize: "20px" }} onClick={verifyData}>
          Verify Data
        </button>
      </div>
    </div>
  );
}

export default App;
