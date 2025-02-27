import React, { useEffect, useState } from "react";
import axios from "axios";

const ExpirationPage = () => {
    const [expiringIngredients, setExpiringIngredients] = useState([]);

    useEffect(() => {
        axios.get("http://127.0.0.1:8000/ingredients")
            .then((response) => {
                const today = new Date();
                const oneWeekOut = new Date();
                oneWeekOut.setDate(today.getDate() + 7); // 1 week
                const threeWeeksOut = new Date();
                threeWeeksOut.setDate(today.getDate() + 21); // 3 weeks

                const filteredIngredients = response.data.ingredients
                    .filter(ing => ing.expiration_date && new Date(ing.expiration_date) >= today) // Exclude items without expiration
                    .map((ing) => {
                        const expDate = new Date(ing.expiration_date);
                        let rowClass = "";

                        if (expDate <= oneWeekOut) {
                            rowClass = "red-row";  // Expiring within 1 week
                        } else if (expDate <= threeWeeksOut) {
                            rowClass = "yellow-row"; // Expiring within 1-3 weeks
                        } else {
                            return null; // Exclude items beyond 3 weeks
                        }

                        return { ...ing, rowClass };
                    })
                    .filter(ing => ing !== null) // Remove excluded items
                    .sort((a, b) => new Date(a.expiration_date) - new Date(b.expiration_date)); // Sort by soonest expiry

                setExpiringIngredients(filteredIngredients);
            })
            .catch((error) => console.error("Error fetching ingredients:", error));
    }, []);

    return (
        <div>
            <h2>Expiring Ingredients</h2>
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Brand</th>
                        <th>Quantity</th>
                        <th>Container</th>
                        <th>Storage Location</th>
                        <th>Expiration Date</th> {/* ✅ Removed Expiring Column */}
                    </tr>
                </thead>
                <tbody>
                    {expiringIngredients.map((ingredient) => (
                        <tr key={ingredient.barcode} className={ingredient.rowClass}>
                            <td>{ingredient.ingredient_name}</td>
                            <td>{ingredient.brand}</td>
                            <td>{ingredient.num_containers}</td>
                            <td>{ingredient.container_type}</td>
                            <td>{ingredient.storage_location}</td>
                            <td>{ingredient.expiration_date}</td> {/* ✅ Only expiration date */}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ExpirationPage;
