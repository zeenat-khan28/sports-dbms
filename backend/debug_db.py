import asyncio
import sys
import os

# Ensure backend dir is in path
sys.path.append(os.getcwd())

from app.db.postgres import get_postgres_session, engine
from app.models.sql_models import User
from app.core.security import get_password_hash
from sqlalchemy import select
from app.core.config import settings

async def test_db_write():
    with open("db_debug.log", "w", encoding="utf-8") as f:
        f.write("Testing DB Write (Create Admin)...\n")
        
        # Check settings
        pwd = settings.ADMIN_PASSWORD
        f.write(f"Password stored in settings: '{pwd}' (Type: {type(pwd)}, Length: {len(pwd)})\n")
        
        try:
            # get_postgres_session is a generator
            gen = get_postgres_session()
            session = await anext(gen)
            
            try:
                # Check if user exists
                result = await session.execute(select(User).where(User.email == settings.ADMIN_EMAIL))
                user = result.scalar_one_or_none()
                
                if user:
                    f.write(f"User {user.email} already exists. Updating...\n")
                else:
                    f.write(f"User {settings.ADMIN_EMAIL} not found. Creating...\n")
                    
                    try:
                        hashed = get_password_hash(pwd)
                        f.write(f"Hash generated successfully: {hashed[:10]}...\n")
                        user = User(
                            email=settings.ADMIN_EMAIL,
                            password_hash=hashed,
                            role="admin"
                        )
                        session.add(user)
                    except Exception as e:
                        f.write(f"Hashing Failed: {e}\n")
                        raise e

                await session.commit()
                f.write("✅ Commit Successful!\n")
                
                # Verify
                result = await session.execute(select(User).where(User.email == settings.ADMIN_EMAIL))
                final_user = result.scalar_one_or_none()
                f.write(f"✅ User ID: {final_user.id} | Email: {final_user.email}\n")
                
            except Exception as e:
                 f.write(f"❌ Write/Commit Failed: {e}\n")
                 import traceback
                 traceback.print_exc(file=f)
            finally:
                await session.close()
                
        except Exception as e:
            f.write(f"❌ Session Init Error: {e}\n")
            import traceback
            traceback.print_exc(file=f)

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(test_db_write())
