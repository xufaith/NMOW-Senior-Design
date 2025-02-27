
USE inventory;

--ingredients table--

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
)engine = innodb;

ALTER TABLE Ingredients
DROP CONSTRAINT CK_Category;

ALTER TABLE Ingredients
    ADD CONSTRAINT CK_Category CHECK (category IN ('meat', 'starch', 'entree', 'vegetable', 'dessert', 'appetizer', 'baking'));

ALTER TABLE Ingredients
ADD CONSTRAINT CK_Units CHECK (unit IN ('servings', 'LBS', 'count', 'cans', 'bags', 'boxes', 'sticks', 'cups', 'gallons'));

--table insert examples--
INSERT INTO Ingredients (barcode, ingredient_name, weight, quantity, unit, expiry_date, storage_location, category)
VALUES
('qw_5728572', 'butter', 4, 4,  'sticks', '2025-02-24', 'J4', 'baking');
('ss_2D4E6L', 'shrimp salad', 3,2,  'LBS', '2025-02-24', 'J4', 'entree'),
('hs_5E7L23M', 'hoagie sandwich', 3, 2, 'LBS', '2025-02-24', 'J4', 'entree'),
('clc_4T9U25X', 'chocolate lava cake', 5,2,  'LBS', '2025-02-24', 'J4', 'entree');

-- select expiry_date from nmow_database1.ingredients;
create or replace view locations_update (barcode, ingredient_name, storage_location, category) as
select barcode, ingredient_name, storage_location, category
from ingredients
group by storage_location;

USE inventory;


--transactions table--
CREATE TABLE transactions (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY, -- Unique ID for each transaction
    barcode VARCHAR(40) NOT NULL,                 -- Link to the ingredients table via barcode
    transaction_type NVARCHAR(10) NOT NULL CHECK (transaction_type IN ('add', 'remove')), -- 'add' or 'remove'
    quantity DECIMAL(10, 2) NOT NULL,             -- Quantity involved in the transaction
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Date and time of the transaction
    notes NVARCHAR(255),                          -- Optional notes about the transaction
    FOREIGN KEY (barcode) REFERENCES ingredients(barcode) ON DELETE CASCADE
) ENGINE = InnoDB;

--ingredients insert--

INSERT INTO Ingredients (barcode, ingredient_name, weight, quantity, unit, expiry_date, storage_location, category)
VALUES
('qw_5728572', 'butter', 4, 4, 'sticks', '2025-02-24', 'J4', 'baking'),
('ss_2D4E6L', 'shrimp salad', 3, 2, 'LBS', '2025-02-24', 'J4', 'entree'),
('hs_5E7L23M', 'hoagie sandwich', 3, 2, 'LBS', '2025-02-24', 'J4', 'entree'),
('clc_4T9U25X', 'chocolate lava cake', 5, 2, 'LBS', '2025-02-24', 'J4', 'entree');

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
SELECT ingredient_name, quantity, unit 
FROM ingredients 
WHERE quantity < 5;

UPDATE ingredients 
SET quantity = quantity + 10 
WHERE barcode = 'qw_5728572';

DELIMITER $$

CREATE TRIGGER trg_update_quantity
AFTER INSERT ON transactions
FOR EACH ROW
BEGIN
    -- Check if the transaction type is 'add'
    IF NEW.transaction_type = 'add' THEN
        UPDATE ingredients
        SET quantity = quantity + NEW.quantity
        WHERE barcode = NEW.barcode;

    -- Check if the transaction type is 'remove'
    ELSE IF NEW.transaction_type = 'remove' THEN
        UPDATE ingredients
        SET quantity = quantity - NEW.quantity
        WHERE barcode = NEW.barcode;
    END IF;
END$$

DELIMITER ;

INSERT INTO transactions (barcode, transaction_type, quantity, notes)
VALUES ('qw_5728572', 'add', 5, 'Added 5 sticks of butter for restocking');
