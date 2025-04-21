import React, { useState } from "react";
import "./AddLocationModal.css";

const AddLocationModal = ({ onClose }) => {
  const [shelfLocation, setShelfLocation] = useState("");
  const [storageType, setStorageType] = useState("Dry");
  const [zone, setZone] = useState("A - Fast moving");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const zoneLetter = zone.charAt(0); // A/B/C

    try {
      await fetch("http://127.0.0.1:8000/add-location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shelf_location: shelfLocation,
          storage_type: storageType,
          zone: zoneLetter,
        }),
      });

      alert("✅ Storage location added successfully!");
      onClose();
    } catch (err) {
      console.error("❌ Error adding storage location:", err);
      alert("❌ Failed to add storage location");
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h3>Add Storage Location</h3>
        <form onSubmit={handleSubmit}>
          <label>
            Location Name:
            <input
              type="text"
              value={shelfLocation}
              onChange={(e) => setShelfLocation(e.target.value)}
              required
            />
          </label>
          <label>
            Storage Type:
            <select
              value={storageType}
              onChange={(e) => setStorageType(e.target.value)}
              required
            >
              <option value="Dry">Dry</option>
              <option value="Fridge">Fridge</option>
              <option value="Freezer">Freezer</option>
            </select>
          </label>
          <label>
            Zone:
            <select
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              required
            >
              <option>A - Fast moving</option>
              <option>B - Slow moving</option>
            </select>
          </label>

          <div style={{ marginTop: "1rem", display: "flex", gap: "10px" }}>
            <button type="submit" className="bg-green-600 text-white px-3 py-1 rounded">
              Submit
            </button>
            <button type="button" onClick={onClose} className="bg-gray-500 text-white px-3 py-1 rounded">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddLocationModal;
