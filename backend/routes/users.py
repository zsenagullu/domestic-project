from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional

import models, schemas, auth
from database import get_db

router = APIRouter()

@router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(auth.get_current_active_user)):
    return current_user

@router.patch("/me", response_model=schemas.UserResponse)
def update_me(
    user_update: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    if user_update.location is not None:
        current_user.location = user_update.location
    if user_update.hourly_rate is not None:
        current_user.hourly_rate = user_update.hourly_rate
    if user_update.skills is not None:
        current_user.skills = user_update.skills
    if user_update.bio is not None:
        current_user.bio = user_update.bio
        
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/me/photo", response_model=schemas.UserResponse)
def upload_photo(
    photo_payload: schemas.UserPhotoUpload,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    current_user.photo_url = photo_payload.photo
    db.commit()
    db.refresh(current_user)
    return current_user

@router.get("/match", response_model=List[schemas.WorkerMatchResponse])
def get_matches(
    location: Optional[str] = None,
    house_size: Optional[str] = None,
    service_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    # 1. Tüm worker'ları çek
    workers = db.query(models.User).filter(models.User.role == models.RoleEnum.worker).all()
    
    scored_workers = []
    
    # 2. Her worker için puan hesapla
    for worker in workers:
        score = 0
        
        # Konum eşleşmesi: +40 puan
        if location and worker.location:
            loc_param = location.strip().lower()
            w_loc = worker.location.strip().lower()
            if loc_param in w_loc or w_loc in loc_param:
                score += 40
                
        # Rating varsa: rating * 10 puan ekle
        if worker.rating is not None:
            score += worker.rating * 10
            
        # hourly_rate varsa: +10 puan
        if worker.hourly_rate is not None:
            score += 10
            
        # skills doluysa: +10 puan
        if worker.skills and len(worker.skills) > 0:
            score += 10
            
        scored_workers.append((worker, score))
        
    # 3. Puana göre sırala, en yüksek 5 worker döndür
    scored_workers.sort(key=lambda x: x[1], reverse=True)
    top_workers = [w[0] for w in scored_workers[:5]]
    
    return top_workers

@router.get("/{user_id}", response_model=schemas.UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.get("/{user_id}/stats")
def get_user_stats(user_id: int, db: Session = Depends(get_db)):
    # Verify user is a worker
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="User not found")
        
    completed_jobs_count = db.query(models.Offer).filter(
        models.Offer.user_id == user_id,
        models.Offer.status == models.OfferStatusEnum.accepted
    ).count()
    return {"completed_jobs_count": completed_jobs_count}
