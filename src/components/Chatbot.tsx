import React, { useState, useRef, useEffect } from "react";
import { Send, MessageCircle, X, Volume2, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChatMessage, sendChatMessage } from "@/services/chatbotService";
import { toast } from "sonner";

export const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<"en" | "hi">("en");
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const lastTranscriptRef = useRef<string>(""); // NEW

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: "0",
        text:
          language === "en"
            ? "Hello! I'm FarmAssist AI. How can I help you today?"
            : "नमस्ते! मैं FarmAssist AI हूँ। मैं आपकी कैसे मदद कर सकता हूँ?",
        language,
        timestamp: new Date(),
        isUser: false,
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, language]);

  // --- Speech Recognition setup (improved) ---
  const initRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    const rec = new SpeechRecognition();
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.lang = language === "hi" ? "hi-IN" : "en-US";
    rec.continuous = false;

    rec.onstart = () => {
      console.log("Speech recognition started");
      setIsRecording(true);
      lastTranscriptRef.current = "";
    };

    rec.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.trim();
      console.log("Speech recognition result:", transcript);
      lastTranscriptRef.current = transcript;
      setInput((prev) => (prev ? prev + " " + transcript : transcript));
    };

    rec.onerror = (event: any) => {
      const err = event?.error || "unknown";
      console.error("Speech recognition error:", err, event);
      if (err === "not-allowed" || err === "service-not-allowed") {
        toast.error(language === "hi" ? "माइक्रोफ़ोन अनुमति अस्वीकृत" : "Microphone permission denied");
      } else if (err === "no-speech") {
        toast.error(language === "hi" ? "कोई आवाज़ नहीं मिली, पुनः प्रयास करें" : "No speech detected, please try again");
      } else {
        toast.error(language === "hi" ? "वॉयस इनपुट विफल रहा" : "Voice input failed");
      }
      try { rec.stop(); } catch {}
      setIsRecording(false);
      recognitionRef.current = null;
    };

    rec.onend = () => {
      console.log("Speech recognition ended, transcript:", lastTranscriptRef.current);
      setIsRecording(false);
      // only auto-send if we actually captured something
      if ((rec as any)?.lastTranscriptAutoSend && lastTranscriptRef.current?.trim()) {
        // ensure state updated then send
        setTimeout(() => handleSendMessage(), 50);
      }
      recognitionRef.current = null;
    };

    return rec;
  };

  const startRecording = async () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error(
        language === "hi"
          ? "ब्राउज़र वॉयस इनपुट का समर्थन नहीं करता"
          : "Browser doesn't support voice input"
      );
      return;
    }

    // request mic permission explicitly to ensure prompt appears in some browsers
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      console.error("getUserMedia failed:", err);
      toast.error(language === "hi" ? "माइक्रोफ़ोन अनुमति आवश्यक है" : "Microphone permission is required");
      return;
    }

    // optional: quick permissions hint (may not be supported everywhere)
    try {
      // @ts-ignore
      if (navigator.permissions && navigator.permissions.query) {
        try {
          // @ts-ignore
          const perm = await navigator.permissions.query({ name: "microphone" });
          if (perm.state === "denied") {
            toast.error(language === "hi" ? "माइक्रोफ़ोन अनुमति पहले से अस्वीकृत है — सेटिंग्स बदलें" : "Microphone permission is blocked — please enable it in browser settings");
            return;
          }
        } catch {
          // ignore permission query errors
        }
      }
    } catch {
      // ignore
    }

    if (!recognitionRef.current) {
      recognitionRef.current = initRecognition();
      if (!recognitionRef.current) {
        toast.error(language === "hi" ? "वॉयस इनपुट उपलब्ध नहीं है" : "Voice input not available");
        return;
      }
    }

    try {
      recognitionRef.current.lang = language === "hi" ? "hi-IN" : "en-US";
      recognitionRef.current.lastTranscriptAutoSend = true;
      recognitionRef.current.start();
      setIsRecording(true);
    } catch (err: any) {
      console.error("Start recording error:", err);
      const message =
        err?.name === "NotAllowedError" || err?.message?.includes("permission")
          ? language === "hi"
            ? "माइक्रोफ़ोन अनुमति अस्वीकृत — कृपया अनुमति दें"
            : "Microphone permission denied — please allow access"
          : language === "hi"
          ? "रिकॉर्डिंग शुरू नहीं हो सकी"
          : "Could not start recording";
      toast.error(message);
      setIsRecording(false);
      recognitionRef.current = null;
    }
  };

  const stopRecording = () => {
    try {
      recognitionRef.current?.stop();
    } catch {
      // ignore
    } finally {
      setIsRecording(false);
      recognitionRef.current = null;
    }
  };

  // ---- existing send / speech functions ----
  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: input,
      language,
      timestamp: new Date(),
      isUser: true,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const reply = await sendChatMessage(input, language);
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: reply,
        language,
        timestamp: new Date(),
        isUser: false,
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      toast.error(language === "hi" ? "उत्तर प्राप्त करने में विफल" : "Failed to get response");
      console.error("Chat error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeech = (text: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === "hi" ? "hi-IN" : "en-US";
      window.speechSynthesis.speak(utterance);
    } else {
      toast.error(language === "hi" ? "भाषण समर्थन मौजूद नहीं है" : "Speech not supported");
    }
  };

  // cleanup on unmount
  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop();
      } catch {}
      recognitionRef.current = null;
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 bg-green-600 text-white rounded-full p-4 shadow-lg hover:bg-green-700 transition-all z-40"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {/* Chatbot Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 flex flex-col max-h-96">
          {/* Header */}
          <div className="bg-green-600 text-white p-4 rounded-t-lg flex justify-between items-center">
            <h3 className="font-bold">FarmAssist AI</h3>
            <div className="flex gap-2 items-center">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as "en" | "hi")}
                className="px-2 py-1 text-sm bg-green-700 text-white rounded"
              >
                <option value="en">English</option>
                <option value="hi">हिंदी</option>
              </select>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    msg.isUser ? "bg-green-600 text-white" : "bg-gray-100 text-gray-800"
                  }`}
                >
                  <p className="text-sm">{msg.text}</p>
                  {!msg.isUser && (
                    <button
                      onClick={() => handleSpeech(msg.text)}
                      className="mt-2 p-1 hover:bg-gray-200 rounded"
                      title={language === "hi" ? "सुनें" : "Listen"}
                    >
                      <Volume2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t p-4 flex gap-2 items-center">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder={language === "en" ? "Ask me anything..." : "कुछ भी पूछें..."}
              disabled={isLoading}
              className="flex-1"
            />

            {/* Microphone button */}
            <button
              onClick={() => (isRecording ? stopRecording() : startRecording())}
              className={`p-2 rounded-md ${
                isRecording ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-600"
              }`}
              title={isRecording ? (language === "hi" ? "रिकॉर्डिंग रोकें" : "Stop recording") : (language === "hi" ? "वॉयस इनपुट" : "Voice input")}
            >
              {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
            </button>

            <Button
              onClick={handleSendMessage}
              disabled={isLoading || !input.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              <Send size={18} />
            </Button>
          </div>
        </div>
      )}
    </>
  );
};