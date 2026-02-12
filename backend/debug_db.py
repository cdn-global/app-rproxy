
import sys
import os
import uuid
from datetime import datetime
from sqlmodel import Session, select, SQLModel, Field, create_engine
from typing import Optional

# Setup path so we can import app if needed, but I'll define models here to replicate the env 
# or try to import them if the path allows.
sys.path.append(os.getcwd())

try:
    from app.models import RemoteServer, RemoteServerPublic
    from app.core.db import engine
    
    # Test connection
    with Session(engine) as session:
        print("Database connected.")
        statement = select(RemoteServer).limit(5)
        servers = session.exec(statement).all()
        print(f"Found {len(servers)} servers.")
        
        for s in servers:
            try:
                print(f"Processing server {s.id} with slug: {getattr(s, 'app_slug', 'MISSING')}")
                # Replicate the logic in the route
                p = RemoteServerPublic.model_validate(s)
                print(f"Validated server {s.name} successfully.")
            except Exception as e:
                print(f"Error validating server {s.id}: {e}")
                # Inspect the instance
                print(f"Instance dict: {s.__dict__}")

except Exception as e:
    print(f"Top level error: {e}")
