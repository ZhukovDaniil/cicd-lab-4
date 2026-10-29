import os
from fastapi import Depends, FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select, text
from sqlalchemy.orm import Session
from .database import get_db
from .models import Component
from .schemas import ComponentCreate, ComponentOut, ComponentUpdate

app = FastAPI(title="PC Components API", version="1.0.0", description="CRUD API for a PC components catalogue")
origins = [x.strip() for x in os.getenv("CORS_ORIGINS", "http://localhost:8080").split(",") if x.strip()]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/api/health")
def api_health(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    return {"status": "ok", "database": "connected"}

@app.get("/api/items", response_model=list[ComponentOut])
def list_items(db: Session = Depends(get_db)):
    return list(db.scalars(select(Component).order_by(Component.id.desc())).all())

@app.get("/api/items/{item_id}", response_model=ComponentOut)
def get_item(item_id: int, db: Session = Depends(get_db)):
    item = db.get(Component, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Component not found")
    return item

@app.post("/api/items", response_model=ComponentOut, status_code=201)
def create_item(payload: ComponentCreate, db: Session = Depends(get_db)):
    item = Component(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@app.put("/api/items/{item_id}", response_model=ComponentOut)
def update_item(item_id: int, payload: ComponentUpdate, db: Session = Depends(get_db)):
    item = db.get(Component, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Component not found")
    for key, value in payload.model_dump().items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item

@app.delete("/api/items/{item_id}", status_code=204)
def delete_item(item_id: int, db: Session = Depends(get_db)):
    item = db.get(Component, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Component not found")
    db.delete(item)
    db.commit()
    return Response(status_code=204)
