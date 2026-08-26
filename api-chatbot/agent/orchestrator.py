"""
agent/orchestrator.py
=====================
Agentic RAG Orchestrator (ReAct / Tool Calling Agent).
"""

import logging
from typing import Any
import datetime
from langgraph.prebuilt import create_react_agent
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

from agent.tools import (
    search_unstructured_knowledge, search_calendar_events,
    search_emergency_contacts, search_location_info,
    search_department_info, search_news, get_emergency_templates
)
from llm import get_langchain_chat_model

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """Bạn là Trợ lý AI Thông minh của Sổ tay Sinh viên Đại học Vinh. Nhiệm vụ của bạn là giải đáp chính xác, tận tình các thắc mắc về quy chế học vụ, thủ tục hành chính, địa điểm phòng ban và đời sống sinh viên. Bắt buộc trả lời bằng ngôn ngữ mà người dùng sử dụng (Việt, Anh, hoặc Lào). Tuyệt đối không bịa đặt thông tin.

HƯỚNG DẪN DÙNG CÔNG CỤ (TOOL CALLING):

1. `search_department_info` — Tra cứu Phòng ban & Địa điểm giải quyết thủ tục trong trường:
   → Khi sinh viên hỏi: "Tôi cần rút học bạ", "Làm lại thẻ sinh viên ở đâu", "Xin giấy xác nhận SV / vay vốn / hoãn NVQS ở đâu", "Phòng Đào tạo ở tầng mấy", v.v.
   → Tool này dùng Semantic Vector Search để tìm chính xác đơn vị phụ trách kèm Tòa nhà, Tầng, Số phòng, SĐT và Tọa độ GPS.
   → QUAN TRỌNG: LUÔN GIỮ NGUYÊN chuỗi Action Token `[Tọa độ: lat, lng]` trong câu trả lời (ví dụ: `[Tọa độ: 18.6658, 105.6945]`) để ứng dụng di động tự động hiển thị nút "Chỉ đường đến đây".

2. `search_unstructured_knowledge` — Tìm trong văn bản Quy chế, Đề án tuyển sinh, Học phí:
   → Khi hỏi về: Điều kiện xét tuyển, chính sách học bổng, quy định điểm rèn luyện, nội quy KTX, quy trình xin hoãn thi, biểu phí.

3. `search_calendar_events` — Lịch học, ngày nghỉ lễ & sự kiện:
   → Khi hỏi về: Ngày nghỉ lễ 30/4, Tết, lịch thi, lịch khai giảng. BẮT BUỘC gọi tool này với month/year cụ thể.

4. `search_emergency_contacts` — Danh bạ khẩn cấp:
   → Khi hỏi về: SĐT công an, cấp cứu 115, bảo vệ trường, PCCC.

5. `search_location_info` — Địa điểm tiện ích ngoài trường:
   → Khi hỏi về: Cây ATM, ngân hàng, nhà thuốc, điểm dừng xe buýt xung quanh trường.

6. `search_news` — Tin tức & Thông báo mới nhất từ nhà trường.

7. `get_emergency_templates` — Mẫu tin nhắn khẩn cấp (báo mất đồ, gọi cấp cứu)."""


async def run_agent(user_message: str, chat_history: list[dict], session_id: str) -> tuple[str, list[str]]:
    """
    Thực thi Agent với tool calling và trả về (câu trả lời, danh sách nguồn).
    """
    logger.info(f"[Orchestrator] Khởi chạy Agent cho session {session_id}")
    
    try:
        llm = await get_langchain_chat_model()
    except Exception as e:
        logger.error(f"[Orchestrator] Lỗi lấy LLM: {str(e)}")
        return "Hệ thống đang bảo trì phần trí tuệ nhân tạo. Vui lòng quay lại sau.", []

    tools = [
        search_unstructured_knowledge, search_calendar_events,
        search_emergency_contacts, search_location_info,
        search_department_info, search_news, get_emergency_templates
    ]

    current_year = datetime.datetime.now().year
    dynamic_system_prompt = SYSTEM_PROMPT + f"\nLưu ý thời gian thực: Năm nay là {current_year}."

    try:
        agent = create_react_agent(llm, tools, prompt=dynamic_system_prompt)
    except Exception as e:
        logger.error(f"[Orchestrator] Lỗi khởi tạo agent: {str(e)}")
        return "Xin lỗi, đã có sự cố trong quá trình thiết lập hệ thống tư vấn.", []

    langchain_history = []
    for msg in chat_history:
        if msg.get("role") == "user":
            langchain_history.append(HumanMessage(content=msg.get("content", "")))
        elif msg.get("role") == "assistant":
            langchain_history.append(AIMessage(content=msg.get("content", "")))

    langchain_history.append(HumanMessage(content=user_message))

    try:
        messages = langchain_history.copy()
        logger.info(f"[Orchestrator] Bắt đầu astream. Prompt: {dynamic_system_prompt}")
        
        async for event in agent.astream({"messages": langchain_history}):
            for node_name, node_output in event.items():
                if "messages" in node_output:
                    msgs = node_output["messages"]
                    if not isinstance(msgs, list):
                        msgs = [msgs]
                    messages.extend(msgs)
                                        
        answer = messages[-1].content
        
        sources = []
        import re
        for msg in messages:
            if hasattr(msg, 'name') and msg.name in ["search_unstructured_knowledge"]:
                content = str(msg.content)
                found_sources = re.findall(r"--- Nguồn: (.*?) ---", content)
                sources.extend(found_sources)
                    
        unique_sources = list(dict.fromkeys(sources))
        
        return answer, unique_sources
    except Exception as e:
        logger.error(f"[Orchestrator] Lỗi khi invoke agent: {str(e)}")
        return "Xin lỗi, đã xảy ra lỗi trong quá trình xử lý. Vui lòng thử lại sau.", []
