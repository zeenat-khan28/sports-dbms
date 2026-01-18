"""Simulated blockchain logging for audit trail using SHA-256 hash chain."""
import hashlib
import json
from datetime import datetime
from typing import Optional


class BlockchainLogger:
    """Simulates a blockchain for tamper-proof approval logs."""
    
    _previous_hash: str = "0" * 64  # Genesis block hash
    
    @classmethod
    def _calculate_hash(cls, data: dict) -> str:
        """Calculate SHA-256 hash of the data."""
        data_string = json.dumps(data, sort_keys=True, default=str)
        return hashlib.sha256(data_string.encode()).hexdigest()
    
    @classmethod
    def log_action(
        cls,
        usn: str,
        event_id: int,
        action: str,  # "approved" or "rejected" or "selected" or "dropped"
        admin_email: str,
        event_name: Optional[str] = None
    ) -> str:
        """
        Create a new block in the hash chain.
        
        Returns the hash of this block which can be stored for verification.
        """
        block_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "usn": usn,
            "event_id": event_id,
            "event_name": event_name,
            "action": action,
            "admin_email": admin_email,
            "previous_hash": cls._previous_hash
        }
        
        current_hash = cls._calculate_hash(block_data)
        cls._previous_hash = current_hash
        
        print(f"🔗 Blockchain: {action.upper()} | USN: {usn} | Event: {event_id} | Hash: {current_hash[:16]}...")
        
        return current_hash
    
    @classmethod
    def verify_hash(cls, data: dict, expected_hash: str) -> bool:
        """Verify that the data matches the expected hash."""
        calculated = cls._calculate_hash(data)
        return calculated == expected_hash


# Singleton instance
blockchain = BlockchainLogger()
