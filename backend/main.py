from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
import json
import os
from dotenv import load_dotenv
import asyncio
from typing import Optional
import aiofiles
import requests

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))

from agents.language_router import LanguageRouterAgent
from agents.kb_retriever import KBRetrieverAgent
from agents.response_generator import ResponseGeneratorAgent
from agents.quality_checker import QualityCheckerAgent
from services.groq_service import GroqService
from services.heygen_service import HeyGenService
from services.whisper_service import WhisperService
from services.vector_db_service import VectorDBService

app = FastAPI(title="Multilingual Support Agent with Speaking Avatar")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
groq_service = GroqService()
heygen_service = HeyGenService()
whisper_service = WhisperService()
vector_db_service = VectorDBService()

# Initialize agents
language_router = LanguageRouterAgent(groq_service)
kb_retriever = KBRetrieverAgent(vector_db_service)
response_generator = ResponseGeneratorAgent(groq_service)
quality_checker = QualityCheckerAgent(groq_service)


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "ok",
        "message": "Multilingual Support Agent with Speaking Avatar is running",
        "version": "1.0.0"
    }


@app.post("/api/support")
async def handle_support_request(
    audio_file: Optional[UploadFile] = File(None),
    text_input: Optional[str] = Form(None),
    language: Optional[str] = Form(None),
    avatar_id: Optional[str] = Form(None)
):
    """
    Main endpoint for customer support with speaking avatar
    Accepts either audio (transcribed) or text input
    Returns video URL of speaking avatar
    """
    try:
        customer_language = language
        customer_text = text_input.strip() if isinstance(text_input, str) else None

        # Step 1: Transcribe audio if provided
        if audio_file and not text_input:
            customer_text, detected_lang = await whisper_service.transcribe(audio_file)
            customer_text = customer_text.strip() if isinstance(customer_text, str) else None
            if not customer_language:
                customer_language = detected_lang

        if not customer_text:
            raise HTTPException(
                status_code=400,
                detail="Please provide either text input or a valid audio recording."
            )

        # Step 2: Detect language if not provided
        if not customer_language:
            detected_lang, confidence = await language_router.detect_language(customer_text)
            customer_language = detected_lang

        # Step 3: Extract intent and entities
        intent, entities = await language_router.extract_intent(
            customer_text, customer_language
        )

        # Step 4: Retrieve relevant KB documents
        kb_docs = await kb_retriever.retrieve(
            customer_text, customer_language, intent
        )

        # Step 5: Generate response in customer's language
        response_text = await response_generator.generate(
            query=customer_text,
            language=customer_language,
            intent=intent,
            kb_context=kb_docs,
            entities=entities
        )

        # Step 6: Validate response quality
        is_valid, feedback = await quality_checker.validate(response_text)
        if not is_valid:
            response_text = await response_generator.regenerate(
                query=customer_text,
                language=customer_language,
                feedback=feedback,
                kb_context=kb_docs
            )

        if customer_language:
            detected_response_language, _ = await language_router.detect_language(response_text)
            if detected_response_language != customer_language:
                response_text = await whisper_service.translate_text(
                    response_text,
                    customer_language
                )

        # Step 7: Generate speaking avatar video
        resolved_avatar_id = await heygen_service.resolve_avatar_id(avatar_id)
        print(f"Generating avatar video for: {response_text}")
        video_url = await heygen_service.generate_speaking_avatar_video(
            text=response_text,
            language=customer_language,
            avatar_id=resolved_avatar_id
        )

        return JSONResponse({
            "status": "success",
            "language": customer_language,
            "intent": intent,
            "response_text": response_text,
            "video_url": video_url,
            "transcript": customer_text,
            "avatar_id": resolved_avatar_id
        })

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in support request: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/transcribe")
async def transcribe_audio(audio_file: UploadFile = File(...)):
    """
    Transcribe audio to text using Whisper API
    """
    try:
        text, language = await whisper_service.transcribe(audio_file)
        return {
            "text": text,
            "language": language,
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/avatars")
async def get_available_avatars():
    """
    HeyGen V3: `looks` entries use `id` as the value to send as avatar_id (look id).
    `groups` are avatar characters; video endpoints need a look id, not a group id.
    """
    try:
        looks = await heygen_service.list_avatar_looks()
        groups = await heygen_service.get_avatars()
        return {"status": "success", "looks": looks, "groups": groups}
    except Exception as e:
        return {
            "status": "success",
            "looks": [],
            "groups": [],
            "error": str(e),
        }


@app.get("/api/languages")
async def get_supported_languages():
    """
    Get list of supported languages for avatar and TTS
    """
    supported = {
        "es": {"name": "Spanish", "flag": "🇪🇸", "voice": "es_ES_Female"},
        "en": {"name": "English", "flag": "🇬🇧", "voice": "en_US_Male"},
        "fr": {"name": "French", "flag": "🇫🇷", "voice": "fr_FR_Female"},
        "de": {"name": "German", "flag": "🇩🇪", "voice": "de_DE_Male"},
        "pt": {"name": "Portuguese", "flag": "🇵🇹", "voice": "pt_BR_Female"},
        "ja": {"name": "Japanese", "flag": "🇯🇵", "voice": "ja_JP_Female"},
        "zh": {"name": "Mandarin", "flag": "🇨🇳", "voice": "zh_CN_Female"},
        "hi": {"name": "Hindi", "flag": "🇮🇳", "voice": "hi_IN_Female"},
        "ko": {"name": "Korean", "flag": "🇰🇷", "voice": "ko_KR_Female"},
        "it": {"name": "Italian", "flag": "🇮🇹", "voice": "it_IT_Female"},
        "ru": {"name": "Russian", "flag": "🇷🇺", "voice": "ru_RU_Male"},
        "ar": {"name": "Arabic", "flag": "🇸🇦", "voice": "ar_SA_Male"}
    }
    return {"languages": supported, "status": "success"}


@app.post("/api/generate-avatar-video")
async def generate_avatar_video_endpoint(
    text: str,
    language: str = "en",
    avatar_id: Optional[str] = None
):
    """
    Generate avatar video directly from text
    """
    try:
        resolved_avatar_id = await heygen_service.resolve_avatar_id(avatar_id)
        video_url = await heygen_service.generate_speaking_avatar_video(
            text=text,
            language=language,
            avatar_id=resolved_avatar_id
        )
        return {
            "status": "success",
            "video_url": video_url,
            "language": language,
            "avatar_id": resolved_avatar_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=os.getenv("ENV") == "development"
    )
