from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
from supabase import create_client, Client
import uuid
from fastapi import Body
import traceback

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


TRAY_FIELDS = {
    "hot": ["protein", "hot_side_1", "hot_side_2", "sauce_hot"],
    "cold": ["dessert_snack", "fruit_salad", "fruit_snack", "sauce_cold"]
}

@app.post("/check_feasibility")
def check_feasibility(request: MenuRequest):
    try:
        ingredients = supabase.table("ingredients").select("*").execute().data
        if not ingredients:
            raise HTTPException(status_code=404, detail="No ingredients found")

        # Build inventory map
        inventory = {}
        for ing in ingredients:
            key = ing["ingredient_name"].strip().lower()
            inventory[key] = {
                "ingredient": ing,
                "available": ing["units_per_container"] * ing["num_containers"]
            }

        used_servings = {}  # Tracks how much we've used of each ingredient
        sorted_days = sorted(request.menu.keys())
        results = {}

        for day in sorted_days:
            trays = request.menu[day]
            meals_needed = request.meals_per_day.get(day, 0)
            results[day] = {}

            for tray_type, selection in trays.items():
                tray_results = {}
                fields = TRAY_FIELDS.get(tray_type, [])

                for field in fields:
                    selected = getattr(selection, field, None)
                    if not selected:
                        tray_results[field] = {"status": "missing", "message": "No ingredient selected"}
                        continue

                    key = selected.strip().lower()
                    item = inventory.get(key)

                    if not item:
                        tray_results[field] = {"status": "not_found", "message": f"{selected} not in DB"}
                        continue

                    total = item["available"]
                    used = used_servings.get(key, 0)
                    remaining = total - used

                    if remaining >= meals_needed:
                        tray_results[field] = {
                            "status": "sufficient",
                            "servings_available": remaining,
                            "needed": meals_needed
                        }
                        used_servings[key] = used + meals_needed
                    else:
                        subs = []
                        for sub in ingredients:
                            if (
                                sub["item_category"] == item["ingredient"]["item_category"]
                                and sub["storage_type"] == item["ingredient"]["storage_type"]
                                and sub["ingredient_name"].strip().lower() != key
                            ):
                                sub_key = sub["ingredient_name"].strip().lower()
                                sub_total = sub["units_per_container"] * sub["num_containers"]
                                sub_used = used_servings.get(sub_key, 0)
                                sub_remaining = sub_total - sub_used

                                if sub_remaining >= meals_needed:
                                    subs.append({
                                        "ingredient_name": sub["ingredient_name"],
                                        "servings": sub_remaining,
                                        "expires": sub.get("expiration_date")
                                    })

                        tray_results[field] = {
                            "status": "insufficient",
                            "servings_available": remaining,
                            "needed": meals_needed,
                            "substitutions": sorted(subs, key=lambda s: s["expires"] or "9999-12-31")
                        }

                results[day][tray_type] = tray_results

        return {"status": "complete", "results": results}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from fastapi import HTTPException
from pydantic import BaseModel
from typing import Dict, List, Union
import math

# Define the expected payload structure
class FinalizePayload(BaseModel):
    menu: Dict[str, Dict[str, Dict[str, str]]]
    meals_per_day: Dict[str, int]
    selected_substitutions: Dict[str, Dict[str, Union[int, dict]]]

@app.post("/finalize_menu")
def finalize_menu(data: FinalizePayload):
    try:
        print("🔍 Received payload:")
        print("Menu:", data.menu)
        print("Meals per day:", data.meals_per_day)
        print("Selected substitutions:", data.selected_substitutions)

        ingredients_resp = supabase.table("ingredients").select("*").execute()
        ingredients = ingredients_resp.data
        if not ingredients:
            raise HTTPException(status_code=404, detail="No ingredients found")

        def calculate_servings(ing):
            return ing["units_per_container"] * ing["num_containers"]

        inventory_lookup = {
            i["ingredient_name"].strip().lower(): i for i in ingredients
        }

        output_menu = {day: {"hot": [], "cold": []} for day in data.menu}
        grocery_list = []

        for day, trays in data.menu.items():
            meals = data.meals_per_day.get(day, 0)
            for tray_type, fields in trays.items():
                for field_name, ingredient_name in fields.items():
                    if not ingredient_name:
                        continue

                    field_key = f"{day}-{tray_type}-{field_name}"
                    substitution_data = data.selected_substitutions.get(field_key)
                    selected = substitution_data.get("suggestion") if substitution_data else None

                    # Determine final ingredient name
                    if isinstance(selected, dict):
                        selected_name = selected["ingredient_name"]
                    else:
                        selected_name = ingredient_name

                    selected_ing = inventory_lookup.get(selected_name.strip().lower())

                    if selected_ing:
                        servings = calculate_servings(selected_ing)
                        containers_needed = math.ceil(meals / selected_ing["units_per_container"])
                        output_menu[day][tray_type].append({
                            "field": field_name,
                            "item": selected_ing["ingredient_name"],
                            "brand": selected_ing.get("brand", ""),
                            "servings_needed": meals,
                            "containers": containers_needed,
                            "container_type": selected_ing.get("container_type", "?"),
                            "location": selected_ing.get("storage_location", "?")
                        })
                    else:
                        # If ingredient not found in inventory, add to grocery list
                        grocery_list.append({
                            "item": selected_name,
                            "qty": f"? containers / {meals} serv."
                        })
                        print(f"🔴 Adding {selected_name} to grocery list")

        print("🛒 Grocery List:", grocery_list)

        # ✅ Clear previous grocery list and insert updated values
        supabase.table("grocery_list").delete().neq("id", 0).execute()
        if grocery_list:
            supabase.table("grocery_list").insert(grocery_list).execute()
            print("✅ Inserted grocery list into Supabase.")

        return {
            "final_output_menu": output_menu,
            "grocery_list": grocery_list
        }

    except Exception as e:
        print(f"❌ ERROR in finalize_menu: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/grocery_list")
def get_grocery_list():
    try:
        response = supabase.table("grocery_list").select("*").execute()
        return {"grocery_list": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
