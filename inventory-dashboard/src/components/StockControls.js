import React, { useState } from "react";
import axios from "axios";

const StockControls = ({ ingredient, setIngredients }) => {
  const [amount, setAmount] = useState(""); // Removed default "1"

  const updateStock = async (action) => {
    const numericAmount = parseInt(amount);
    if (!numericAmount || numericAmount <= 0) return;

    try {
      const url = `http://127.0.0.1:8000/${action}/${ingredient.barcode}`;
      const response = await axios.patch(url, { amount: numericAmount });

      if (response.status === 200) {
        setIngredients((prevIngredients) =>
          prevIngredients.map((ing) =>
            ing.barcode === ingredient.barcode
              ? { ...ing, num_containers: ing.num_containers + (action === "increase" ? numericAmount : -numericAmount) }
              : ing
          )
        );
      }
      setAmount(""); // Clear input after update
    } catch (error) {
      console.error(`Error updating stock (${action}):`, error);
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
      <input
        type="number"
        value={amount}
        min="1"
        placeholder="Enter"
        onChange={(e) => setAmount(e.target.value)}
        style={{
          width: "60px",
          textAlign: "center",
          borderRadius: "5px",
          border: "1px solid #ccc",
        }}
      />
      <button
        onClick={() => updateStock("increase")}
        style={{
          backgroundColor: "green",
          color: "white",
          border: "none",
          borderRadius: "50%",
          width: "25px",
          height: "25px",
          fontSize: "16px",
          cursor: "pointer",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        +
      </button>
      <button
        onClick={() => updateStock("decrease")}
        style={{
          backgroundColor: "green",
          color: "white",
          border: "none",
          borderRadius: "50%",
          width: "25px",
          height: "25px",
          fontSize: "16px",
          cursor: "pointer",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        -
      </button>
    </div>
  );
};

export default StockControls;
