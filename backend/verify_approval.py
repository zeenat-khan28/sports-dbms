import asyncio
import sys
import os

# Ensure backend dir is in path
sys.path.append(os.getcwd())

from app.db.postgres import get_postgres_session
from app.models.sql_models import Student, User
from sqlalchemy import select

async def verify_sql_storage(usn):
    print(f"Verifying SQL storage for USN: {usn}...")
    
    gen = get_postgres_session()
    session = await anext(gen)
    
    try:
        result = await session.execute(select(Student).where(Student.usn == usn))
        student = result.scalar_one_or_none()
        
        if student:
            print("✅ SUCCESS: Student found in PostgreSQL!")
            print(f"   Name: {student.name}")
            print(f"   Email: {student.email}")
            print(f"   Branch: {student.branch}")
        else:
            print("❌ FAILURE: Student NOT found in PostgreSQL.")
            
    except Exception as e:
        print(f"❌ Verification Failed: {e}")
    finally:
        await session.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python verify_approval.py <USN>")
        sys.exit(1)
        
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(verify_sql_storage(sys.argv[1]))
