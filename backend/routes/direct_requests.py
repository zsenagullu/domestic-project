from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

import models, schemas, auth
from database import get_db

router = APIRouter()

@router.post("/", response_model=schemas.DirectRequestResponse)
def create_direct_request(
    request: schemas.DirectRequestCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    if current_user.role != models.RoleEnum.customer:
        raise HTTPException(status_code=403, detail="Only customers can create direct requests")
        
    worker = db.query(models.User).filter(models.User.id == request.worker_id, models.User.role == models.RoleEnum.worker).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
        
    job = db.query(models.Job).filter(models.Job.id == request.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Job does not belong to the user")

    db_request = models.DirectRequest(
        customer_id=current_user.id,
        worker_id=request.worker_id,
        job_id=request.job_id,
        status="pending"
    )
    db.add(db_request)
    db.commit()
    db.refresh(db_request)
    
    # Create notification for worker
    notification = models.Notification(
        user_id=request.worker_id,
        title="Yeni İş Talebi",
        message=f"{current_user.name} size '{job.title}' işi için doğrudan bir talep gönderdi."
    )
    db.add(notification)
    db.commit()
    
    return db_request

@router.get("/worker/me", response_model=List[schemas.DirectRequestResponse])
def get_my_direct_requests(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    if current_user.role != models.RoleEnum.worker:
        raise HTTPException(status_code=403, detail="Only workers can retrieve their direct requests")
        
    return db.query(models.DirectRequest).filter(models.DirectRequest.worker_id == current_user.id).order_by(models.DirectRequest.created_at.desc()).all()

@router.patch("/{id}/status", response_model=schemas.DirectRequestResponse)
def update_direct_request_status(
    id: int,
    status_update: schemas.DirectRequestStatusUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    if current_user.role != models.RoleEnum.worker:
        raise HTTPException(status_code=403, detail="Only workers can update direct request status")
        
    db_request = db.query(models.DirectRequest).filter(models.DirectRequest.id == id).first()
    if not db_request:
        raise HTTPException(status_code=404, detail="Direct request not found")
        
    if db_request.worker_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this request")
        
    if status_update.status not in ["accepted", "rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status value. Must be 'accepted' or 'rejected'")
        
    db_request.status = status_update.status
    job = db.query(models.Job).filter(models.Job.id == db_request.job_id).first()
    if status_update.status == "accepted":
        if job:
            job.status = models.JobStatusEnum.in_progress
        notification = models.Notification(
            user_id=db_request.customer_id,
            title="İş Talebi Kabul Edildi",
            message=f"{current_user.name} doğrudan göndermiş olduğunuz iş talebini kabul etti."
        )
        db.add(notification)
    elif status_update.status == "rejected":
        notification = models.Notification(
            user_id=db_request.customer_id,
            title="İş Talebi Reddedildi",
            message=f"{current_user.name} doğrudan göndermiş olduğunuz iş talebini reddetti."
        )
        db.add(notification)
            
    db.commit()
    db.refresh(db_request)
    return db_request
