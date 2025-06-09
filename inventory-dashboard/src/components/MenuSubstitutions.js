import React, { useState, useEffect } from "react";
import Select from "react-select";
import axios from "axios";
import "./MenuSubstitutions.css";

const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const categoryFilters = {
  protein: ["Protein Entree", "Starch and Protein Entree", "Canned Entree"],
  hotSide: ["Vegetable", "Starch", "Beans", "Starch and Protein Entree", "Canned Entree"],
  dessertSnack: ["Dessert", "Snack"],
  fruitSalad: [
    { category: "Fruit", storage: ["Dry", "Fridge"] },
    { category: "Vegetable", storage: ["Fridge"] },
  ],
  fruitSnack: [
    { category: "Fruit", storage: ["Dry", "Fridge"] },
    { category: "Snack" },
  ],
  sauce: ["Sauce"],
};

const filterIngredients = (ingredients, filterSet) =>
  ingredients.filter((item) =>
    Array.isArray(filterSet) &&
    filterSet.some((f) =>
      typeof f === "string"
        ? item.item_category === f
        : item.item_category === f.category && (!f.storage || f.storage.includes(item.storage_type))
    )
  );

const StatusTag = ({ status }) => {
  const statusStyles = {
    sufficient: { color: "green", label: "✅" },
    insufficient: { color: "orange", label: "⚠️" },
    missing: { color: "red", label: "❌" },
    not_found: { color: "gray", label: "❌" },
  };
  const style = statusStyles[status] || {};
  return (
    <span style={{ color: style.color, fontWeight: "bold", marginRight: "6px" }}>
      {style.label}
    </span>
  );
};

const cleanLabel = (text) =>
  text.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

const SuggestionTable = ({ suggestions, fieldId, selectedSuggestions, handleSuggestionSelect }) => (
  <table className="suggestion-table">
    <thead>
      <tr>
        <th>Select</th>
        <th>Ingredient</th>
        <th>Servings</th>
        <th>Expires</th>
      </tr>
    </thead>
    <tbody>
      {suggestions.map((sug, index) => (
        <tr key={index}>
          <td>
            <input
              type="checkbox"
              checked={selectedSuggestions[fieldId]?.index === index}
              onChange={() => handleSuggestionSelect(fieldId, index, sug)}
            />
          </td>
          <td>{sug.ingredient_name}</td>
          <td>{sug.servings}</td>
          <td>{sug.expires || "—"}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

const MenuSubstitutions = ({ setGroceryList }) => {
  const [menu, setMenu] = useState({});
  const [mealsPerDay, setMealsPerDay] = useState({});
  const [ingredients, setIngredients] = useState([]);
  const [results, setResults] = useState({});
  const [expanded, setExpanded] = useState({});
  const [selectedSuggestions, setSelectedSuggestions] = useState({});
  const [finalOutput, setFinalOutput] = useState({});

  useEffect(() => {
    const fetchIngredients = async () => {
      try {
        const res = await axios.get("https://nmow-app-33048e3a88a5.herokuapp.com/ingredients");
        if (Array.isArray(res.data.ingredients)) {
          setIngredients(res.data.ingredients);
        }
      } catch (err) {
        console.error("Error fetching ingredients:", err);
      }
    };
    fetchIngredients();
  }, []);

  const calculateServings = (item) =>
    Math.round(item.num_containers * (item.units_per_container || 1));

  const handleSelect = (day, mealType, field, selectedOption) => {
    setMenu((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [mealType]: {
          ...prev[day]?.[mealType],
          [field]: selectedOption ? selectedOption.value : null,
        },
      },
    }));
  };

  const handleSuggestionSelect = (fieldId, index, suggestion) => {
    setSelectedSuggestions((prev) => ({
      ...prev,
      [fieldId]: { index, suggestion },
    }));
  };

  const renderSelect = (day, mealType, field, label, options, optional = false) => {
    const formattedOptions = options.map((i) => ({
      value: i.ingredient_name,
      label: i.brand
        ? `${i.ingredient_name} (${i.brand}/${calculateServings(i)})`
        : `${i.ingredient_name} (${calculateServings(i)})`,
    }));

    const selectedIngredient = menu[day]?.[mealType]?.[field];
    const selectedBrand = options.find(i => i.ingredient_name === selectedIngredient)?.brand;

    return (
      <div className="select-field">
        <label>{label}{optional ? " (optional)" : ""}</label>
        <Select
          isClearable={optional}
          isSearchable
          options={formattedOptions}
          value={
            selectedIngredient
              ? {
                  value: selectedIngredient,
                  label: selectedBrand
                    ? `${selectedIngredient} (${selectedBrand})`
                    : selectedIngredient,
                }
              : null
          }
          onChange={(option) => handleSelect(day, mealType, field, option)}
        />
      </div>
    );
  };

  const handleCheckFeasibility = async () => {
    try {
      const res = await axios.post("https://nmow-app-33048e3a88a5.herokuapp.com/check_feasibility", {
        menu,
        meals_per_day: mealsPerDay,
      });
      setResults(res.data?.results || {});
    } catch (err) {
      console.error("Error checking feasibility:", err);
    }
  };

  const handleSaveOutput = async () => {
    try {
      const res = await axios.post("https://nmow-app-33048e3a88a5.herokuapp.com/finalize_menu", {
        menu,
        meals_per_day: mealsPerDay,
        selected_substitutions: selectedSuggestions,
      });
      setFinalOutput(res.data.final_output_menu || {});
      if (setGroceryList) {
        setGroceryList(res.data.grocery_list || []);
      }
    } catch (err) {
      console.error("Error finalizing menu:", err);
    }
  };

  return (
    <div className="menu-sub-container">
      <h2>Menu Substitutions</h2>

      <div className="menu-container">
        {weekdays.map((day) => (
          <div key={day} className="day-column">
            <h3>{day}</h3>
            <label># of Meals:</label>
            <input
              type="number"
              min="1"
              value={mealsPerDay[day] || ""}
              onChange={(e) =>
                setMealsPerDay({ ...mealsPerDay, [day]: parseInt(e.target.value || 0) })
              }
            />
            <h4>Hot Tray</h4>
            {renderSelect(day, "hot", "protein", "Protein", filterIngredients(ingredients, categoryFilters.protein), true)}
            {renderSelect(day, "hot", "hot_side_1", "Hot Side 1", filterIngredients(ingredients, categoryFilters.hotSide), true)}
            {renderSelect(day, "hot", "hot_side_2", "Hot Side 2", filterIngredients(ingredients, categoryFilters.hotSide), true)}
            {renderSelect(day, "hot", "sauce_hot", "Sauce", filterIngredients(ingredients, categoryFilters.sauce), true)}

            <h4>Cold Tray</h4>
            {renderSelect(day, "cold", "dessert_snack", "Dessert/Snack", filterIngredients(ingredients, categoryFilters.dessertSnack), true)}
            {renderSelect(day, "cold", "fruit_salad", "Fruit/Salad", filterIngredients(ingredients, categoryFilters.fruitSalad), true)}
            {renderSelect(day, "cold", "fruit_snack", "Fruit/Snack", filterIngredients(ingredients, categoryFilters.fruitSnack), true)}
            {renderSelect(day, "cold", "sauce_cold", "Sauce", filterIngredients(ingredients, categoryFilters.sauce), true)}
          </div>
        ))}
      </div>

      <button className="check-feasibility" onClick={handleCheckFeasibility}>
        Check Feasibility
      </button>

      {Object.keys(results).length > 0 && (
        <div className="substitutions-section">
          <h3>Substitution Suggestions</h3>
          {Object.entries(results).map(([day, trays]) => (
            <div key={day}>
              <h4>{day}</h4>
              {Object.entries(trays).map(([trayType, fields]) => (
                <div key={trayType} className="tray-card">
                  <h5>{trayType.toUpperCase()} Tray</h5>
                  {Object.entries(fields).map(([field, result]) => {
                    const fieldKey = `${day}-${trayType}-${field}`;
                    return (
                      <div key={fieldKey} className="tray-field">
                        <StatusTag status={result.status} />
                        <strong>{cleanLabel(field)}</strong>: {result.status}
                        {["sufficient", "insufficient"].includes(result.status) && (
                          <p><small>Available: {result.servings_available} / Needed: {result.needed}</small></p>
                        )}
                        {result.status === "insufficient" && result.substitutions?.length > 0 && (
                          <>
                            <button className="toggle-btn" onClick={() =>
                              setExpanded((prev) => ({ ...prev, [fieldKey]: !prev[fieldKey] }))
                            }>
                              {expanded[fieldKey] ? "Hide Suggestions" : "Show Suggestions"}
                            </button>
                            {expanded[fieldKey] && (
                              <SuggestionTable
                                suggestions={result.substitutions}
                                fieldId={fieldKey}
                                selectedSuggestions={selectedSuggestions}
                                handleSuggestionSelect={handleSuggestionSelect}
                              />
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ))}
          <button className="save-output" onClick={handleSaveOutput}>Save Selections</button>
        </div>
      )}

      {Object.keys(finalOutput).length > 0 && (
        <div className="output-menu">
          <h3>Final Output Menu</h3>
          {weekdays.map((day) =>
            finalOutput[day] ? (
              <div key={day}>
                <h4>{day}</h4>
                {["hot", "cold"].map((tray) =>
                  finalOutput[day][tray]?.length > 0 ? (
                    <div key={tray}>
                      <h5>{tray.toUpperCase()} Tray</h5>
                      <table>
                        <thead>
                          <tr>
                            <th>Field</th>
                            <th>Item</th>
                            <th>Brand</th>
                            <th>Servings</th>
                            <th>Containers</th>
                            <th>Container Type</th>
                            <th>Location</th>
                          </tr>
                        </thead>
                        <tbody>
                          {finalOutput[day][tray].map((item, idx) => (
                            <tr key={idx}>
                              <td>{cleanLabel(item.field)}</td>
                              <td>{item.item}</td>
                              <td>{item.brand || "-"}</td>
                              <td>{item.servings_needed}</td>
                              <td>{item.containers}</td>
                              <td>{item.container_type}</td>
                              <td>{item.location}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null
                )}
              </div>
            ) : null
          )}
        </div>
      )}
    </div>
  );
};

export default MenuSubstitutions;
