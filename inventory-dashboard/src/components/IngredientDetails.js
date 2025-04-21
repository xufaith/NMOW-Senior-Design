import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const IngredientDetails = () => {
  const { barcode } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");

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
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSave = async () => {
    try {
      await axios.put(`http://127.0.0.1:8000/update-ingredient/${barcode}`, formData);
      alert("Ingredient updated successfully!");
      navigate("/");
    } catch (error) {
      console.error("Error updating ingredient:", error);
      alert("Failed to update ingredient");
    }
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm("Are you sure you want to delete this ingredient?");
    if (!confirmDelete) return;

    try {
      await axios.delete(`http://127.0.0.1:8000/remove/${barcode}`);
      setSuccessMessage("✅ Ingredient successfully deleted.");
      setTimeout(() => navigate("/"), 2000); // Redirect after 2s
    } catch (error) {
      console.error("Error deleting ingredient:", error);
      alert("Failed to delete ingredient");
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!formData) return <p>Error: Ingredient not found</p>;

  return (
    <div className="container">
      <h2>Edit Ingredient</h2>

      {successMessage && (
        <div className="success-alert" style={{ color: "green", marginBottom: "10px" }}>
          {successMessage}
        </div>
      )}

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

        <label className="flex items-center">
          <input
            name="tefap"
            type="checkbox"
            checked={formData.tefap === true || formData.tefap === "true"}
            onChange={handleChange}
            className="mr-2"
          />
          TEFAP
        </label>

        <div className="button-group">
          <button type="button" onClick={handleSave} className="save-button">Save</button>
          <button type="button" onClick={() => navigate("/")} className="cancel-button">Cancel</button>
          <button
            type="button"
            onClick={handleDelete}
            className="delete-button"
            style={{ backgroundColor: "#ff4d4f", color: "white", marginLeft: "10px" }}
          >
            Delete
          </button>
        </div>
      </form>
    </div>
  );
};

export default IngredientDetails;
