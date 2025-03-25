import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import StockControls from "./StockControls";

const IngredientList = ({ searchQuery }) => {
  const [ingredients, setIngredients] = useState([]);
  const [filteredIngredients, setFilteredIngredients] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedStorage, setSelectedStorage] = useState("All Storage");

  const fetchIngredients = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:8000/ingredients");
      if (response.data.ingredients && Array.isArray(response.data.ingredients)) {
        setIngredients(response.data.ingredients);
      } else {
        console.error("Invalid data format:", response.data);
        setIngredients([]);
      }
    } catch (error) {
      console.error("Error fetching ingredients:", error);
      setIngredients([]);
    }
  };

  useEffect(() => {
    fetchIngredients(); // Fetch data on mount
  }, []);

  useEffect(() => {
    let filtered = [...ingredients];

    if (selectedCategory !== "All Categories") {
      filtered = filtered.filter(ing => ing.item_category === selectedCategory);
    }

    if (selectedStorage !== "All Storage") {
      filtered = filtered.filter(ing => ing.storage_location === selectedStorage);
    }

    if (searchQuery) {
      filtered = filtered.filter(ing =>
        ing.ingredient_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredIngredients(filtered);
  }, [searchQuery, selectedCategory, selectedStorage, ingredients]);

  // ✅ Calculate total servings (Rounded to integer)
  const totalServings = Math.round(
    filteredIngredients.reduce((sum, ing) => sum + ing.num_containers * (ing.units_per_container || 1), 0)
  );

  return (
    <div>
      <div className="filter-container" style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        <select onChange={(e) => setSelectedCategory(e.target.value)} className="filter-dropdown">
          <option>All Categories</option>
          {[...new Set(ingredients.map(ing => ing.item_category))].map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>

        <select onChange={(e) => setSelectedStorage(e.target.value)} className="filter-dropdown">
          <option>All Storage</option>
          {[...new Set(ingredients.map(ing => ing.storage_location))].map(storage => (
            <option key={storage} value={storage}>{storage}</option>
          ))}
        </select>

        {/* ✅ Vertically Centered Total Servings */}
        <span style={{
          fontWeight: "bold",
          fontSize: "15px",
          marginRight: "auto", 
          alignSelf: "center" // Vertically center
        }}>
          Total Servings: {totalServings}
        </span>
      </div>

      {filteredIngredients.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Brand</th>
              <th>Quantity</th>
              <th>Container</th>
              <th>Storage Location</th>
              <th>Servings</th>
              <th>Actions</th>
              <th>Edit</th>
            </tr>
          </thead>
          <tbody>
            {filteredIngredients.map((ingredient) => (
              <tr key={ingredient.barcode}>
                <td>{ingredient.ingredient_name}</td>
                <td>{ingredient.brand}</td>
                <td>{ingredient.num_containers}</td>
                <td>{ingredient.container_type}</td>
                <td>{ingredient.storage_location}</td>
                <td>{Math.round(ingredient.num_containers * (ingredient.units_per_container || 1))}</td>
                <td>
                  <StockControls ingredient={ingredient} setIngredients={setIngredients} />
                </td>
                <td>
                  <Link to={`/ingredient/${ingredient.barcode}`}>Edit</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No ingredients found.</p>
      )}
    </div>
  );
};

export default IngredientList;
