const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface ChatMessage {
  id: string;
  text: string;
  language: 'en' | 'hi';
  timestamp: Date;
  isUser: boolean;
}

const fallbackResponses: Record<string, Record<string, string>> = {
  en: {
    default: "I'm here to help with crop management, disease detection, weather updates, and government schemes. What would you like to know?",
  },
  hi: {
    default: "मैं फसल प्रबंधन, रोग पहचान, मौसम अपडेट और सरकारी योजनाओं में मदद कर सकता हूँ। आप क्या जानना चाहते हैं?",
  },
};

export const sendChatMessage = async (
  message: string,
  language: 'en' | 'hi'
): Promise<string> => {
  return fallbackResponses[language].default;
};