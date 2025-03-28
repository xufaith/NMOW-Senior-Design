import React from "react";
import { useNavigate } from "react-router-dom";

const AddRemoveIngredient = () => {
  const navigate = useNavigate();

  return (
    <div className="p-4">
      <button 
        onClick={() => navigate('/add-ingredient')} 
        className="bg-green-500 text-white px-4 py-2 rounded"
      >
        Add New Ingredient
      </button>
    </div>
  );
};

export default AddRemoveIngredient;
