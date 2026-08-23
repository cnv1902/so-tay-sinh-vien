import { Platform } from 'react-native';

// Sử dụng 10.0.2.2 cho Android Emulator, localhost cho iOS/Web
export const API_BASE_URL = Platform.OS === 'android' 
  ? 'http://10.0.2.2:8000' 
  : 'http://localhost:8000';

export const API_CHATBOT_URL = Platform.OS === 'android' 
  ? 'http://10.0.2.2:8001' 
  : 'http://localhost:8001';

export const API_STATIC_DATA_URL = `${API_BASE_URL}/static/data`;