from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
from supabase import create_client, Client

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

@app.post("/add")
def add_ingredient(ingredient: Ingredient):
    try:
        # Ensure expiration_date is in correct format
        if ingredient.expiration_date:
            from datetime import datetime
            try:
                datetime.strptime(ingredient.expiration_date, "%Y-%m-%d")  # Ensure correct format
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

        response = supabase.table("ingredients").insert(ingredient.dict()).execute()

        if response.data:
            return {"message": "Ingredient added successfully", "data": response.data}
        
        raise HTTPException(status_code=500, detail="Supabase error: Could not insert ingredient.")

    except Exception as e:
        return HTTPException(status_code=500, detail=f"Database Constraint Error: {str(e)}")

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