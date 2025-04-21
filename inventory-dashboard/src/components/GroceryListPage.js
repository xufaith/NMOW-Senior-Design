import React, { useEffect, useState } from "react";
import axios from "axios";

const GroceryListPage = () => {
  const [groceryList, setGroceryList] = useState([]);

  useEffect(() => {
    const fetchGroceryList = async () => {
      try {
        const response = await axios.get("http://127.0.0.1:8000/grocery_list");
        setGroceryList(response.data.grocery_list || []);
      } catch (error) {
        console.error("Error fetching grocery list:", error);
        setGroceryList([]);
      }
    };

    fetchGroceryList();
  }, []);

  return (
    <div className="grocery-list-tab">
      <h2>Grocery List</h2>
      <p><em>This will update after "Save Selections" is clicked on the Menu Sub.</em></p>

      {groceryList.length === 0 ? (
        <p>No items in the grocery list.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Brand</th>
              <th>Qty</th>
            </tr>
          </thead>
          <tbody>
            {groceryList.map((g, idx) => (
              <tr key={idx}>
                <td>{g.item}</td>
                <td>{g.brand || "-"}</td>
                <td>{g.qty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default GroceryListPage;
