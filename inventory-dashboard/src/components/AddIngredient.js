import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const AddIngredient = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    barcode: "",
    ingredient_name: "",
    num_containers: "",
    units_per_container: "",
    unit: "Servings",
    expiration_date: "",
    storage_location: "",
    item_category: "",
    storage_type: "",
    container_type: "",
    brand: "",
    tefap: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // ✅ Explicitly convert numeric values before sending to backend
      const dataToSend = {
        ...formData,
        num_containers: parseInt(formData.num_containers, 10),
        units_per_container: parseFloat(formData.units_per_container),
      };

      await axios.post("http://127.0.0.1:8000/add", dataToSend);
      alert("Ingredient added successfully!");
      navigate("/");
    } catch (error) {
      console.error(error);
      alert(`Error adding ingredient: ${error.response?.data?.detail || error.message}`);
    }
  };

  return (
    <div className="container p-6">
      <h2 className="text-xl font-bold mb-4">Add New Ingredient</h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
        <input name="barcode" placeholder="Barcode" value={formData.barcode} onChange={handleChange} required className="border p-2" />
        <input name="ingredient_name" placeholder="Ingredient Name" value={formData.ingredient_name} onChange={handleChange} required className="border p-2" />
        <input name="num_containers" type="number" placeholder="Quantity" value={formData.num_containers} onChange={handleChange} required className="border p-2" />
        <input name="units_per_container" type="number" placeholder="Units per Container" value={formData.units_per_container} onChange={handleChange} required className="border p-2" />
        <input name="unit" placeholder="Unit" value={formData.unit} onChange={handleChange} required className="border p-2" />
        <input name="expiration_date" type="date" placeholder="Expiration Date" value={formData.expiration_date} onChange={handleChange} className="border p-2" />
        <input name="storage_location" placeholder="Storage Location" value={formData.storage_location} onChange={handleChange} className="border p-2" />
        <input name="item_category" placeholder="Item Category" value={formData.item_category} onChange={handleChange} className="border p-2" />
        <input name="storage_type" placeholder="Storage Type" value={formData.storage_type} onChange={handleChange} className="border p-2" />
        <input name="container_type" placeholder="Container Type" value={formData.container_type} onChange={handleChange} className="border p-2" />
        <input name="brand" placeholder="Brand" value={formData.brand} onChange={handleChange} className="border p-2" />
        <label className="flex items-center">
          <input name="tefap" type="checkbox" checked={formData.tefap} onChange={handleChange} className="mr-2" />
          TEFAP
        </label>
        <div className="col-span-2 flex gap-2">
          <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">Save</button>
          <button type="button" onClick={() => navigate("/")} className="bg-gray-300 text-black px-4 py-2 rounded">Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default AddIngredient;
