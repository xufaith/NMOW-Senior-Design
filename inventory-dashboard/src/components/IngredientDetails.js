import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const IngredientDetails = () => {
  const { barcode } = useParams(); // Get barcode from URL
  const navigate = useNavigate(); // Navigation function
  const [formData, setFormData] = useState(null); // State to hold ingredient details
  const [loading, setLoading] = useState(true); // Loading state

  useEffect(() => {
    const fetchIngredient = async () => {
      try {
        const { data } = await axios.get(`http://127.0.0.1:8000/ingredient/${barcode}`);
        setFormData(data);
      } catch (error) {
        console.error("Error fetching ingredient:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchIngredient();
  }, [barcode]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      await axios.put(`http://127.0.0.1:8000/update-ingredient/${barcode}`, formData);
      alert("Ingredient updated successfully!");
      navigate("/"); // Redirect back to main page
    } catch (error) {
      console.error("Error updating ingredient:", error);
      alert("Failed to update ingredient");
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!formData) return <p>Error: Ingredient not found</p>;

  return (
    <div className="container">
      <h2>Edit Ingredient</h2>
      <form className="ingredient-form">
        <label> Name:
          <input type="text" name="ingredient_name" value={formData.ingredient_name} onChange={handleChange} />
        </label>
        <label> Quantity:
          <input type="number" name="num_containers" value={formData.num_containers} onChange={handleChange} />
        </label>
        <label> Unit:
          <input type="text" name="unit" value={formData.unit} onChange={handleChange} />
        </label>
        <label> Expiration Date:
          <input type="date" name="expiration_date" value={formData.expiration_date} onChange={handleChange} />
        </label>
        <label> Storage Location:
          <input type="text" name="storage_location" value={formData.storage_location} onChange={handleChange} />
        </label>
        <label> Item Category:
          <input type="text" name="item_category" value={formData.item_category} onChange={handleChange} />
        </label>
        <label> Storage Type:
          <input type="text" name="storage_type" value={formData.storage_type} onChange={handleChange} />
        </label>
        <label> Container Type:
          <input type="text" name="container_type" value={formData.container_type} onChange={handleChange} />
        </label>
        <label> Brand:
          <input type="text" name="brand" value={formData.brand} onChange={handleChange} />
        </label>
        <label> TEFAP:
          <select name="tefap" value={formData.tefap} onChange={handleChange}>
            <option value={true}>Yes</option>
            <option value={false}>No</option>
          </select>
        </label>
        <div className="button-group">
          <button type="button" onClick={handleSave} className="save-button">Save</button>
          <button type="button" onClick={() => navigate("/")} className="cancel-button">Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default IngredientDetails;
