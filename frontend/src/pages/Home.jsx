import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Home.css";

const Home = () => {
  const [dateTime, setDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const day = days[dateTime.getDay()];
  const month = months[dateTime.getMonth()];
  const date = dateTime.getDate();
  const hours = dateTime.getHours().toString().padStart(2, "0");
  const minutes = dateTime.getMinutes().toString().padStart(2, "0");
  const seconds = dateTime.getSeconds().toString().padStart(2, "0");

  return (
    <div className="home-container">
      <img src="/image.jpg" alt="Hospital" className="bg-image" />

      <div className="overlay">
        <div className="date-time-widget">
          <div className="date-text">{day}, {date} {month}</div>
          <div className="time-text">{hours}:{minutes}:{seconds}</div>
        </div>

        <h1>Hospital QA System</h1>
        <h2>Powered by AI — Choose your Portal</h2>

        <div className="buttons">
          <Link to="/doctor-login" className="btn">🩺 Doctor Portal</Link>
          <Link to="/register" className="btn">🏥 Patient Portal</Link>
          <Link to="/admin-login" className="btn">🛡️ Admin Portal</Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
