import React, { useState, useRef, useEffect } from 'react';

const TestChat = () => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Xin chào! Tôi là Trợ lý Sinh viên Đại học Vinh. Tôi có thể giúp gì cho bạn?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      // Chatbot microservice runs on port 8001
      const res = await fetch('http://localhost:8001/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: 'test-session-admin',
          message: userMessage,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.answer,
        sources: data.sources 
      }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Xin lỗi, đã có lỗi xảy ra khi kết nối tới máy chủ Chatbot. Vui lòng kiểm tra xem Backend (api-chatbot) đã chạy chưa (Port 8000).' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="bg-blue-600 text-white py-4 px-6 shadow-md flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">Chatbot Tester</h1>
          <p className="text-sm opacity-80">Test giao diện Chat đa ngôn ngữ & RAG</p>
        </div>
        <a href="/admin/login" className="text-sm underline hover:text-gray-200">Về trang Admin</a>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:px-40 flex flex-col gap-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-blue-500 text-white rounded-br-none' 
                  : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100/20 text-xs opacity-80">
                  <span className="font-semibold">Nguồn: </span>
                  {msg.sources.join(', ')}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-none p-4 shadow-sm text-gray-500 flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white border-t p-4 md:px-6 lg:px-40">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Nhập câu hỏi bằng Tiếng Việt, Tiếng Anh, hoặc Tiếng Lào..."
            className="flex-1 border rounded-full px-6 py-3 focus:outline-none focus:border-blue-500 shadow-sm"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 text-white px-8 py-3 rounded-full font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Gửi
          </button>
        </form>
      </div>
    </div>
  );
};

export default TestChat;
