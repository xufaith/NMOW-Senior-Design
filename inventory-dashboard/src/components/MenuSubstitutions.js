import React, { useEffect, useState } from "react";
import Select from "react-select";
import axios from "axios";
import "./MenuSubstitutions.css";

const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

// Define allowed item categories for each meal input
const categoryMap = {
  protein: ["Protein entrée", "Carb & protein entrée", "Canned entrée"],
  starch: ["Starch (dry & frozen)", "Beans", "Carb & protein entrée", "Canned entrée"],
  vegetable: ["Veg (dry & frozen)", "Beans", "Canned entrée"],
  dessert: ["Dessert", "Snack"],
};

const MenuSubstitutions = () => {
  const [ingredients, setIngredients] = useState([]);
  const [menu, setMenu] = useState({});
  const [mealsPerDay, setMealsPerDay] = useState({});

  useEffect(() => {
    const fetchIngredients = async () => {
      try {
        const res = await axios.get("http://127.0.0.1:8000/ingredients");
        setIngredients(res.data.ingredients);
      } catch (err) {
        console.error("Failed to fetch ingredients", err);
      }
    };
    fetchIngredients();
  }, []);

  const handleSelect = (day, mealType, category, selectedOption) => {
    setMenu((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [mealType]: {
          ...prev[day]?.[mealType],
          [category]: selectedOption?.value || null,
        },
      },
    }));
  };

  const getFilteredOptions = (category) => {
    return ingredients
      .filter((item) => categoryMap[category]?.includes(item.item_category))
      .map((item) => ({
        label: item.ingredient_name,
        value: item.ingredient_name,
      }));
  };

  return (
    <div className="menu-substitutions">
      <h2>Menu Substitutions</h2>
      <p>Select ingredients for each day's menu and check if they are feasible.</p>

      <div className="menu-container">
        {weekdays.map((day) => (
          <div key={day} className="day-column">
            <h3>{day}</h3>
            <label># of Meals:</label>
            <input
              type="number"
              min="1"
              value={mealsPerDay[day] || ""}
              onChange={(e) => setMealsPerDay({ ...mealsPerDay, [day]: e.target.value })}
            />

            <h4>Hot Meal</h4>
            <label>Protein:</label>
            <Select
              options={getFilteredOptions("protein")}
              onChange={(option) => handleSelect(day, "hot", "protein", option)}
              isSearchable
            />

            <label>Vegetable:</label>
            <Select
              options={getFilteredOptions("vegetable")}
              onChange={(option) => handleSelect(day, "hot", "vegetable", option)}
              isSearchable
            />

            <label>Starch:</label>
            <Select
              options={getFilteredOptions("starch")}
              onChange={(option) => handleSelect(day, "hot", "starch", option)}
              isSearchable
            />

            <h4>Cold Meal</h4>
            <label>Dessert:</label>
            <Select
              options={getFilteredOptions("dessert")}
              onChange={(option) => handleSelect(day, "cold", "dessert", option)}
              isSearchable
            />

            <label>Vegetable:</label>
            <Select
              options={getFilteredOptions("vegetable")}
              onChange={(option) => handleSelect(day, "cold", "vegetable", option)}
              isSearchable
            />
          </div>
        ))}
      </div>

      <button className="check-feasibility">Check Feasibility</button>

      <div className="substitutions-section">
        <h3>Substitution Suggestions</h3>
        <p>(This will display substitution recommendations once implemented.)</p>
      </div>
    </div>
  );
};

export default MenuSubstitutions;
