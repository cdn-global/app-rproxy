from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from typing import List, Optional, AsyncGenerator
from pydantic import BaseModel
import anthropic
import openai
import google.generativeai as genai
import os
import uuid
import json
from datetime import datetime
from sqlmodel import Session, select

from app.api.deps import SessionDep, CurrentUser, AuthSource
from app.core.db import engine
from app.core.config import settings
from app.models import LLMModel, LLMUsageLog, Conversation, LLMMessage

router = APIRouter(prefix="/llm", tags=["llm-inference"])


def resolve_model(session: Session, model_identifier: str) -> Optional[LLMModel]:
    """Resolve a model by UUID, model_id string, or name."""
    # Try UUID lookup first
    try:
        model_uuid = uuid.UUID(model_identifier)
        model = session.get(LLMModel, model_uuid)
        if model:
            return model
    except ValueError:
        pass

    # Try by model_id (e.g. "claude-sonnet-4-5-20250929", "gpt-4o")
    stmt = select(LLMModel).where(LLMModel.model_id == model_identifier)
    model = session.exec(stmt).first()
    if model:
        return model

    # Try by name (e.g. "claude-sonnet-4.5", "gpt-4o")
    stmt = select(LLMModel).where(LLMModel.name == model_identifier)
    return session.exec(stmt).first()


class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class ChatCompletionRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    model_id: str  # Accepts UUID or model name/identifier (e.g. "claude-sonnet-4-5-20250929", "gpt-4o")
    messages: List[ChatMessage]
    conversation_id: Optional[uuid.UUID] = None
    max_tokens: int = 4096
    temperature: float = 1.0


class ChatCompletionResponse(BaseModel):
    id: str
    conversation_id: uuid.UUID
    message_id: uuid.UUID
    content: str
    model: str
    input_tokens: int
    output_tokens: int
    cost: float


@router.post("/chat/completions", response_model=ChatCompletionResponse)
async def create_chat_completion(
    request: ChatCompletionRequest,
    session: SessionDep,
    current_user: CurrentUser,
    auth_source: AuthSource,
    background_tasks: BackgroundTasks,
):
    """Create chat completion (follows proxy.py subscription check pattern)"""

    # 1. Verify subscription (same pattern as proxy.py lines 238-241)
    is_in_trial = (
        current_user.is_trial
        and current_user.expiry_date
        and current_user.expiry_date > datetime.utcnow()
    )
    if not current_user.has_subscription and not is_in_trial:
        raise HTTPException(
            status_code=403, detail="Active subscription required for LLM API"
        )

    # 2. Get model config
    model = resolve_model(session, request.model_id)
    if not model or not model.is_active:
        raise HTTPException(status_code=404, detail=f"Model not found: {request.model_id}")

    # 3. Get/create conversation
    if request.conversation_id:
        conversation = session.get(Conversation, request.conversation_id)
        if not conversation or conversation.owner_id != current_user.id:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        conversation = Conversation(
            title=f"Chat {datetime.utcnow().strftime('%Y-%m-%d %H:%M')}",
            owner_id=current_user.id,
        )
        session.add(conversation)
        session.commit()
        session.refresh(conversation)

    # 4. Determine provider from model
    provider_name = model.provider.name if model.provider else "anthropic"

    # 5. Get appropriate API key
    if provider_name == "anthropic":
        api_key = current_user.anthropic_api_key or settings.ANTHROPIC_API_KEY
    elif provider_name == "openai":
        api_key = current_user.openai_api_key or settings.OPENAI_API_KEY
    elif provider_name == "google":
        api_key = current_user.google_api_key or settings.GOOGLE_API_KEY
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported provider: {provider_name}")

    if not api_key:
        raise HTTPException(
            status_code=400,
            detail=f"No API key configured for {provider_name}. Please set your API key in settings."
        )

    # 6. Call appropriate LLM API
    try:
        input_tokens = 0
        output_tokens = 0
        content = ""

        if provider_name == "anthropic":
            client = anthropic.Anthropic(api_key=api_key)
            response = client.messages.create(
                model=model.model_id,
                max_tokens=request.max_tokens,
                temperature=request.temperature,
                messages=[
                    {"role": msg.role, "content": msg.content} for msg in request.messages
                ],
            )
            input_tokens = response.usage.input_tokens
            output_tokens = response.usage.output_tokens
            content = response.content[0].text
            response_id = response.id

        elif provider_name == "openai":
            client = openai.OpenAI(api_key=api_key)
            response = client.chat.completions.create(
                model=model.model_id,
                max_tokens=request.max_tokens,
                temperature=request.temperature,
                messages=[
                    {"role": msg.role, "content": msg.content} for msg in request.messages
                ],
            )
            input_tokens = response.usage.prompt_tokens
            output_tokens = response.usage.completion_tokens
            content = response.choices[0].message.content
            response_id = response.id

        elif provider_name == "google":
            genai.configure(api_key=api_key)
            gemini_model = genai.GenerativeModel(model.model_id)

            # Convert messages to Gemini format
            chat_history = []
            for msg in request.messages[:-1]:
                chat_history.append({
                    "role": "user" if msg.role == "user" else "model",
                    "parts": [msg.content]
                })

            chat = gemini_model.start_chat(history=chat_history)
            response = chat.send_message(
                request.messages[-1].content,
                generation_config=genai.types.GenerationConfig(
                    max_output_tokens=request.max_tokens,
                    temperature=request.temperature,
                )
            )

            content = response.text
            # Estimate tokens for Google (they don't provide exact counts in sync API)
            input_tokens = int(sum(len(msg.content.split()) * 1.3 for msg in request.messages))
            output_tokens = int(len(content.split()) * 1.3)
            response_id = str(uuid.uuid4())

        # 7. Calculate costs
        cost = (input_tokens / 1_000_000 * model.input_token_price) + (
            output_tokens / 1_000_000 * model.output_token_price
        )

        # 8. Save messages
        user_msg = LLMMessage(
            conversation_id=conversation.id,
            role="user",
            content=request.messages[-1].content,
            model_id=model.id,
        )
        session.add(user_msg)

        assistant_msg = LLMMessage(
            conversation_id=conversation.id,
            role="assistant",
            content=content,
            model_id=model.id,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            cost=cost,
        )
        session.add(assistant_msg)
        session.commit()
        session.refresh(assistant_msg)

        # 9. Log usage in background (like proxy.py line 393)
        # Capture IDs before background task to avoid DetachedInstanceError
        user_id = current_user.id
        model_id = model.id
        conversation_id = conversation.id
        message_id = assistant_msg.id

        def log_usage():
            # Create a new session for the background task to avoid thread-safety issues
            try:
                with Session(engine) as bg_session:
                    usage = LLMUsageLog(
                        user_id=user_id,
                        model_id=model_id,
                        conversation_id=conversation_id,
                        message_id=message_id,
                        input_tokens=input_tokens,
                        output_tokens=output_tokens,
                        total_cost=cost,
                        source=auth_source,
                    )
                    bg_session.add(usage)
                    bg_session.commit()
            except Exception as e:
                import logging
                logging.getLogger(__name__).error(f"Failed to log LLM usage: {e}")

        background_tasks.add_task(log_usage)

        return ChatCompletionResponse(
            id=response_id,
            conversation_id=conversation.id,
            message_id=assistant_msg.id,
            content=content,
            model=model.model_id,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            cost=cost,
        )

    except (anthropic.APIError, openai.APIError, Exception) as e:
        raise HTTPException(status_code=500, detail=f"LLM API error: {str(e)}")


@router.post("/chat/completions/stream")
async def create_chat_completion_stream(
    request: ChatCompletionRequest,
    session: SessionDep,
    current_user: CurrentUser,
    auth_source: AuthSource,
):
    """Create streaming chat completion with SSE support for Anthropic, OpenAI, and Google"""

    # 1. Verify subscription
    is_in_trial = (
        current_user.is_trial
        and current_user.expiry_date
        and current_user.expiry_date > datetime.utcnow()
    )
    if not current_user.has_subscription and not is_in_trial:
        raise HTTPException(
            status_code=403, detail="Active subscription required for LLM API"
        )

    # 2. Get model config
    model = resolve_model(session, request.model_id)
    if not model or not model.is_active:
        raise HTTPException(status_code=404, detail=f"Model not found: {request.model_id}")

    # 3. Get/create conversation
    if request.conversation_id:
        conversation = session.get(Conversation, request.conversation_id)
        if not conversation or conversation.owner_id != current_user.id:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        conversation = Conversation(
            title=f"Chat {datetime.utcnow().strftime('%Y-%m-%d %H:%M')}",
            owner_id=current_user.id,
        )
        session.add(conversation)
        session.commit()
        session.refresh(conversation)

    # 4. Determine provider from model
    provider_name = model.provider.name if model.provider else "anthropic"

    # 5. Get appropriate API key
    if provider_name == "anthropic":
        api_key = current_user.anthropic_api_key or settings.ANTHROPIC_API_KEY
    elif provider_name == "openai":
        api_key = current_user.openai_api_key or settings.OPENAI_API_KEY
    elif provider_name == "google":
        api_key = current_user.google_api_key or settings.GOOGLE_API_KEY
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported provider: {provider_name}")

    if not api_key:
        raise HTTPException(
            status_code=400,
            detail=f"No API key configured for {provider_name}. Please set your API key in settings."
        )

    # 6. Save user message
    user_msg = LLMMessage(
        conversation_id=conversation.id,
        role="user",
        content=request.messages[-1].content,
        model_id=model.id,
    )
    session.add(user_msg)
    session.commit()
    session.refresh(user_msg)

    # Capture IDs before async generator to avoid session issues
    user_id = current_user.id
    model_id = model.id
    model_input_price = model.input_token_price
    model_output_price = model.output_token_price
    model_identifier = model.model_id
    conversation_id = conversation.id

    # 7. Stream response based on provider
    async def generate_stream() -> AsyncGenerator[str, None]:
        full_content = ""
        input_tokens = 0
        output_tokens = 0
        response_id = str(uuid.uuid4())

        try:
            if provider_name == "anthropic":
                # Anthropic streaming
                client = anthropic.Anthropic(api_key=api_key)

                with client.messages.stream(
                    model=model_identifier,
                    max_tokens=request.max_tokens,
                    temperature=request.temperature,
                    messages=[
                        {"role": msg.role, "content": msg.content} for msg in request.messages
                    ],
                ) as stream:
                    for text in stream.text_stream:
                        full_content += text
                        # Send SSE formatted chunk
                        chunk_data = {
                            "id": response_id,
                            "conversation_id": str(conversation_id),
                            "content": text,
                            "model": model_identifier,
                            "done": False
                        }
                        yield f"data: {json.dumps(chunk_data)}\n\n"

                    # Get final usage stats
                    final_message = stream.get_final_message()
                    input_tokens = final_message.usage.input_tokens
                    output_tokens = final_message.usage.output_tokens

            elif provider_name == "openai":
                # OpenAI streaming
                client = openai.OpenAI(api_key=api_key)

                stream = client.chat.completions.create(
                    model=model_identifier,
                    max_tokens=request.max_tokens,
                    temperature=request.temperature,
                    messages=[
                        {"role": msg.role, "content": msg.content} for msg in request.messages
                    ],
                    stream=True,
                )

                for chunk in stream:
                    if chunk.choices[0].delta.content:
                        text = chunk.choices[0].delta.content
                        full_content += text
                        chunk_data = {
                            "id": response_id,
                            "conversation_id": str(conversation_id),
                            "content": text,
                            "model": model_identifier,
                            "done": False
                        }
                        yield f"data: {json.dumps(chunk_data)}\n\n"

                # OpenAI doesn't provide token counts in streaming, estimate or make follow-up call
                # For now, we'll make a rough estimate
                input_tokens = sum(len(msg.content.split()) * 1.3 for msg in request.messages)
                output_tokens = len(full_content.split()) * 1.3

            elif provider_name == "google":
                # Google Gemini streaming
                genai.configure(api_key=api_key)
                gemini_model = genai.GenerativeModel(model_identifier)

                # Convert messages to Gemini format
                chat_history = []
                for msg in request.messages[:-1]:
                    chat_history.append({
                        "role": "user" if msg.role == "user" else "model",
                        "parts": [msg.content]
                    })

                chat = gemini_model.start_chat(history=chat_history)
                response = chat.send_message(
                    request.messages[-1].content,
                    stream=True,
                    generation_config=genai.types.GenerationConfig(
                        max_output_tokens=request.max_tokens,
                        temperature=request.temperature,
                    )
                )

                for chunk in response:
                    if chunk.text:
                        full_content += chunk.text
                        chunk_data = {
                            "id": response_id,
                            "conversation_id": str(conversation_id),
                            "content": chunk.text,
                            "model": model_identifier,
                            "done": False
                        }
                        yield f"data: {json.dumps(chunk_data)}\n\n"

                # Estimate tokens for Google
                input_tokens = sum(len(msg.content.split()) * 1.3 for msg in request.messages)
                output_tokens = len(full_content.split()) * 1.3

            # Calculate cost
            cost = (input_tokens / 1_000_000 * model_input_price) + (
                output_tokens / 1_000_000 * model_output_price
            )

            # Use a new session for database operations in async generator
            # This prevents "Session is closed" errors during concurrent requests
            with Session(engine) as stream_session:
                # Save assistant message
                assistant_msg = LLMMessage(
                    conversation_id=conversation_id,
                    role="assistant",
                    content=full_content,
                    model_id=model_id,
                    input_tokens=int(input_tokens),
                    output_tokens=int(output_tokens),
                    cost=cost,
                )
                stream_session.add(assistant_msg)
                stream_session.commit()
                stream_session.refresh(assistant_msg)

                # Log usage
                usage = LLMUsageLog(
                    user_id=user_id,
                    model_id=model_id,
                    conversation_id=conversation_id,
                    message_id=assistant_msg.id,
                    input_tokens=int(input_tokens),
                    output_tokens=int(output_tokens),
                    total_cost=cost,
                    source=auth_source,
                )
                stream_session.add(usage)
                stream_session.commit()

                # Send final chunk with completion data
                final_data = {
                    "id": response_id,
                    "conversation_id": str(conversation_id),
                    "message_id": str(assistant_msg.id),
                    "content": "",
                    "model": model_identifier,
                    "input_tokens": int(input_tokens),
                    "output_tokens": int(output_tokens),
                    "cost": cost,
                    "done": True
                }
                yield f"data: {json.dumps(final_data)}\n\n"

        except Exception as e:
            error_data = {
                "error": str(e),
                "done": True
            }
            yield f"data: {json.dumps(error_data)}\n\n"

    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        }
    )
