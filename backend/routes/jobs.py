from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

import models, schemas, auth
from database import get_db

router = APIRouter()

@router.get("/", response_model=List[schemas.JobResponse])
def get_jobs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    jobs = db.query(models.Job).offset(skip).limit(limit).all()
    return jobs

@router.get("/search", response_model=List[schemas.JobResponse])
def search_jobs(
    location: Optional[str] = None,
    house_size: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(models.Job)
    if location:
        query = query.filter(models.Job.location.ilike(f"%{location}%"))
    if house_size:
        query = query.filter(models.Job.house_size == house_size)
    return query.offset(skip).limit(limit).all()

@router.get("/{job_id}", response_model=schemas.JobResponse)
def get_job_by_id(job_id: int, db: Session = Depends(get_db)):
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@router.post("/", response_model=schemas.JobResponse)
def create_job(job: schemas.JobCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    if current_user.role != models.RoleEnum.customer:
         raise HTTPException(status_code=403, detail="Only customers can create jobs")
         
    db_job = models.Job(
        **job.dict(),
        user_id=current_user.id
    )
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job

@router.patch("/{job_id}/status", response_model=schemas.JobResponse)
def update_job_status(job_id: int, status: schemas.JobUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
         raise HTTPException(status_code=404, detail="Job not found")
    if job.user_id != current_user.id:
         raise HTTPException(status_code=403, detail="Not authorized to modify this job")
         
    job.status = status.status
    db.commit()
    db.refresh(job)
    return job

@router.patch("/{job_id}", response_model=schemas.JobResponse)
def update_job(
    job_id: int,
    job_update: schemas.JobUpdateFull,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this job")
        
    update_data = job_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(job, key, value)
        
    db.commit()
    db.refresh(job)
    return job

@router.get("/{job_id}/complete", response_model=schemas.JobResponse)
def complete_job_get(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    return run_complete_job_logic(job_id, db, current_user)

@router.post("/{job_id}/complete", response_model=schemas.JobResponse)
def complete_job_post(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    return run_complete_job_logic(job_id, db, current_user)

def run_complete_job_logic(job_id: int, db: Session, current_user: models.User):
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    if job.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the job owner can complete this job")
        
    if job.status != models.JobStatusEnum.in_progress:
        raise HTTPException(
            status_code=400,
            detail="Only jobs currently in progress can be completed."
        )
        
    job.status = models.JobStatusEnum.completed
    
    # Increment worker's completed_jobs
    accepted_offer = db.query(models.Offer).filter(
        models.Offer.job_id == job_id,
        models.Offer.status == models.OfferStatusEnum.accepted
    ).first()
    
    worker_id = None
    if accepted_offer:
        worker_id = accepted_offer.user_id
    else:
        db_request = db.query(models.DirectRequest).filter(
            models.DirectRequest.job_id == job_id,
            models.DirectRequest.status == "accepted"
        ).first()
        if db_request:
            worker_id = db_request.worker_id
            
    if worker_id:
        worker = db.query(models.User).filter(models.User.id == worker_id).first()
        if worker:
            if worker.completed_jobs is None:
                worker.completed_jobs = 0
            worker.completed_jobs += 1
            
            # Create notification for worker
            notification = models.Notification(
                user_id=worker_id,
                title="İş Tamamlandı",
                message=f"'{job.title}' ilanınız başarıyla tamamlandı. Müşteri tarafından değerlendirilmeyi bekliyorsunuz."
            )
            db.add(notification)
            
    db.commit()
    db.refresh(job)
    return job
