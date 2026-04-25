export type ChatLanguage = "en" | "hi";

const API_BASE_URL =
  import.meta.env.VITE_ML_API_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  "http://localhost:8000";

const CHAT_API_URL = `${API_BASE_URL.replace(/\/$/, "")}/chat`;

export interface ChatAction {
  label: string;
  route?: string;
  message?: string;
  url?: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  language: ChatLanguage;
  timestamp: Date;
  isUser: boolean;
  topic?: string;
  suggestions?: string[];
  actions?: ChatAction[];
}

export interface ChatHistoryEntry {
  role: "user" | "assistant";
  text: string;
  topic?: string;
}

export interface ChatResponse {
  reply: string;
  language: ChatLanguage;
  topic: string;
  suggestions: string[];
  actions: ChatAction[];
  fallback?: boolean;
}

const makeActions = (language: ChatLanguage): ChatAction[] => [
  {
    label: language === "hi" ? "Crop Recommendation खोलें" : "Open Crop Recommendation",
    route: "/crop-recommendation",
  },
  {
    label: language === "hi" ? "Crop Monitoring खोलें" : "Open Crop Monitoring",
    route: "/crop-monitoring",
  },
  {
    label: language === "hi" ? "Sowing Calendar खोलें" : "Open Sowing Calendar",
    route: "/sowing-calendar",
  },
  {
    label: language === "hi" ? "Government Updates खोलें" : "Open Government Updates",
    route: "/government-updates",
  },
];

const localFallback = (message: string, language: ChatLanguage): ChatResponse => {
  const normalized = message.trim().toLowerCase();

  if (
    normalized.includes("government") ||
    normalized.includes("scheme") ||
    normalized.includes("pm kisan") ||
    normalized.includes("योजना") ||
    normalized.includes("सरकार")
  ) {
    return {
      reply:
        language === "hi"
          ? "मैं अभी backend से live government feed नहीं ला पाया, लेकिन Government Updates पेज पर आपके लिए app के updates उपलब्ध हैं। आप राज्य, category और official links के साथ उन्हें फ़िल्टर कर सकते हैं।"
          : "I could not reach the live government feed right now, but the Government Updates page in the app still has the available updates with state filters, categories, and official links.",
      language,
      topic: "government_updates",
      suggestions:
        language === "hi"
          ? ["Government Updates खोलें", "PM-KISAN अपडेट दिखाओ"]
          : ["Open Government Updates", "Show PM-KISAN updates"],
      actions: [
        {
          label: language === "hi" ? "Government Updates खोलें" : "Open Government Updates",
          route: "/government-updates",
        },
      ],
      fallback: true,
    };
  }

  if (
    normalized.includes("scan") ||
    normalized.includes("leaf") ||
    normalized.includes("disease") ||
    normalized.includes("रोग") ||
    normalized.includes("पत्ती")
  ) {
    return {
      reply:
        language === "hi"
          ? "Crop Monitoring page Sugarcane, Wheat और Rice की leaf images के लिए बना है। एक साफ, अच्छी रोशनी वाली पत्ती की फोटो अपलोड करें और अगर confidence कम हो तो दूसरी photo से दोबारा scan करें।"
          : "The Crop Monitoring page works for Sugarcane, Wheat, and Rice leaf images. Upload one clear, well-lit leaf photo, and if confidence is low, retake the image and scan again.",
      language,
      topic: "crop_monitoring",
      suggestions:
        language === "hi"
          ? ["Crop Monitoring खोलें", "Rice diseases दिखाओ"]
          : ["Open Crop Monitoring", "Show rice diseases"],
      actions: [
        {
          label: language === "hi" ? "Crop Monitoring खोलें" : "Open Crop Monitoring",
          route: "/crop-monitoring",
        },
      ],
      fallback: true,
    };
  }

  if (
    normalized.includes("sowing") ||
    normalized.includes("calendar") ||
    normalized.includes("kharif") ||
    normalized.includes("rabi") ||
    normalized.includes("बुवाई")
  ) {
    return {
      reply:
        language === "hi"
          ? "Sowing Calendar page state और season के अनुसार crop windows दिखाता है। आप वहाँ जाकर state चुन सकते हैं और detailed guide भी देख सकते हैं।"
          : "The Sowing Calendar page shows crop windows by state and season. You can open it, choose a state, and view detailed growing guides there.",
      language,
      topic: "sowing_calendar",
      suggestions:
        language === "hi"
          ? ["Sowing Calendar खोलें", "Punjab के crops दिखाओ"]
          : ["Open Sowing Calendar", "Show crops for Punjab"],
      actions: [
        {
          label: language === "hi" ? "Sowing Calendar खोलें" : "Open Sowing Calendar",
          route: "/sowing-calendar",
        },
      ],
      fallback: true,
    };
  }

  if (
    normalized.includes("recommend") ||
    normalized.includes("soil") ||
    normalized.includes("ph") ||
    normalized.includes("मिट्टी")
  ) {
    return {
      reply:
        language === "hi"
          ? "Crop Recommendation के लिए pH, N, P, K, temperature, humidity, rainfall, state और season दें। आप चाहें तो सीधे Crop Recommendation page भी खोल सकते हैं।"
          : "For crop recommendation, share pH, N, P, K, temperature, humidity, rainfall, state, and season. You can also open the Crop Recommendation page and fill the full form directly.",
      language,
      topic: "crop_recommendation",
      suggestions:
        language === "hi"
          ? ["Crop Recommendation खोलें", "pH 6.5 nitrogen 100 phosphorus 50 potassium 200 temperature 28 humidity 65 rainfall 1200 state Punjab season Kharif"]
          : ["Open Crop Recommendation", "pH 6.5 nitrogen 100 phosphorus 50 potassium 200 temperature 28 humidity 65 rainfall 1200 state Punjab season Kharif"],
      actions: [
        {
          label: language === "hi" ? "Crop Recommendation खोलें" : "Open Crop Recommendation",
          route: "/crop-recommendation",
        },
      ],
      fallback: true,
    };
  }

  return {
    reply:
      language === "hi"
        ? "मैं आपकी Smart Farming Assistant app में crop recommendation, crop monitoring, sowing calendar और government updates में मदद कर सकता हूँ। आप हिंदी या English में टाइप करें, mic से बोलें, या speaker से जवाब सुनें।"
        : "I can help across the Smart Farming Assistant app with crop recommendation, crop monitoring, sowing calendars, and government updates. You can type in Hindi or English, use the mic to speak, or listen to replies with audio.",
    language,
    topic: "help",
    suggestions:
      language === "hi"
        ? ["मेरी मिट्टी के लिए फसल सुझाओ", "पत्ती की फोटो कैसे स्कैन करूँ?", "Punjab के लिए बुवाई सलाह दिखाओ", "सरकारी योजनाएँ दिखाओ"]
        : ["Recommend a crop for my soil", "How do I scan a leaf image?", "Show sowing advice for Punjab", "Show government schemes"],
    actions: makeActions(language),
    fallback: true,
  };
};

export const buildChatHistory = (messages: ChatMessage[]): ChatHistoryEntry[] =>
  messages.slice(-8).map((message) => ({
    role: message.isUser ? "user" : "assistant",
    text: message.text,
    topic: message.topic,
  }));

export const sendChatMessage = async (
  message: string,
  language: ChatLanguage,
  history: ChatHistoryEntry[] = []
): Promise<ChatResponse> => {
  try {
    const response = await fetch(CHAT_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        language,
        history,
      }),
    });

    if (!response.ok) {
      throw new Error("Chat request failed");
    }

    const data = (await response.json()) as ChatResponse;
    return {
      reply: data.reply,
      language: data.language,
      topic: data.topic,
      suggestions: data.suggestions ?? [],
      actions: data.actions ?? [],
    };
  } catch (error) {
    console.error("Chatbot API error:", error);
    return localFallback(message, language);
  }
};
