import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const IngredientList = ({ searchQuery }) => {
    const [ingredients, setIngredients] = useState([]);
    const [filteredIngredients, setFilteredIngredients] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("All Categories");
    const [selectedStorage, setSelectedStorage] = useState("All Storage");
    const [quantityChanges, setQuantityChanges] = useState({});

    useEffect(() => {
        axios.get("http://127.0.0.1:8000/ingredients")
            .then((response) => {
                if (response.data.ingredients && Array.isArray(response.data.ingredients)) {
                    setIngredients(response.data.ingredients);
                    setFilteredIngredients(response.data.ingredients);
                } else {
                    console.error("Invalid data format:", response.data);
                    setIngredients([]);
                    setFilteredIngredients([]);
                }
            })
            .catch((error) => {
                console.error("Error fetching ingredients:", error);
                setIngredients([]);
                setFilteredIngredients([]);
            });
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

    // Calculate total servings dynamically
    const totalServings = filteredIngredients.reduce((sum, ing) => {
        const servingsPerContainer = ing.units_per_container || 1; // Default to 1 if not provided
        return sum + (ing.num_containers * servingsPerContainer);
    }, 0);

    // Handle quantity input change
    const handleQuantityChange = (barcode, value) => {
        setQuantityChanges(prev => ({
            ...prev,
            [barcode]: value,
        }));
    };

    // Update quantity based on input
    const updateQuantity = (barcode, change) => {
        setFilteredIngredients(prevState =>
            prevState.map(ingredient =>
                ingredient.barcode === barcode
                    ? { ...ingredient, num_containers: Math.max(0, ingredient.num_containers + change) }
                    : ingredient
            )
        );
    };

    return (
        <div>
            {/* Filters */}
            <div className="filter-container">
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
            {/* Total Servings Count (Smaller Text) */}
            <h3 style={{ fontSize: "16px", fontWeight: "normal", marginBottom: "10px" }}>
                Total Servings: <strong>{totalServings}</strong>
            </h3>
            </div>



            {/* Table */}
            {filteredIngredients.length > 0 ? (
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Brand</th>
                            <th>Quantity</th>
                            <th>Container</th>
                            <th>Storage Location</th>
                            <th>Servings</th> {/* ✅ New Column */}
                            <th>Actions</th>
                            <th>Edit</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredIngredients.map((ingredient) => {
                            const servingsPerContainer = ingredient.units_per_container || 1; // Default to 1 if not provided
                            const totalIngredientServings = ingredient.num_containers * servingsPerContainer;

                            return (
                                <tr key={ingredient.barcode}>
                                    <td>{ingredient.ingredient_name}</td>
                                    <td>{ingredient.brand}</td>
                                    <td>{ingredient.num_containers}</td>
                                    <td>{ingredient.container_type}</td>
                                    <td>{ingredient.storage_location}</td>
                                    <td>{totalIngredientServings}</td> {/* ✅ Servings column */}
                                    <td>
                                        <input
                                            type="number"
                                            min="1"
                                            className="qty-input"
                                            value={quantityChanges[ingredient.barcode] || ""}
                                            onChange={(e) => handleQuantityChange(ingredient.barcode, parseInt(e.target.value) || 0)}
                                        />
                                        <button className="button" onClick={() => updateQuantity(ingredient.barcode, quantityChanges[ingredient.barcode] || 1)}>+</button>
                                        <button className="button" onClick={() => updateQuantity(ingredient.barcode, -(quantityChanges[ingredient.barcode] || 1))}>-</button>
                                    </td>
                                    <td>
                                        <Link to={`/ingredient/${ingredient.barcode}`}>Edit</Link>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            ) : (
                <p>No ingredients found.</p>
            )}
        </div>
    );
};

export default IngredientList;
