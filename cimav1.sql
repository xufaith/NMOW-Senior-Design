-- Create the Ingredients table
CREATE TABLE Ingredients (
    ingredient_id INT NOT NULL PRIMARY KEY IDENTITY(1,1), -- Unique ID for each ingredient, auto-increment
    ingredient_name NVARCHAR(50) NOT NULL,               -- Name of the ingredient
    category NVARCHAR(50),                               -- Category of the ingredient (optional)
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,          -- Current stock level
    unit NVARCHAR(10) NOT NULL,                         -- Unit of measurement (e.g., kg, lbs, boxes)
    expiry_date DATE,                                    -- Expiry date for the ingredient (optional)
    storage_location NVARCHAR(50),                      -- Storage location (optional)
    last_updated DATETIME DEFAULT GETDATE()             -- Auto-updated timestamp
);

-- Create the Transactions table
CREATE TABLE Transactions (
    transaction_id INT NOT NULL PRIMARY KEY IDENTITY(1,1), -- Unique ID for each transaction, auto-increment
    ingredient_id INT NOT NULL,                            -- Links to the Ingredients table
    transaction_type NVARCHAR(10) NOT NULL,               -- Type of transaction (e.g., add, remove)
    quantity DECIMAL(10, 2) NOT NULL,                     -- Quantity involved in the transaction
    transaction_date DATETIME DEFAULT GETDATE(),          -- Timestamp of the transaction
    notes NVARCHAR(255),                                  -- Optional notes about the transaction
    CONSTRAINT FK_Ingredient FOREIGN KEY (ingredient_id) REFERENCES Ingredients(ingredient_id) ON DELETE CASCADE
);
