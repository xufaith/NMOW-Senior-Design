from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
from supabase import create_client, Client
import uuid
from fastapi import Body


# Supabase credentials
supabase_url = "https://atmafjrxijoqjphoclzo.supabase.co"
supabase_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0bWFmanJ4aWpvcWpwaG9jbHpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgyNjMxNDAsImV4cCI6MjA1MzgzOTE0MH0.UDfIVdt4hWaIzujfJeRZhXDgoeMe8CjnGdy6Az6aIrc"
supabase: Client = create_client(supabase_url, supabase_key)

app = FastAPI()

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins (change to specific frontend URL if needed)
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods (GET, POST, PATCH, DELETE, etc.)
    allow_headers=["*"],  # Allows all headers (Authorization, Content-Type, etc.)
)

# Ingredient Model
class Ingredient(BaseModel):
    barcode: str
    ingredient_name: str
    units_per_container: float  # Ensure it's float if needed
    unit: str
    expiration_date: Optional[str] = None  # Ensure format is YYYY-MM-DD
    storage_location: Optional[str] = None
    item_category: Optional[str] = None
    storage_type: Optional[str] = None
    container_type: Optional[str] = None
    num_containers: int  # Ensure integer
    brand: Optional[str] = None
    tefap: bool

# Model for stock updates
class StockUpdate(BaseModel):
    amount: float

@app.get("/")
def read_root():
    return {"message": "Welcome to the Inventory API"}

import uuid

@app.post("/add")
def add_ingredient(ingredient: Ingredient):
    try:
        # ✅ Generate a unique barcode
        generated_barcode = str(uuid.uuid4().int)[:12]  # 12-digit unique number
        ingredient_dict = ingredient.dict()
        ingredient_dict["barcode"] = generated_barcode

        # ✅ Format expiration_date if present
        if ingredient_dict.get("expiration_date"):
            from datetime import datetime
            try:
                datetime.strptime(ingredient_dict["expiration_date"], "%Y-%m-%d")
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

        response = supabase.table("ingredients").insert(ingredient_dict).execute()

        if response.data:
            return {"message": "Ingredient added successfully", "data": response.data}

        raise HTTPException(status_code=500, detail="Supabase error: Could not insert ingredient.")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database Constraint Error: {str(e)}")


@app.delete("/remove/{barcode}")
def remove_ingredient(barcode: str):
    response = supabase.table("ingredients").delete().eq("barcode", barcode).execute()

    if response.data:
        return {"message": "Ingredient removed successfully", "data": response.data}
    raise HTTPException(status_code=404, detail="Ingredient not found")

@app.get("/ingredients")
def get_ingredients():
    response = supabase.table("ingredients").select("*").execute()

    if response.data:
        return {"ingredients": response.data}
    raise HTTPException(status_code=404, detail="No ingredients found")

@app.get("/ingredient/{barcode}")
def get_ingredient(barcode: str):
    response = supabase.table("ingredients").select("*").eq("barcode", barcode).execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Ingredient not found")

    return response.data[0]  # Return the first matching record

@app.put("/update-ingredient/{barcode}")
def update_ingredient(barcode: str, ingredient: dict):
    response = supabase.table("ingredients").update(ingredient).eq("barcode", barcode).execute()
    
    if response.data:
        return {"message": "Ingredient updated successfully"}
    raise HTTPException(status_code=404, detail="Failed to update ingredient")

@app.patch("/increase/{barcode}")
def increase_stock(barcode: str, stock_update: StockUpdate):
    """ Increase stock in Supabase and log response """
    ingredient = supabase.table("ingredients").select("num_containers").eq("barcode", barcode).execute()
    
    if not ingredient.data:
        raise HTTPException(status_code=404, detail="Ingredient not found")

    current_quantity = int(ingredient.data[0]["num_containers"])
    new_quantity = current_quantity + int(stock_update.amount)

    response = supabase.table("ingredients").update({"num_containers": new_quantity}).eq("barcode", barcode).execute()
    
    print(f"🔹 DEBUG: Increased stock for {barcode}. New quantity: {new_quantity}")
    print(f"🔹 DEBUG: Supabase response: {response}")

    if response.data:
        return {"message": "Stock increased successfully", "new_quantity": new_quantity}
    
    raise HTTPException(status_code=500, detail="Failed to update stock")

@app.patch("/decrease/{barcode}")
def decrease_stock(barcode: str, stock_update: StockUpdate):
    """ Decrease stock in Supabase and log response """
    ingredient = supabase.table("ingredients").select("num_containers").eq("barcode", barcode).execute()
    
    if not ingredient.data:
        raise HTTPException(status_code=404, detail="Ingredient not found")

    current_quantity = int(ingredient.data[0]["num_containers"])
    if current_quantity < stock_update.amount:
        raise HTTPException(status_code=400, detail="Not enough stock to decrease")

    new_quantity = current_quantity - int(stock_update.amount)

    response = supabase.table("ingredients").update({"num_containers": new_quantity}).eq("barcode", barcode).execute()
    
    print(f"🔹 DEBUG: Decreased stock for {barcode}. New quantity: {new_quantity}")
    print(f"🔹 DEBUG: Supabase response: {response}")

    if response.data:
        return {"message": "Stock decreased successfully", "new_quantity": new_quantity}
    
    raise HTTPException(status_code=500, detail="Failed to update stock")


from fastapi.responses import StreamingResponse
import csv
import io

@app.get("/export-csv")
def export_csv():
    response = supabase.table("ingredients").select("*").execute()
    data = response.data

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["barcode", "name", "quantity", "container", "storage", "brand", "category"])

    for item in data:
        writer.writerow([
            item["barcode"], item["ingredient_name"], item["num_containers"],
            item["container_type"], item["storage_location"], item["brand"], item["item_category"]
        ])

    output.seek(0)
    return StreamingResponse(output, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=ingredients.csv"})

from typing import Dict, Optional
from pydantic import BaseModel
from fastapi import HTTPException

class DailyMealInput(BaseModel):
    protein: Optional[str] = None
    hot_side_1: Optional[str] = None
    hot_side_2: Optional[str] = None
    sauce_hot: Optional[str] = None
    dessert_snack: Optional[str] = None
    fruit_salad: Optional[str] = None
    fruit_snack: Optional[str] = None
    sauce_cold: Optional[str] = None

class MenuRequest(BaseModel):
    menu: Dict[str, Dict[str, DailyMealInput]]
    meals_per_day: Dict[str, int]

@app.post("/check_feasibility")
def check_feasibility(request: MenuRequest):
    try:
        ingredients = supabase.table("ingredients").select("*").execute().data
        if not ingredients:
            raise HTTPException(status_code=404, detail="No ingredients found")

        results = {}
        for day, trays in request.menu.items():
            results[day] = {}
            meals_needed = request.meals_per_day.get(day, 0)

            for tray_type, selection in trays.items():
                tray_results = {}
                for field, selected in selection.dict().items():
                    if not selected:
                        tray_results[field] = {"status": "missing", "message": "No ingredient selected"}
                        continue

                    matches = [i for i in ingredients if i["ingredient_name"] == selected]
                    if not matches:
                        tray_results[field] = {"status": "not_found", "message": f"{selected} not in DB"}
                        continue

                    ing = matches[0]
                    servings = ing["units_per_container"] * ing["num_containers"]
                    sufficient = servings >= meals_needed

                    if sufficient:
                        tray_results[field] = {
                            "status": "sufficient",
                            "servings_available": servings,
                            "needed": meals_needed
                        }
                    else:
                        subs = sorted(
                            [
                                i for i in ingredients
                                if i["item_category"] == ing["item_category"]
                                and i["storage_type"] == ing["storage_type"]
                                and i["ingredient_name"] != ing["ingredient_name"]
                            ],
                            key=lambda x: x.get("expiration_date") or "9999-12-31"
                        )

                        tray_results[field] = {
                            "status": "insufficient",
                            "servings_available": servings,
                            "needed": meals_needed,
                            "substitutions": [
                                {
                                    "ingredient_name": sub["ingredient_name"],
                                    "servings": sub["units_per_container"] * sub["num_containers"],
                                    "expires": sub.get("expiration_date")
                                }
                                for sub in subs
                            ]
                        }

                results[day][tray_type] = tray_results

        return {"status": "complete", "results": results}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
