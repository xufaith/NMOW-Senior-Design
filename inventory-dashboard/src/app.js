import React, { useState, useEffect, useCallback } from "react";
import { QueryClient, QueryClientProvider } from "react-query";
import { BrowserRouter as Router, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import IngredientList from "./components/IngredientList";
import ExpirationPage from "./components/ExpirationPage"; 
import SearchBar from "./components/SearchBar";
import IngredientDetails from "./components/IngredientDetails";
import MenuSubstitutions from "./components/MenuSubstitutions";  // ✅ Import new component
import AddIngredient from "./components/AddIngredient";
import AddIngredientButton from "./components/AddIngredientButton"; // Add this import at the top!
import axios from "axios";
import "./index.css";


const queryClient = new QueryClient();

function AppContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("inventory");
  const location = useLocation();
  const navigate = useNavigate();
  const [ingredients, setIngredients] = useState([]);

  // ✅ Fetch ingredients from backend
  const fetchIngredients = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchIngredients();
  }, [fetchIngredients]);

  useEffect(() => {
    if (location.pathname === "/expiration") {
      setActiveTab("expiration");
    } else if (location.pathname === "/menu-sub") {
      setActiveTab("menu-sub");
    } else {
      setActiveTab("inventory");
    }
  }, [location.pathname]);

  const handleExportCSV = () => {
    let table = document.querySelector("table");
    if (!table) return;

    let csv = [];
    let rows = table.querySelectorAll("tr");

    for (let row of rows) {
      let cols = row.querySelectorAll("th, td");
      let rowData = Array.from(cols).map(col => col.innerText.trim());
      csv.push(rowData.join(","));
    }

    let csvContent = "data:text/csv;charset=utf-8," + csv.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "filtered_data.csv");
    document.body.appendChild(link);
    link.click();
  };

  return (
    <>
      <div className="navbar">Neighborhood Meals on Wheels Inventory Application</div>

      {/* Tabs */}
      <div className="tabs-container">
        <button className={`tab-button ${activeTab === "inventory" ? "active" : ""}`} onClick={() => navigate("/")}>
          Inventory
        </button>
        <button className={`tab-button ${activeTab === "expiration" ? "active" : ""}`} onClick={() => navigate("/expiration")}>
          Expiration
        </button>
        <button className={`tab-button ${activeTab === "menu-sub" ? "active" : ""}`} onClick={() => navigate("/menu-sub")}>
          Menu Sub
        </button>
      </div>

      {/* Search and Export */}
      <div className="search-export-container">
        <SearchBar setSearchQuery={setSearchQuery} />
        <button className="export-btn" onClick={handleExportCSV}>Export to CSV</button>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <Routes>
          <Route
            path="/"
            element={
              <>
                <AddIngredientButton />
                <IngredientList 
                  searchQuery={searchQuery} 
                  ingredients={ingredients} 
                  fetchIngredients={fetchIngredients}  // ✅ Ensure updates reflect immediately
                />
              </>
            }
          />
          <Route path="/expiration" element={<ExpirationPage />} />
          <Route path="/menu-sub" element={<MenuSubstitutions />} />  {/* ✅ New route for menu subs */}
          <Route path="/ingredient/:barcode" element={<IngredientDetails />} />
          <Route path="/add-ingredient" element={<AddIngredient />} />
        </Routes>
      </div>
    </>
  );
}

// Wrap AppContent in BrowserRouter
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AppContent />
      </Router>
    </QueryClientProvider>
  );
}



export default App;
