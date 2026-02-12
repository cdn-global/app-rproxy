from fastapi import APIRouter, HTTPException
from sqlmodel import func, select
import uuid

from app.api.deps import CurrentUser, SessionDep
from app.models import (
    Conversation,
    ConversationCreate,
    ConversationPublic,
    ConversationsPublic,
    ConversationUpdate,
    LLMMessage,
    MessagePublic,
    MessagesPublic,
)

router = APIRouter(prefix="/conversations", tags=["conversations"])


@router.get("/", response_model=ConversationsPublic)
def list_conversations(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
):
    """List user's conversations"""
    count_statement = (
        select(func.count())
        .select_from(Conversation)
        .where(Conversation.owner_id == current_user.id)
    )
    count = session.exec(count_statement).one()

    statement = (
        select(Conversation)
        .where(Conversation.owner_id == current_user.id)
        .offset(skip)
        .limit(limit)
        .order_by(Conversation.updated_at.desc())
    )
    conversations = session.exec(statement).all()

    return ConversationsPublic(data=conversations, count=count)


@router.get("/{id}", response_model=ConversationPublic)
def get_conversation(session: SessionDep, current_user: CurrentUser, id: uuid.UUID):
    """Get conversation details"""
    conversation = session.get(Conversation, id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if conversation.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    return conversation


@router.post("/", response_model=ConversationPublic)
def create_conversation(
    session: SessionDep,
    current_user: CurrentUser,
    conversation_in: ConversationCreate,
):
    """Create new conversation"""
    conversation = Conversation(
        title=conversation_in.title,
        owner_id=current_user.id,
    )
    session.add(conversation)
    session.commit()
    session.refresh(conversation)
    return conversation


@router.put("/{id}", response_model=ConversationPublic)
def update_conversation(
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    conversation_in: ConversationUpdate,
):
    """Update conversation (e.g., rename)"""
    conversation = session.get(Conversation, id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if conversation.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    update_data = conversation_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(conversation, key, value)

    session.add(conversation)
    session.commit()
    session.refresh(conversation)
    return conversation


@router.delete("/{id}")
def delete_conversation(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
):
    """Delete conversation and all messages"""
    conversation = session.get(Conversation, id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if conversation.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    session.delete(conversation)
    session.commit()
    return {"ok": True}


@router.get("/{id}/messages", response_model=MessagesPublic)
def get_conversation_messages(
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    skip: int = 0,
    limit: int = 100,
):
    """Get messages for a conversation"""
    conversation = session.get(Conversation, id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if conversation.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    count_statement = (
        select(func.count())
        .select_from(LLMMessage)
        .where(LLMMessage.conversation_id == id)
    )
    count = session.exec(count_statement).one()

    statement = (
        select(LLMMessage)
        .where(LLMMessage.conversation_id == id)
        .offset(skip)
        .limit(limit)
        .order_by(LLMMessage.created_at.asc())
    )
    messages = session.exec(statement).all()

    return MessagesPublic(data=messages, count=count)
