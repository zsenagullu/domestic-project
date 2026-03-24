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
