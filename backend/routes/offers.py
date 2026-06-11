from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta

import models, schemas, auth
from database import get_db

router = APIRouter()

@router.post("/", response_model=schemas.OfferResponse)
def create_offer(offer: schemas.OfferCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    if current_user.role != models.RoleEnum.worker:
         raise HTTPException(status_code=403, detail="Only workers can create offers")
         
    # 1. Enforce active subscription
    is_active = True
    if not current_user.subscription_plan:
        is_active = False
    elif current_user.subscription_expires_at and current_user.subscription_expires_at < datetime.utcnow():
        is_active = False
        
    if not is_active:
        raise HTTPException(
            status_code=403,
            detail="Teklif vermek için aktif bir aboneliğinizin olması gerekmektedir."
        )
        
    # 2. Check 5 offers monthly limit for basic plan
    if current_user.subscription_plan == "basic":
        # Calculate billing period start (subscription_expires_at - 30 days)
        start_date = current_user.subscription_expires_at - timedelta(days=30) if current_user.subscription_expires_at else datetime.utcnow() - timedelta(days=30)
        offers_count = db.query(models.Offer).filter(
            models.Offer.user_id == current_user.id,
            models.Offer.created_at >= start_date
        ).count()
        if offers_count >= 5:
            raise HTTPException(
                status_code=403,
                detail="Temel planda aylık en fazla 5 teklif verebilirsiniz. Lütfen planınızı yükseltin."
            )
         
    job = db.query(models.Job).filter(models.Job.id == offer.job_id).first()
    if not job:
         raise HTTPException(status_code=404, detail="Job not found")

    db_offer = models.Offer(
        offered_price=offer.offered_price,
        message=offer.message,
        estimated_time=offer.estimated_time,
        job_id=offer.job_id,
        user_id=current_user.id
    )
    db.add(db_offer)
    db.commit()
    db.refresh(db_offer)
    return db_offer

@router.patch("/{offer_id}/status", response_model=schemas.OfferResponse)
def modify_offer_status(offer_id: int, status_update: schemas.OfferUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    offer = db.query(models.Offer).filter(models.Offer.id == offer_id).first()
    if not offer:
         raise HTTPException(status_code=404, detail="Offer not found")
         
    # Only job owner can accept/reject offers
    job = db.query(models.Job).filter(models.Job.id == offer.job_id).first()
    if job.user_id != current_user.id:
         raise HTTPException(status_code=403, detail="Not authorized to modify this offer status")
    
    offer.status = status_update.status
    if status_update.status == models.OfferStatusEnum.accepted:
        job.status = models.JobStatusEnum.in_progress
        
    db.commit()
    db.refresh(offer)
    return offer

@router.get("/user/me", response_model=List[schemas.OfferResponse])
def get_my_offers(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    return db.query(models.Offer).filter(models.Offer.user_id == current_user.id).all()
