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

const filterIngredients = (ingredients, filterSet) => {
  return ingredients.filter((item) =>
    Array.isArray(filterSet) &&
    filterSet.some((f) =>
      typeof f === "string"
        ? item.item_category === f
        : item.item_category === f.category && (!f.storage || f.storage.includes(item.storage_type))
    )
  );
};

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

const cleanLabel = (text) => {
  return text
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const SuggestionTable = ({ suggestions, fieldId }) => (
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
          <td><input type="checkbox" name={`${fieldId}-${index}`} /></td>
          <td>{sug.ingredient_name}</td>
          <td>{sug.servings}</td>
          <td>{sug.expires || "—"}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

const MenuSubstitutions = () => {
  const [menu, setMenu] = useState({});
  const [mealsPerDay, setMealsPerDay] = useState({});
  const [ingredients, setIngredients] = useState([]);
  const [results, setResults] = useState({});
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    const fetchIngredients = async () => {
      try {
        const response = await axios.get("http://127.0.0.1:8000/ingredients");
        if (Array.isArray(response.data.ingredients)) {
          setIngredients(response.data.ingredients);
        }
      } catch (err) {
        console.error("Fetch error:", err);
      }
    };
    fetchIngredients();
  }, []);

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

  const renderSelect = (day, mealType, field, label, options, optional = false) => {
    const formattedOptions = options.map((i) => ({
      value: i.ingredient_name,
      label: i.brand ? `${i.ingredient_name} (${i.brand})` : i.ingredient_name,
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
      const payload = { menu, meals_per_day: mealsPerDay };
      const res = await axios.post("http://127.0.0.1:8000/check_feasibility", payload);
      setResults(res.data?.results || {});
    } catch (err) {
      console.error("Feasibility check error:", err);
    }
  };

  return (
    <div className="menu-sub-container">
      <h2>Menu Substitutions</h2>
      <p>Select ingredients and check if they are feasible with current inventory.</p>

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
            {renderSelect(day, "hot", "protein", "Protein", filterIngredients(ingredients, categoryFilters.protein))}
            {renderSelect(day, "hot", "hot_side_1", "Hot Side 1", filterIngredients(ingredients, categoryFilters.hotSide))}
            {renderSelect(day, "hot", "hot_side_2", "Hot Side 2", filterIngredients(ingredients, categoryFilters.hotSide))}
            {renderSelect(day, "hot", "sauce_hot", "Sauce", filterIngredients(ingredients, categoryFilters.sauce), true)}

            <h4>Cold Tray</h4>
            {renderSelect(day, "cold", "dessert_snack", "Dessert/Snack", filterIngredients(ingredients, categoryFilters.dessertSnack))}
            {renderSelect(day, "cold", "fruit_salad", "Fruit/Salad", filterIngredients(ingredients, categoryFilters.fruitSalad))}
            {renderSelect(day, "cold", "fruit_snack", "Fruit/Snack", filterIngredients(ingredients, categoryFilters.fruitSnack))}
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
                  <h5>{trayType.toUpperCase()}</h5>
                  {Object.entries(fields).map(([field, result]) => {
                    const isHot = ["protein", "hot_side_1", "hot_side_2", "sauce_hot"].includes(field);
                    const isCold = ["dessert_snack", "fruit_salad", "fruit_snack", "sauce_cold"].includes(field);
                    if ((trayType === "hot" && !isHot) || (trayType === "cold" && !isCold)) return null;

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
        </div>
      )}
    </div>
  );
};

export default MenuSubstitutions;
