import React, { useState } from "react";
import axios from "axios";

const StockControls = ({ ingredient, onUpdate }) => {
  const [amount, setAmount] = useState(1);

  const handleIncrease = async () => {
    if (amount <= 0) return;
    try {
      await axios.patch(`http://127.0.0.1:8000/increase/${ingredient.barcode}`, {
        amount: parseFloat(amount),
      });
      onUpdate(ingredient.barcode, ingredient.num_containers + parseFloat(amount));
    } catch (error) {
      console.error("Error increasing stock", error);
    }
  };

  const handleDecrease = async () => {
    if (amount <= 0) return;
    try {
      await axios.patch(`http://127.0.0.1:8000/decrease/${ingredient.barcode}`, {
        amount: parseFloat(amount),
      });
      onUpdate(ingredient.barcode, ingredient.num_containers - parseFloat(amount));
    } catch (error) {
      console.error("Error decreasing stock", error);
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <input
        type="number"
        value={amount}
        min="1"
        onChange={(e) => setAmount(e.target.value)}
        style={{ width: "50px", textAlign: "center" }}
      />
      <button onClick={handleIncrease} style={{ backgroundColor: "blue", color: "white" }}>
        +
      </button>
      <button onClick={handleDecrease} style={{ backgroundColor: "red", color: "white" }}>
        -
      </button>
    </div>
  );
};

export default StockControls;
