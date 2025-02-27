import React from "react";

const AlertSystem = ({ message, type }) => {
  return (
    <div className={`p-2 rounded ${type === "success" ? "bg-green-500" : "bg-red-500"} text-white`}>
      {message}
    </div>
  );
};

export default AlertSystem;
