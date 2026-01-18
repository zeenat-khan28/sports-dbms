"""SQL Models for PostgreSQL database."""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Date
from sqlalchemy.orm import relationship
from app.db.postgres import Base


class User(Base):
    """Admin/Manager user model stored in PostgreSQL."""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="admin")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    events_created = relationship("Event", back_populates="creator")
    approvals_made = relationship("ApprovedParticipant", back_populates="approver")


class Student(Base):
    """Student profile stored in PostgreSQL after approval."""
    __tablename__ = "students"
    
    usn = Column(String(20), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True)
    
    # Profile Details
    branch = Column(String(50))
    semester = Column(Integer)
    phone = Column(String(20))
    dob = Column(String(20))
    blood_group = Column(String(10))
    parent_name = Column(String(255))
    mother_name = Column(String(255))
    address = Column(Text)
    
    # System info
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)



class Event(Base):
    """Sports event model stored in PostgreSQL."""
    __tablename__ = "events"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    location = Column(String(255))
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    description = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    creator = relationship("User", back_populates="events_created")
    participants = relationship("ApprovedParticipant", back_populates="event")


class ApprovedParticipant(Base):
    """Approved event participant stored in PostgreSQL."""
    __tablename__ = "approved_participants"
    
    id = Column(Integer, primary_key=True, index=True)
    usn = Column(String(20), nullable=False, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    approved_by = Column(Integer, ForeignKey("users.id"))
    status = Column(String(20), default="pending")  # pending, approved, rejected
    blockchain_hash = Column(String(128))  # For audit trail
    approved_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    event = relationship("Event", back_populates="participants")
    approver = relationship("User", back_populates="approvals_made")


class EmailAuditLog(Base):
    """Log of all bulk emails sent by admins."""
    __tablename__ = "email_audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subject = Column(String(255), nullable=False)
    body_preview = Column(Text)
    filters_used = Column(Text)  # JSON string
    recipient_count = Column(Integer)
    success_count = Column(Integer, default=0)
    failure_count = Column(Integer, default=0)
    sent_at = Column(DateTime, default=datetime.utcnow)
    blockchain_hash = Column(String(128))  # For audit integrity
    
    # Relationships
    sender = relationship("User")


class EventAttendance(Base):
    """Attendance records for event participants."""
    __tablename__ = "event_attendance"
    
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    usn = Column(String(20), nullable=False, index=True)
    student_name = Column(String(255))  # Denormalized for easy display
    attendance_date = Column(Date, nullable=False)
    status = Column(String(10))  # "present", "absent", or null
    marked_by = Column(Integer, ForeignKey("users.id"))
    marked_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    event = relationship("Event")
    admin = relationship("User")
