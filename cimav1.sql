-- -- Create the Ingredients table
-- CREATE TABLE Ingredients (
--     ingredient_id INT NOT NULL PRIMARY KEY IDENTITY(1,1), -- Unique ID for each ingredient, auto-increment
--     ingredient_name NVARCHAR(50) NOT NULL,               -- Name of the ingredient
--     category NVARCHAR(50),                               -- Category of the ingredient (optional)
--     quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,          -- Current stock level
--     unit NVARCHAR(10) NOT NULL,                         -- Unit of measurement (e.g., kg, lbs, boxes)
--     expiry_date DATE,                                    -- Expiry date for the ingredient (optional)
--     storage_location NVARCHAR(50),                      -- Storage location (optional)
--     last_updated DATETIME DEFAULT GETDATE()             -- Auto-updated timestamp
-- );

-- -- Create the Transactions table
-- CREATE TABLE Transactions (
--     transaction_id INT NOT NULL PRIMARY KEY IDENTITY(1,1), -- Unique ID for each transaction, auto-increment
--     ingredient_id INT NOT NULL,                            -- Links to the Ingredients table
--     transaction_type NVARCHAR(10) NOT NULL,               -- Type of transaction (e.g., add, remove)
--     quantity DECIMAL(10, 2) NOT NULL,                     -- Quantity involved in the transaction
--     transaction_date DATETIME DEFAULT GETDATE(),          -- Timestamp of the transaction
--     notes NVARCHAR(255),                                  -- Optional notes about the transaction
--     CONSTRAINT FK_Ingredient FOREIGN KEY (ingredient_id) REFERENCES Ingredients(ingredient_id) ON DELETE CASCADE
-- );

USE nmow_database1;

create table ingredients (
barcode varchar(40) not null,
ingredient_name varchar(100) not null,
weight integer null DEFAULT 0,
quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
unit NVARCHAR(10) NOT NULL, 
expiry_date DATE,
storage_location NVARCHAR(50),
category NVARCHAR(50),
primary key (barcode)
) engine = innodb;

-- ALTER TABLE Ingredients
-- DROP CONSTRAINT CK_Category;

-- ALTER TABLE Ingredients
-- ADD CONSTRAINT CK_Category CHECK (category IN ('meat', 'starch', 'entree', 'vegetable', 'dessert', 'appetizer', 'baking'));

-- ALTER TABLE Ingredients
-- ADD CONSTRAINT CK_Units CHECK (unit IN ('servings', 'LBS', 'count', 'cans', 'bags', 'boxes', 'sticks', 'cups', 'gallons'));

-- INSERT INTO Ingredients (barcode, ingredient_name, weight, quantity, unit, expiry_date, storage_location, category)
--  VALUES
--  ('qw_5728572', 'butter', 4, 4,  'sticks', '2025-02-24', 'J4', 'baking');
 -- ('ss_2D4E6L', 'shrimp salad', 3,2,  'LBS', '2025-02-24', 'J4', 'entree'),
-- ('hs_5E7L23M', 'hoagie sandwich', 3, 2, 'LBS', '2025-02-24', 'J4', 'entree'),
-- ('clc_4T9U25X', 'chocolate lava cake', 5,2,  'LBS', '2025-02-24', 'J4', 'entree');

-- select expiry_date from nmow_database1.ingredients;

create or replace view locations_update (barcode, ingredient_name, storage_location, category) as
select barcode, ingredient_name, storage_location, category
from ingredients
group by storage_location;

-- CREATE TABLE Transactions (
--     transaction_id INT NOT NULL PRIMARY KEY,             -- Unique ID for each transaction
--     ingredient_id INT NOT NULL,                          -- Links to the Ingredients table
--     transaction_type NVARCHAR(10) NOT NULL,              -- Type of transaction (e.g., add, remove)
--     quantity DECIMAL(10, 2) NOT NULL,                    -- Quantity involved in the transaction
--     notes NVARCHAR(255),                                 -- Optional notes about the transaction
--     CONSTRAINT FK_Ingredient FOREIGN KEY (ingredient_id) 
--     REFERENCES Ingredients(ingredient_id) ON DELETE CASCADE
-- );Error Code: 1064. You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near '' at line 5



