import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app"; // Ensure this matches your `app.js` file name and location
import "./index.css"; // Include your CSS file


const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
