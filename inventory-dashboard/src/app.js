import React, { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "react-query";
import { BrowserRouter as Router, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import IngredientList from "./components/IngredientList";
import ExpirationPage from "./components/ExpirationPage";  // Expiration Page
import AddRemoveIngredient from "./components/AddRemoveIngredient";
import SearchBar from "./components/SearchBar";
import IngredientDetails from "./components/IngredientDetails";
import "./index.css";

const queryClient = new QueryClient();

function AppContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("inventory");

  const location = useLocation(); // Get the current route
  const navigate = useNavigate(); // Hook for navigation

  // Automatically switch active tab when route changes
  useEffect(() => {
    if (location.pathname === "/expiration") {
      setActiveTab("expiration");
    } else {
      setActiveTab("inventory");
    }
  }, [location.pathname]);

  const handleExportCSV = () => {
    let table = document.querySelector("table");
    if (!table) return; // No table found

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
      <div className="navbar">
        Neighborhood Meals on Wheels Inventory Application
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <button
          className={`tab-button ${activeTab === "inventory" ? "active" : ""}`}
          onClick={() => navigate("/")}
        >
          Inventory
        </button>
        <button
          className={`tab-button ${activeTab === "expiration" ? "active" : ""}`}
          onClick={() => navigate("/expiration")}
        >
          Expiration
        </button>
      </div>

      {/* Search and Export */}
      <div className="search-export-container">
        <SearchBar setSearchQuery={setSearchQuery} />
        <button className="export-btn" onClick={handleExportCSV}>
          Export to CSV
        </button>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <Routes>
          <Route
            path="/"
            element={
              <>
                <AddRemoveIngredient />
                <IngredientList searchQuery={searchQuery} />
              </>
            }
          />
          <Route path="/expiration" element={<ExpirationPage />} />
          <Route path="/ingredient/:barcode" element={<IngredientDetails />} />
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
