"""AI assistant endpoints — /ask and /me."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user
from app.models import User, RequestLog
from app.schemas import AskRequest, AskResponse, UserMe
from app.services.openai_service import generate_response, count_tokens
from app.config import get_settings

settings = get_settings()
router = APIRouter(tags=["assistant"])


@router.get("/me", response_model=UserMe)
def get_me(user: User = Depends(get_current_user)):
    """Return the current user's profile and usage stats."""
    return user


@router.post("/ask", response_model=AskResponse)
def ask_question(
    body: AskRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Process a single, stateless AI question."""

    # Check request limit
    if user.requests_used >= user.max_requests:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Request limit reached. No more questions allowed.",
        )

    # Pre-validate token count before calling OpenAI
    estimated_tokens = count_tokens(body.prompt) + count_tokens(settings.SYSTEM_PROMPT)
    if estimated_tokens > settings.MAX_INPUT_TOKENS:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Input too long: ~{estimated_tokens} tokens (max {settings.MAX_INPUT_TOKENS}). Please shorten your message.",
        )

    # Call OpenAI
    try:
        result = generate_response(body.prompt)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI service error: {str(e)}",
        )

    # Log the interaction
    log = RequestLog(
        user_id=user.id,
        prompt=body.prompt,
        response=result["response"],
        input_tokens=result["input_tokens"],
        output_tokens=result["output_tokens"],
    )
    db.add(log)

    # Increment usage counter
    user.requests_used += 1
    db.commit()

    return AskResponse(
        response=result["response"],
        input_tokens=result["input_tokens"],
        output_tokens=result["output_tokens"],
        requests_remaining=user.max_requests - user.requests_used,
    )


@router.get("/history", response_model=list[dict])
def get_history(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return the current user's interaction history."""
    logs = (
        db.query(RequestLog)
        .filter(RequestLog.user_id == user.id)
        .order_by(RequestLog.created_at.desc())
        .all()
    )
    return [
        {
            "id": log.id,
            "prompt": log.prompt,
            "response": log.response,
            "input_tokens": log.input_tokens,
            "output_tokens": log.output_tokens,
            "created_at": log.created_at,
        }
        for log in logs
    ]
