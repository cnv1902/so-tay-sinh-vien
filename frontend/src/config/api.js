/**
 * Trả về URL của Backend Chính (Xử lý Admin, Auth, DB, WebSocket Handoff)
 */
export const getMainApiUrl = () => {
    // Nếu đang truy cập qua domain covit.site hoặc https
    if (typeof window !== 'undefined' && window.location) {
        const hostname = window.location.hostname;
        if (hostname.endsWith('covit.site')) {
            return 'https://backend.covit.site';
        }
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return import.meta.env.VITE_MAIN_API_URL || 'http://localhost:8000';
        }
    }
    return import.meta.env.VITE_MAIN_API_URL || 'https://backend.covit.site';
};
  
/**
 * Trả về URL của AI Microservice (Chỉ xử lý LLM inference và RAG)
 */
export const getChatbotApiUrl = () => {
    if (typeof window !== 'undefined' && window.location) {
        const hostname = window.location.hostname;
        if (hostname.endsWith('covit.site')) {
            return 'https://chatbot.covit.site';
        }
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return import.meta.env.VITE_CHATBOT_API_URL || 'http://localhost:8001';
        }
    }
    return import.meta.env.VITE_CHATBOT_API_URL || 'https://chatbot.covit.site';
};


