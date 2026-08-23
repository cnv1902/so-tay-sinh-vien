/**
 * Trả về URL của Backend Chính (Xử lý Admin, Auth, DB, WebSocket Handoff)
 */
export const getMainApiUrl = () => {
    return import.meta.env.VITE_MAIN_API_URL || 'http://localhost:8000';
};
  
/**
 * Trả về URL của AI Microservice (Chỉ xử lý LLM inference và RAG)
 */
export const getChatbotApiUrl = () => {
    return import.meta.env.VITE_CHATBOT_API_URL || 'http://localhost:8001';
};
