from fastapi import APIRouter, Depends, HTTPException
import schemas
from pydantic import BaseModel
import ai_service

router = APIRouter()

class VoiceCommandRequest(BaseModel):
    text: str

class VoiceCommandResponse(BaseModel):
    raw_json: str

@router.post("/analyze-voice", response_model=VoiceCommandResponse)
def analyze_voice_command(request: VoiceCommandRequest):
    try:
        result_json = ai_service.analyze_voice_command(request.text)
        return {"raw_json": result_json}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
