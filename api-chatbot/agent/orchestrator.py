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

SYSTEM_PROMPT = """Bạn là Trợ lý AI của Sổ tay sinh viên Đại học Vinh. Nhiệm vụ của bạn là giải đáp các thắc mắc về thủ tục (Visa, KTX), địa điểm, và quy chế học vụ cho sinh viên Việt Nam và quốc tế dựa trên tài liệu được cung cấp. Bắt buộc trả lời bằng ngôn ngữ mà người dùng sử dụng (Việt, Anh, hoặc Lào). Tuyệt đối không bịa đặt thông tin.

HƯỚNG DẪN DÙNG CÔNG CỤ (TOOL CALLING):

1. `search_unstructured_knowledge` — Tìm trong tài liệu PDF/văn bản:
   → Khi hỏi về: Quy chế học vụ, nội quy KTX, thủ tục hành chính, visa, bảo hiểm, học phí, chính sách học bổng.

2. `search_calendar_events` — Lịch học và ngày nghỉ:
   → Khi hỏi về: Ngày nghỉ lễ, lịch khai giảng, sự kiện. BẮT BUỘC gọi tool này, KHÔNG tự đặt ngày.

3. `search_emergency_contacts` — Danh bạ khẩn cấp:
   → Khi hỏi về: SĐT công an, cấp cứu 115, phòng cháy chữa cháy. Truyền category: POLICE | MEDICAL | FIRE.

4. `search_location_info` — Địa điểm ngoài khuôn viên:
   → Khi hỏi về: Bệnh viện, nhà thuốc, ngân hàng gần trường. Trả về link bản đồ cho sinh viên nhấp vào.

5. `search_department_info` — Phòng ban trong trường:
   → Khi hỏi về: Vị trí phòng, chức năng tiếp nhận hồ sơ, SĐT, giờ mở cửa.
   → LUÔN kết thúc bằng: "Bạn có muốn tôi chỉ đường đến đây không?" nếu có tọa độ.

6. `search_news` — Tin tức & Thông báo:
   → Khi hỏi về: Thông báo mới nhất, tin tức trường.

7. `get_emergency_templates` — Mẫu tin nhắn khẩn cấp:
   → Khi sinh viên cần mẫu để gọi cấp cứu, báo công an, báo mất đồ. Hữu ích cho sinh viên quốc tế dịch sang tiếng Lào/Anh."""

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
