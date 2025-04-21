import React, { useState } from "react";
import AddLocationModal from "./AddLocationModal";

const AddLocationButton = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="bg-blue-600 text-white px-4 py-2 rounded ml-4"
      >
        Add Storage Location
      </button>
      {showModal && <AddLocationModal onClose={() => setShowModal(false)} />}
    </>
  );
};

export default AddLocationButton;
