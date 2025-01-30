use nmow_database1;

create table Ingredients (ingredient_name varchar(100) not null,
weight integer null DEFAULT 0,
quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
unit NVARCHAR(10) NOT NULL, 
expiry_date DATE,
shelf_location NVARCHAR(50),
category NVARCHAR(50),
primary key (barcode)
)engine = innodb;


-- ALTER TABLE Ingredients
-- DROP CONSTRAINT CK_Category;

ALTER TABLE Ingredients
    ADD CONSTRAINT CK_Category CHECK (category IN ('meat', 'starch', 'entree', 'vegetable', 'dessert', 'appetizer', 'baking'));

ALTER TABLE Ingredients 
ADD COLUMN storage_type VARCHAR(10) NOT NULL DEFAULT 'dry',
ADD CONSTRAINT CK_StorageType CHECK (storage_type IN ('dry', 'fridge', 'freezer'));


ALTER TABLE Ingredients
ADD CONSTRAINT CK_Units CHECK (unit IN ('servings', 'LBS', 'count', 'cans', 'bags', 'boxes', 'sticks', 'cups', 'gallons'));

INSERT INTO Ingredients (barcode, ingredient_name, weight, quantity, unit, expiry_date, storage_type, storage_location, category)
VALUES
('qw_5728572', 'butter', 4, 4, 'sticks', '2025-02-24', 'fridge', 'J4', 'baking'),
('ss_2D4E6L', 'shrimp salad', 3, 2, 'LBS', '2025-02-24', 'fridge', 'J4', 'entree'),
('hs_5E7L23M', 'hoagie sandwich', 3, 2, 'LBS', '2025-02-24', 'dry', 'J4', 'entree'),
('clc_4T9U25X', 'chocolate lava cake', 5, 2, 'LBS', '2025-02-24', 'dry', 'J4', 'entree');


-- select expiry_date from nmow_database1.ingredients;



CREATE TABLE transactions (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY, -- Unique ID for each transaction
    barcode VARCHAR(40) NOT NULL,                 -- Link to the ingredients table via barcode
    transaction_type NVARCHAR(10) NOT NULL CHECK (transaction_type IN ('add', 'remove')), -- 'add' or 'remove'
    quantity DECIMAL(10, 2) NOT NULL,             -- Quantity involved in the transaction
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Date and time of the transaction
    notes NVARCHAR(255),                          -- Optional notes about the transaction
    FOREIGN KEY (barcode) REFERENCES ingredients(barcode) ON DELETE CASCADE
) ENGINE = InnoDB;

-- ingredients insert--

INSERT INTO Ingredients (barcode, ingredient_name, weight, quantity, unit, expiry_date, storage_location, category)
VALUES
('qw_5728572', 'butter', 4, 4, 'sticks', '2025-02-04', 'J4', 'baking'),
('ss_2D4E6L', 'shrimp salad', 3, 2, 'LBS', '2025-02-24', 'J4', 'entree'),
('hs_5E7L23M', 'hoagie sandwich', 3, 2, 'LBS', '2025-02-24', 'J4', 'entree'),
('clc_4T9U25X', 'chocolate lava cake', 5, 2, 'LBS', '2025-02-24', 'J4', 'entree');

INSERT INTO Ingredients (barcode, ingredient_name, weight, quantity, unit, expiry_date, storage_location, category)
VALUES
('pl_490249HHY2302', 'chips', 4, 4, 'count', '2025-02-04', 'J4', 'dessert');

UPDATE Ingredients 
SET storage_type = 'freezer' 
WHERE ingredient_name IN ('butter');



-- transactions insert --
INSERT INTO transactions (barcode, transaction_type, quantity, notes)
VALUES
('qw_5728572', 'add', 10, 'Added 10 sticks of butter to inventory'),
('qw_5728572', 'remove', 2, 'Used 2 sticks of butter for baking'),
('ss_2D4E6L', 'add', 5, 'Added 5 lbs of shrimp salad for catering'),
('ss_2D4E6L', 'remove', 3, 'Sold 3 lbs of shrimp salad'),
('hs_5E7L23M', 'add', 4, 'Restocked 4 lbs of hoagie sandwiches'),
('clc_4T9U25X', 'remove', 2, 'Sold 2 lbs of chocolate lava cake to customers');

-- quantity checks --
create or replace view low_stock (ingredient_name, quantity, unit) as
SELECT ingredient_name, quantity, unit 
FROM ingredients where quantity<5 ;

CREATE OR REPLACE VIEW expiring_stock (ingredient_name, quantity, expiry_date, unit) AS
SELECT ingredient_name, quantity, expiry_date, unit  
FROM Ingredients  
WHERE expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY);

create or replace view dry_stock (ingredient_name, quantity, unit, storage_location, storage_type) as
SELECT ingredient_name, quantity, unit, storage_location, storage_type
FROM ingredients where storage_type in ('dry') ;

create or replace view fridge_stock (ingredient_name, quantity, unit, storage_location, storage_type) as
SELECT ingredient_name, quantity, unit, storage_location, storage_type
FROM ingredients where storage_type in ('fridge') ;

create or replace view freezer_stock (ingredient_name, quantity, unit, storage_location, storage_type) as
SELECT ingredient_name, quantity, unit, storage_location, storage_type
FROM ingredients where storage_type in ('freezer') ;

create or replace view entree_stock (ingredient_name, quantity, unit, storage_location, storage_type, category) as
SELECT ingredient_name, quantity, unit, storage_location, storage_type, category
FROM ingredients where category in ('entree') ;

create or replace view starch_stock (ingredient_name, quantity, unit, storage_location, storage_type, category) as
SELECT ingredient_name, quantity, unit, storage_location, storage_type, category
FROM ingredients where category in ('starch') ;

create or replace view meat_stock (ingredient_name, quantity, unit, storage_location, storage_type, category) as
SELECT ingredient_name, quantity, unit, storage_location, storage_type, category
FROM ingredients where category in ('meat') ;

create or replace view veg_stock (ingredient_name, quantity, unit, storage_location, storage_type, category) as
SELECT ingredient_name, quantity, unit, storage_location, storage_type, category
FROM ingredients where category in ('vegetable') ;

create or replace view dessert_stock (ingredient_name, quantity, unit, storage_location, storage_type, category) as
SELECT ingredient_name, quantity, unit, storage_location, storage_type, category
FROM ingredients where category in ('dessert') ;

create or replace view appetizer_stock (ingredient_name, quantity, unit, storage_location, storage_type, category) as
SELECT ingredient_name, quantity, unit, storage_location, storage_type, category
FROM ingredients where category in ('appetizer') ;

create or replace view baking_stock (ingredient_name, quantity, unit, storage_location, storage_type, category) as
SELECT ingredient_name, quantity, unit, storage_location, storage_type, category
FROM ingredients where category in ('baking') ;

CREATE OR REPLACE VIEW most_common_transactions AS  
SELECT i.ingredient_name, i.quantity, i.unit, i.storage_location, i.storage_type, i.category  
FROM Ingredients i  
JOIN Transactions t ON i.barcode = t.barcode  
GROUP BY i.ingredient_name, i.quantity, i.unit, i.storage_location, i.storage_type, i.category  
ORDER BY COUNT(t.transaction_id) DESC  
LIMIT 5;


UPDATE ingredients 
SET quantity = quantity + 10 
WHERE barcode = 'qw_5728572';

UPDATE Ingredients i
JOIN Transactions t ON i.barcode = t.barcode
SET i.quantity = 
    CASE 
        WHEN t.transaction_type = 'add' THEN i.quantity + t.quantity
        WHEN t.transaction_type = 'remove' THEN GREATEST(0, i.quantity - t.quantity)
        ELSE i.quantity
    END;
