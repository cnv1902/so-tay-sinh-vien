"""
api/routers/chat.py
===================
Endpoint chính: POST /api/chat — Cổng giao tiếp của Agentic RAG.
"""

import logging
import time
import uuid
import re
import random
import asyncio

from fastapi import APIRouter, HTTPException, Request, status, BackgroundTasks

from agent.orchestrator import run_agent
from api.schemas import ChatRequest, ChatResponse
from core.session import get_history, save_history
from db.connection import get_db, AsyncSessionLocal
from db.crud import get_slot
from llm import get_langchain_chat_model

from langchain_core.messages import HumanMessage, SystemMessage

from core.embedder import embed
from core.vectordb import search_qa_cache

from deep_translator import GoogleTranslator
try:
    from langdetect import detect
except ImportError:
    # Fallback in case langdetect is missing in environment
    detect = None

from indexing.translator import translate_text

logger = logging.getLogger(__name__)

def detect_and_translate_query(message: str) -> tuple[str, str]:
    """
    Nhận diện ngôn ngữ câu hỏi và dịch sang tiếng Việt để tra cứu vector/DB.
    Hỗ trợ chuẩn xác 100% Tiếng Lào (Lao), Tiếng Anh (English), Tiếng Việt (Vietnamese).
    Trả về: (detected_lang, search_query_vi)
    """
    if not message or not message.strip():
        return "vi", message

    text = message.strip()

    # 1. Phát hiện ký tự tiếng Lào (Unicode block U+0E80 -> U+0EFF)
    if re.search(r'[\u0e80-\u0eff]', text):
        try:
            # Chuẩn hóa tên trường ĐH Vinh trong câu hỏi tiếng Lào
            clean_lao = text
            clean_lao = re.sub(r'ມະຫາວິທະຍາໄລ\s*(ວິນ|ວິ້ງ)', 'ມະຫາວິທະຍາໄລ Vinh', clean_lao)
            clean_lao = re.sub(r'ມ\.\s*(ວິນ|ວິ້ງ)', 'ĐH Vinh', clean_lao)
            
            vi_translated = GoogleTranslator(source='lo', target='vi').translate(clean_lao)
            if vi_translated and vi_translated.strip():
                res_vi = vi_translated.strip()
                # Khắc phục trường hợp Google Translate nhầm lẫn "Vin" thành "Virginia"
                res_vi = re.sub(r'\b(Virginia|Win)\b', 'Vinh', res_vi, flags=re.IGNORECASE)
                return "lo", res_vi
        except Exception as e:
            logger.warning(f"Lỗi dịch tiếng Lào sang tiếng Việt: {e}")
        return "lo", text

    # 2. Phát hiện ký tự có dấu Tiếng Việt
    if re.search(r'[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]', text):
        return "vi", text

    # 3. Dùng langdetect nếu có
    if detect:
        try:
            d = detect(text)
            if d == "lo":
                vi_translated = GoogleTranslator(source='lo', target='vi').translate(text)
                return "lo", vi_translated or text
            elif d not in ["vi"]:
                vi_translated = GoogleTranslator(source='auto', target='vi').translate(text)
                return d, vi_translated or text
        except Exception:
            pass

    # 4. Kiểm tra các từ tiếng Anh thông dụng
    common_en = {"what", "where", "how", "when", "why", "who", "is", "are", "the", "in", "at", "for", "scholarship", "university", "admission", "tuition", "dormitory", "contact", "help", "department", "building"}
    words = set(re.findall(r'\b\w+\b', text.lower()))
    if words & common_en:
        try:
            vi_translated = GoogleTranslator(source='en', target='vi').translate(text)
            if vi_translated and vi_translated.strip():
                return "en", vi_translated.strip()
        except Exception:
            pass
        return "en", text

    return "vi", text

router = APIRouter(prefix="/api", tags=["Chat"])

async def summarize_history_task(session_id: str, chat_history: list[dict]):
    """Background task tóm tắt lịch sử nếu vượt quá 6 messages."""
    if len(chat_history) <= 6:
        return
        
    try:
        # Lấy LLM
        llm = await get_langchain_chat_model()
        
        # Tách lịch sử cũ (bỏ 4 messages cuối cùng ~ 2 lượt)
        old_history = chat_history[:-4]
        recent_history = chat_history[-4:]
        
        # Chuẩn bị prompt tóm tắt
        history_text = "\n".join([f"{msg['role']}: {msg['content']}" for msg in old_history])
        prompt = (
            "Hãy tóm tắt ngắn gọn (trong 1-2 câu) nội dung chính của phần lịch sử trò chuyện sau giữa người dùng và trợ lý tư vấn tuyển sinh đại học.\n\n"
            f"Lịch sử:\n{history_text}\n\n"
            "Chỉ trả về câu tóm tắt, không giải thích."
        )
        
        response = await llm.ainvoke([HumanMessage(content=prompt)])
        summary_text = response.content
        
        # Cập nhật lịch sử mới
        new_history = [{"role": "system", "content": f"[Tóm tắt lịch sử: {summary_text}]"}] + recent_history
        save_history(session_id, new_history)
        logger.info(f"[Summarize] Đã tóm tắt lịch sử thành công cho session {session_id}")
        
    except Exception as e:
        logger.error(f"[Summarize] Lỗi khi tóm tắt lịch sử: {str(e)}")

# ---------------------------------------------------------------------------
# Endpoint: POST /api/chat
# ---------------------------------------------------------------------------

async def save_qa_staging_task(question: str, answer: str) -> None:
    """Đã chuyển qua Backend xử lý."""
    pass

@router.post(
    "/chat",
    response_model=ChatResponse,
    status_code=status.HTTP_200_OK,
    summary="Gửi câu hỏi tuyển sinh và nhận câu trả lời từ chatbot",
    description="Endpoint chính của Chatbot Tuyển sinh ĐH Vinh. Nhận câu hỏi, chạy Agentic RAG và trả về câu trả lời.",
)
async def chat_endpoint(req: ChatRequest, request: Request, background_tasks: BackgroundTasks) -> ChatResponse:
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4())[:8])
    start_time = time.perf_counter()

    logger.info(
        "[Chat/%s] ═══ REQUEST ═══ session=%s | msg=%r",
        request_id,
        req.session_id,
        req.message[:80] + ("..." if len(req.message) > 80 else ""),
    )

    # ── [1.4] Language Detection & Query Translation ──
    original_message = req.message
    detected_lang, search_query = detect_and_translate_query(req.message)

    if detected_lang != "vi":
        logger.info(f"[Chat/{request_id}] Ngôn ngữ phát hiện: '{detected_lang}'. Câu hỏi gốc: '{original_message}' -> Đã dịch sang TV: '{search_query}'")

    # ── [1.5] Semantic Cache Check ──
    try:
        query_vector = embed(search_query)
        cached_qa = search_qa_cache(query_vector, score_threshold=0.85)
        
        if cached_qa:
            logger.info("[Chat/%s] ⚡ Phản hồi tức thì từ Semantic Cache.", request_id)
            
            cached_ans = cached_qa.get("answer", "")
            if detected_lang == "lo":
                cached_ans = translate_text(cached_ans, target_lang='lo')

            chat_history = get_history(req.session_id)
            chat_history.append({"role": "user", "content": original_message})
            chat_history.append({"role": "assistant", "content": cached_ans})
            
            if len(chat_history) > 6:
                background_tasks.add_task(summarize_history_task, req.session_id, chat_history.copy())
            else:
                save_history(req.session_id, chat_history)
                
            return ChatResponse(
                session_id=req.session_id,
                answer=cached_ans,
                sources=["Semantic Cache"],
            )
    except Exception as e:
        logger.warning("[Chat/%s] Lỗi kiểm tra Semantic Cache: %s", request_id, str(e))

    # ── [2] Lấy lịch sử từ Redis ──
    chat_history = get_history(req.session_id)
    
    handoff_data = {}
    
    # ── [3] Chạy Agent Orchestrator ──
    try:
        bot_answer, sources = await run_agent(
            user_message=search_query, 
            chat_history=chat_history, 
            session_id=req.session_id,
            original_message=original_message,
            detected_language=detected_lang
        )
    except Exception as e:
        logger.error(
            "[Chat/%s] Agent pipeline THẤT BẠI: %s",
            request_id, str(e),
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Hệ thống tạm thời gặp sự cố kỹ thuật. Vui lòng thử lại sau.",
        )

    # Strip thinking trace nếu có (cho reasoning model)
    bot_answer = re.sub(r'<think>.*?</think>', '', bot_answer, flags=re.DOTALL).strip()

    if not bot_answer:
        bot_answer = "Xin lỗi, hệ thống tạm thời không thể xử lý câu hỏi này."

    # ── [3.5] Hỗ trợ chuyển đổi câu trả lời sang Tiếng Lào / Tiếng Anh nếu LLM chưa sinh đúng ngôn ngữ ──
    if detected_lang == "lo" and not re.search(r'[\u0e80-\u0eff]', bot_answer):
        logger.info(f"[Chat/{request_id}] Đang chuyển đổi câu trả lời sang Tiếng Lào cho người dùng...")
        bot_answer = translate_text(bot_answer, target_lang='lo') or bot_answer

    # ── [4] Cập nhật lịch sử ──
    chat_history.append({"role": "user", "content": original_message})
    chat_history.append({"role": "assistant", "content": bot_answer})
    
    # ── [4.1] Gọi Background Task tóm tắt lịch sử ──
    if len(chat_history) > 6:
        background_tasks.add_task(summarize_history_task, req.session_id, chat_history.copy())
    else:
        save_ok = save_history(req.session_id, chat_history)
        if not save_ok:
            logger.warning("[Chat/%s] Lỗi lưu Redis.", request_id)

    # ── [4.2] Lưu Q&A vào bảng staging ──
    background_tasks.add_task(save_qa_staging_task, original_message, bot_answer)

    # ── [5] Trả response ──
    elapsed_ms = round((time.perf_counter() - start_time) * 1000)
    logger.info(
        "[Chat/%s] ═══ HOÀN THÀNH ═══ %dms | sources=%d | answer=%d ký tự",
        request_id,
        elapsed_ms,
        len(sources),
        len(bot_answer),
    )

    return ChatResponse(
        session_id=req.session_id,
        answer=bot_answer,
        sources=sources,
    )

