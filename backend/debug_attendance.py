
import asyncio
from sqlalchemy import select
from app.db.postgres import get_postgres_session_context
from app.models.sql_models import EventAttendance

async def inspect_attendance():
    async with get_postgres_session_context() as db:
        result = await db.execute(select(EventAttendance))
        records = result.scalars().all()
        print(f"Total records: {len(records)}")
        for r in records:
            print(f"ID: {r.id}, USN: {r.usn}, DATE: {r.attendance_date} (Type: {type(r.attendance_date)}), STATUS: '{r.status}'")

if __name__ == "__main__":
    asyncio.run(inspect_attendance())
