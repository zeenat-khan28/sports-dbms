import requests
import sys

# Hardcoded admin credentials
url = "http://localhost:8000/api/auth/login"
data = {
    "username": "khan2228zeenat@gmail.com",
    "password": "1234567890"
}

try:
    # requests.post with 'data' param sends application/x-www-form-urlencoded
    response = requests.post(url, data=data)
    
    with open("login_debug.log", "w", encoding="utf-8") as f:
        f.write(f"Status Code: {response.status_code}\n")
        f.write(f"Response Body: {response.text}\n")
    
    print(f"Done. Status: {response.status_code}")

except Exception as e:
    with open("login_debug.log", "w", encoding="utf-8") as f:
        f.write(f"Exception: {str(e)}\n")
    print(f"Exception: {e}")
