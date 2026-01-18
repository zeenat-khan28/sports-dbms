import requests
import json
import sys

# Hardcoded admin credentials
login_url = "http://localhost:8000/api/auth/login"
login_data = {
    "username": "khan2228zeenat@gmail.com",
    "password": "1234567890"
}

# Login
print("Logging in...")
try:
    s = requests.Session()
    r = s.post(login_url, data=login_data)
    if r.status_code != 200:
        print(f"Login failed: {r.status_code} {r.text}")
        sys.exit(1)
        
    token = r.json()["access_token"]
    print("Login successful.")
    headers = {"Authorization": f"Bearer {token}"}
    
    # LIST first
    print("Listing pending submissions...")
    r = s.get("http://localhost:8000/api/submissions/?status=pending", headers=headers)
    
    if r.status_code != 200:
        print(f"List failed: {r.text}")
        sys.exit(1)
        
    submissions = r.json()["submissions"]
    print(f"Found {len(submissions)} pending submissions.")
    for sub in submissions:
        print(f" - ID: {sub['id']} | Name: {sub['student_name']} | USN: {sub['usn']}")
    
    if len(submissions) > 0:
        target_sub = submissions[0]
        sub_id = sys.argv[1] if len(sys.argv) > 1 else target_sub['id']
        usn = target_sub['usn']
        
        print(f"Attempting to approve ID: {sub_id} (USN: {usn})")
        
        # Approve
        approve_url = f"http://localhost:8000/api/submissions/{sub_id}"
        
        response = s.patch(
            approve_url,
            json={"status": "approved"},
            headers=headers
        )
        
        print("-" * 30)
        print(f"Status Code: {response.status_code}")
        print(f"Response Body: {response.text}")
        print("-" * 30)
        
        # Save USN to file for verification script
        with open("last_approved_usn.txt", "w") as f:
            f.write(usn)

except Exception as e:
    print(f"Exception: {e}")
