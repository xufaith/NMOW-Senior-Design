import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const AddIngredient = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
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

  const [availableLocations, setAvailableLocations] = useState([]);

  const itemCategories = [
    "Vegetable",
    "Starch",
    "Fruit",
    "Canned Entree",
    "Sauce",
    "Misc",
    "Dessert",
    "Beans",
    "Snack",
    "Protein Entree",
    "Starch and Protein Entree",
  ];

  const storageTypes = ["Dry", "Fridge", "Freezer"];

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await axios.get("https://nmow-app-33048e3a88a5.herokuapp.com/locations");
        if (Array.isArray(response.data)) {
          setAvailableLocations(response.data);
        }
      } catch (error) {
        console.error("Error fetching locations:", error);
      }
    };

    fetchLocations();
  }, []);

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
      const dataToSend = {
        ...formData,
        barcode: Date.now().toString(), // auto-generate barcode
        num_containers: parseInt(formData.num_containers, 10),
        units_per_container: parseFloat(formData.units_per_container),
        expiration_date: formData.expiration_date || null,
      };

      await axios.post("https://nmow-app-33048e3a88a5.herokuapp.com/add", dataToSend);
      alert("Ingredient added successfully!");
      navigate("/");
    } catch (error) {
      console.error(error);
      alert(`Error adding ingredient: ${error.response?.data?.detail || error.message}`);
    }
  };

  return (
    <div className="form-container bg-white shadow-md rounded-md p-6">
      <h2 className="text-xl font-bold mb-4">Add New Ingredient</h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">

        <input name="ingredient_name" placeholder="Ingredient Name" value={formData.ingredient_name} onChange={handleChange} required className="border p-2" />
        <input name="num_containers" type="number" placeholder="Quantity" value={formData.num_containers} onChange={handleChange} required className="border p-2" />
        <input name="container_type" placeholder="Container Type" value={formData.container_type} onChange={handleChange} className="border p-2" />
        <input name="units_per_container" type="number" placeholder="Units per Container" value={formData.units_per_container} onChange={handleChange} required className="border p-2" />
        <input name="unit" placeholder="Unit" value={formData.unit} onChange={handleChange} required className="border p-2" />
        <input name="expiration_date" type="date" placeholder="Expiration Date" value={formData.expiration_date} onChange={handleChange} className="border p-2" />

        {/* ✅ Storage Location dropdown from Supabase */}
        <select name="storage_location" value={formData.storage_location} onChange={handleChange} className="border p-2" required>
          <option value="">Select Storage Location</option>
          {availableLocations.map((loc) => (
            <option key={loc.shelf_location} value={loc.shelf_location}>
              {loc.shelf_location} ({loc.storage_type})
            </option>
          ))}
        </select>

        {/* ✅ Item Category dropdown */}
        <select name="item_category" value={formData.item_category} onChange={handleChange} className="border p-2 col-span-2" required>
          <option value="">Select Item Category</option>
          {itemCategories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        {/* ✅ Storage Type dropdown */}
        <select name="storage_type" value={formData.storage_type} onChange={handleChange} className="border p-2 col-span-2" required>
          <option value="">Select Storage Type</option>
          {storageTypes.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>

        <input name="brand" placeholder="Brand" value={formData.brand} onChange={handleChange} className="border p-2" />

        <label className="flex items-center col-span-2">
          <input name="tefap" type="checkbox" checked={formData.tefap} onChange={handleChange} className="mr-2" />
          TEFAP
        </label>

        <div className="col-span-2 flex gap-4 mt-4">
          <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">Save</button>
          <button type="button" onClick={() => navigate("/")} className="bg-gray-300 text-black px-4 py-2 rounded">Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default AddIngredient;
