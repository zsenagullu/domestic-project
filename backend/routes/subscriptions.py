from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List

import models, schemas, auth
from database import get_db

router = APIRouter()

PLANS = [
    {
        "id": "basic",
        "name": "Temel Plan",
        "price": 99,
        "features": ["5 teklif/ay", "Profil sayfası", "Temel destek"]
    },
    {
        "id": "professional",
        "name": "Profesyonel",
        "price": 199,
        "features": ["Sınırsız teklif", "Öne çıkan profil", "Öncelikli destek", "İstatistikler"]
    },
    {
        "id": "premium",
        "name": "Premium",
        "price": 399,
        "features": ["Her şey dahil", "Öncelikli eşleşme", "7/24 destek", "Gelişmiş istatistikler"]
    }
]

@router.get("/plans", response_model=List[schemas.PlanDetail])
def get_plans():
    return PLANS

@router.post("/subscribe", response_model=schemas.UserResponse)
def subscribe_to_plan(
    req: schemas.SubscribeRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    if current_user.role != models.RoleEnum.worker:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Yalnızca asistanlar/personeller abone olabilir"
        )
        
    valid_plans = [p["id"] for p in PLANS]
    if req.plan not in valid_plans:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Geçersiz abonelik planı"
        )
        
    current_user.subscription_plan = req.plan
    current_user.subscription_expires_at = datetime.utcnow() + timedelta(days=30)
    
    db.commit()
    db.refresh(current_user)
    return current_user

@router.get("/my-plan", response_model=schemas.UserSubscriptionInfo)
def get_my_plan(
    current_user: models.User = Depends(auth.get_current_active_user)
):
    if current_user.role != models.RoleEnum.worker:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Yalnızca asistanlar/personeller planlarını görebilir"
        )
        
    # Check if subscription has expired
    is_expired = False
    if current_user.subscription_expires_at and current_user.subscription_expires_at < datetime.utcnow():
        is_expired = True
        
    if is_expired:
        return schemas.UserSubscriptionInfo(plan=None, expires_at=None)
        
    return schemas.UserSubscriptionInfo(
        plan=current_user.subscription_plan,
        expires_at=current_user.subscription_expires_at
    )
