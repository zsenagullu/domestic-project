from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

import models, schemas, auth
from database import get_db

router = APIRouter()

@router.post("/", response_model=schemas.ReviewResponse)
def create_review(
    review: schemas.ReviewCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    if current_user.role != models.RoleEnum.customer:
        raise HTTPException(status_code=403, detail="Only customers can write reviews")
        
    worker = db.query(models.User).filter(
        models.User.id == review.worker_id,
        models.User.role == models.RoleEnum.worker
    ).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
        
    offer = db.query(models.Offer).filter(models.Offer.id == review.offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
        
    db_review = models.Review(
        offer_id=review.offer_id,
        reviewer_id=current_user.id,
        worker_id=review.worker_id,
        rating=review.rating,
        comment=review.comment
    )
    db.add(db_review)
    db.commit()
    db.refresh(db_review)
    
    # Recalculate worker's rating
    all_worker_reviews = db.query(models.Review).filter(models.Review.worker_id == review.worker_id).all()
    if all_worker_reviews:
        avg_rating = sum(r.rating for r in all_worker_reviews) / len(all_worker_reviews)
        worker.rating = avg_rating
        db.commit()
        db.refresh(worker)
        
    return db_review

@router.get("/worker/{worker_id}", response_model=List[schemas.ReviewResponse])
def get_worker_reviews(
    worker_id: int,
    db: Session = Depends(get_db)
):
    # Verify worker exists
    worker = db.query(models.User).filter(
        models.User.id == worker_id,
        models.User.role == models.RoleEnum.worker
    ).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
        
    return db.query(models.Review).filter(
        models.Review.worker_id == worker_id
    ).order_by(models.Review.created_at.desc()).all()
