import pandas as pd
from bs4 import BeautifulSoup
from supabase import create_client, Client
import logging
import time
import os
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as ec
from selenium.webdriver.support.ui import WebDriverWait


def lambda_handler(event, context):

    def insert_dataframe(table_name, data):
        try:
            # Convert column titles to lowercase and spaces to underscores
            data.columns = data.columns.str.lower().str.replace(" ", "_")
            data = data.where(pd.notna(data), None)
            data_records = data.to_dict(orient='records')
            
            # Insert data into Supabase
            response = db.table(table_name).insert(data_records).execute()
            logger.info(f"Data inserted into table {table_name}")
            return response
        except Exception as e:
            logger.error(f"Failed to insert data: {str(e)}")
            raise

    # This would be triggered by the event (could be from EventBridge, S3, etc.)

    # Logging setup for Lambda
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)

    # Supabase credentials (Move these to Lambda environment variables for better security)
    supabase_url = os.getenv('SUPABASE_URL', 'https://atmafjrxijoqjphoclzo.supabase.co')
    supabase_key = os.getenv('SUPABASE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0bWFmanJ4aWpvcWpwaG9jbHpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgyNjMxNDAsImV4cCI6MjA1MzgzOTE0MH0.UDfIVdt4hWaIzujfJeRZhXDgoeMe8CjnGdy6Az6aIrc')

    # Initialize the Supabase client globally (can reuse across multiple Lambda invocations)
    db: Client = create_client(supabase_url, supabase_key)

    logger.info("Starting Lambda function execution")

    options = Options()
    options.add_argument('--headless=new')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    service = Service("./chromedriver.exe")
    driver = webdriver.Chrome(service=service, options=options)

    # Web scraping code using BeautifulSoup
    try:
        loginurl = 'https://eharvest.acfb.org/Login.aspx'
        homeurl = 'https://eharvest.acfb.org/Default.aspx'
        invurl = 'https://eharvest.acfb.org/InventoryView.aspx'
        
        username = os.getenv('LOGIN_USERNAME', 'fxu73@gatech.edu')
        password = os.getenv('LOGIN_PASSWORD', '[hdph98')

        # Headless Selenium logic would go here
        # Starting selenium and logging in would happen here, but for now, let’s assume the login is done.
        driver.get(loginurl)
        WebDriverWait(driver, 3).until(ec.presence_of_element_located((By.ID, 'txtUserName')))

        # Entering username
        u_input = driver.find_element(By.ID, 'txtUserName')
        u_input.clear()
        u_input.send_keys(username)

        # Putting in password uses javascript bc it is a hidden field using javascript
        p_input = driver.find_element(By.ID, 'txtPassword')
        driver.execute_script(f"arguments[0].value='{password}';", p_input)

        # This is how you find & click a button
        login_button = driver.find_element(By.ID, 'btnLogin')
        login_button.click()

        #This is how you wait for the page to change - if it doesn't in 3 seconds it will error out
        WebDriverWait(driver, 3).until(ec.url_to_be(homeurl))

        #Did a popup for "Reports Due" show
        try:
            x_btn = driver.find_element(By.XPATH, "//span[@class='rwCommandButton rwCloseButton']")
            x_btn.click()
            time.sleep(3)
        except:
            pass
        
        inv_button = driver.find_element(By.ID, 'mnuMain_btnInventory')
        inv_button.click()

        WebDriverWait(driver, 3).until(ec.url_to_be(invurl))

        # Once logged in, fetch the data
        html = driver.page_source  # Replace this with real scraping logic
        soup = BeautifulSoup(html, 'html.parser')

        headers = soup.find("div", {"id":"grdData_GridHeader", "class":"rgHeaderDiv"}).find("thead").find("tr").find_all("th")
        headers = [h.get_text(strip=True) for h in headers]
        
        row_tags = soup.find("div", {"id":"grdData_GridData", "class":"rgDataDiv"}).find("tbody").find_all("tr")

        data = []
        temp_cat = ""
        for row in row_tags:
            cols = row.find_all('td')
            curr = [col.get_text(strip=True) for col in cols]

            if curr[0] != "":
                temp_cat = curr[0]
            else:
                curr[0] = temp_cat
            data.append(curr)

        # Convert data into a pandas dataframe
        df = pd.DataFrame(data, columns=headers)

        logger.info("Scraping successful")

        # Further data processing and cleaning
        df.rename(columns={'$': 'cost', 'Cs/Pallet': 'cs_per_pallet', 'Item #': 'item_num', 'Pkg. Info': 'pkg_info'}, inplace=True)
        df = df.drop('Nutrition', axis=1)
        unwanted_categories = ['Dairy Products', 'Hsehold Cleanng', 'Infant', 'PaperProd', 'Beverages']
        df = df[~df['Product Category'].isin(unwanted_categories)]

        # Data type conversion
        df.iloc[:, 0:5] = df.iloc[:, 0:5].astype(str)
        df.iloc[:, 5:7] = df.iloc[:, 5:7].apply(lambda x: x.astype(str).str.replace(',', '').astype(int))
        df.iloc[:, 7:10] = df.iloc[:, 7:10].apply(lambda x: x.astype(str).str.replace(',', '').astype(float))

        # Prepare the data for insertion into Supabase
        insert_dataframe('hist_food_bank', df)

        # Clear the current table and update with new data
        insert_dataframe('curr_food_bank', df)
        latest_time = db.table('curr_food_bank').select('pull_time').order('pull_time', desc=True).limit(1).execute()
        latest_time_value = latest_time.data[0]['pull_time']
        db.table('curr_food_bank').delete().neq('pull_time', latest_time_value).execute()

        logger.info("Database update successful")
        return {
            'statusCode': 200,
            'body': 'Data processing and insertion completed successfully'
        }

    except Exception as e:
        logger.error(f"Error occurred: {str(e)}")
        return {
            'statusCode': 500,
            'body': f"Error: {str(e)}"
        }


