from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

import models, schemas, auth
from database import get_db

router = APIRouter()

@router.post("/", response_model=schemas.OfferResponse)
def create_offer(offer: schemas.OfferCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    if current_user.role != models.RoleEnum.staff:
         raise HTTPException(status_code=403, detail="Only staff can create offers")
         
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
    db.commit()
    db.refresh(offer)
    return offer

@router.get("/user/me", response_model=List[schemas.OfferResponse])
def get_my_offers(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    return db.query(models.Offer).filter(models.Offer.user_id == current_user.id).all()
