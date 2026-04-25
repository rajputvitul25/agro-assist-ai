import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bot,
  ExternalLink,
  Globe2,
  Loader2,
  MessageCircle,
  Mic,
  MicOff,
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import {
  ChatAction,
  ChatLanguage,
  ChatMessage,
  buildChatHistory,
  sendChatMessage,
} from "@/services/chatbotService";
import { toast } from "sonner";

const LANGUAGE_STORAGE_KEY = "farmassist_chat_language";
const AUTO_SPEAK_STORAGE_KEY = "farmassist_chat_auto_speak";

const getId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionEventLike = {
  results: ArrayLike<
    ArrayLike<{
      transcript: string;
    }>
  >;
};

const getRecognitionConstructor = () =>
  typeof window === "undefined"
    ? null
    : (window as Window & {
        SpeechRecognition?: new () => SpeechRecognitionLike;
        webkitSpeechRecognition?: new () => SpeechRecognitionLike;
      }).SpeechRecognition ||
      (window as Window & {
        SpeechRecognition?: new () => SpeechRecognitionLike;
        webkitSpeechRecognition?: new () => SpeechRecognitionLike;
      }).webkitSpeechRecognition ||
      null;

const releaseMediaStream = (stream: MediaStream | null) => {
  stream?.getTracks().forEach((track) => track.stop());
};

const extractTranscript = (event: SpeechRecognitionEventLike) => {
  const fragments: string[] = [];
  const totalResults = typeof event.results?.length === "number" ? event.results.length : 0;

  for (let index = 0; index < totalResults; index += 1) {
    const transcript = event.results[index]?.[0]?.transcript?.trim();

    if (transcript) {
      fragments.push(transcript);
    }
  }

  return fragments.join(" ").replace(/\s+/g, " ").trim();
};

const createWelcomeMessage = (language: ChatLanguage): ChatMessage => ({
  id: getId(),
  text:
    language === "hi"
      ? "नमस्ते! मैं FarmAssist AI हूँ। मैं crop recommendation, crop monitoring, sowing calendar और government updates में आपकी मदद कर सकता हूँ। आप हिंदी या English में लिख सकते हैं, माइक से बोल सकते हैं, और speaker से जवाब सुन सकते हैं।"
      : "Hello! I'm FarmAssist AI. I can help with crop recommendation, crop monitoring, sowing calendars, and government updates. You can type in Hindi or English, speak with the mic, and listen to replies with audio.",
  language,
  timestamp: new Date(),
  isUser: false,
  topic: "help",
  suggestions:
    language === "hi"
      ? [
          "मेरी मिट्टी के लिए फसल सुझाओ",
          "पत्ती की फोटो कैसे स्कैन करूँ?",
          "Punjab के लिए बुवाई सलाह दिखाओ",
          "सरकारी योजनाएँ दिखाओ",
        ]
      : [
          "Recommend a crop for my soil",
          "How do I scan a leaf image?",
          "Show sowing advice for Punjab",
          "Latest government schemes",
        ],
  actions: [
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
  ],
});

export const Chatbot: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<ChatLanguage>(() => {
    if (typeof window === "undefined") return "en";
    const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return saved === "hi" ? "hi" : "en";
  });
  const [autoSpeak, setAutoSpeak] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(AUTO_SPEAK_STORAGE_KEY) === "true";
  });
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [recognitionSupported, setRecognitionSupported] = useState(false);
  const [activeSpeechId, setActiveSpeechId] = useState<string | null>(null);
  const [voiceStatus, setVoiceStatus] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const permissionStreamRef = useRef<MediaStream | null>(null);
  const transcriptRef = useRef("");
  const manualStopRef = useRef(false);
  const latestLanguageRef = useRef<ChatLanguage>(language);

  useEffect(() => {
    latestLanguageRef.current = language;
  }, [language]);

  useEffect(() => {
    setSpeechSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    setRecognitionSupported(Boolean(getRecognitionConstructor()));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [language]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(AUTO_SPEAK_STORAGE_KEY, String(autoSpeak));
  }, [autoSpeak]);

  useEffect(() => {
    if (!isOpen) return;

    setMessages((current) => {
      if (current.length === 0) {
        return [createWelcomeMessage(language)];
      }

      const hasOnlyInitialMessage =
        current.length === 1 && !current[0].isUser && current[0].topic === "help";

      return hasOnlyInitialMessage ? [createWelcomeMessage(language)] : current;
    });
  }, [isOpen, language]);

  useEffect(() => {
    if (!isOpen) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [isOpen, messages, isLoading]);

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore cleanup errors
      }
      releaseMediaStream(permissionStreamRef.current);
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const labels = useMemo(
    () => ({
      title: "FarmAssist AI",
      subtitle: "Hindi + English assistant for the full app",
      placeholder:
        language === "hi"
          ? "यहाँ लिखें या माइक से बोलें..."
          : "Ask anything or use the mic...",
      listening: language === "hi" ? "सुन रहा है..." : "Listening...",
      mic: language === "hi" ? "माइक" : "Mic",
      autoVoice: language === "hi" ? "Auto voice" : "Auto voice",
      noAudio:
        language === "hi"
          ? "आपका browser speech output support नहीं करता।"
          : "Your browser does not support speech output.",
      noMic:
        language === "hi"
          ? "आपका browser voice input support नहीं करता।"
          : "Your browser does not support voice input.",
      permissionDenied:
        language === "hi"
          ? "Microphone permission required है।"
          : "Microphone permission is required.",
      failed:
        language === "hi"
          ? "जवाब पाने में समस्या आई।"
          : "There was a problem getting a reply.",
      helper:
        language === "hi"
          ? "Tip: आप English या हिंदी दोनों में पूछ सकते हैं।"
          : "Tip: you can ask in English or Hindi.",
      processing:
        language === "hi"
          ? "जवाब तैयार हो रहा है..."
          : "Preparing a reply...",
      micReady:
        language === "hi"
          ? "माइक तैयार है। बोलें और मैं आपके शब्द भेज दूँगा।"
          : "Mic is ready. Speak and I will send your words.",
      micStarting:
        language === "hi"
          ? "माइक्रोफ़ोन शुरू हो रहा है..."
          : "Starting microphone...",
      micStopping:
        language === "hi"
          ? "रिकॉर्डिंग रोकी जा रही है..."
          : "Stopping recording...",
      micStopped:
        language === "hi" ? "रिकॉर्डिंग रोक दी गई।" : "Recording stopped.",
      micSending:
        language === "hi"
          ? "आवाज़ मिल गई, संदेश भेजा जा रहा है..."
          : "Voice captured, sending message...",
      micNoSpeech:
        language === "hi"
          ? "कोई साफ़ आवाज़ नहीं मिली। फिर से कोशिश करें।"
          : "No clear speech was detected. Please try again.",
      micBrowserHint:
        language === "hi"
          ? "Voice input Chrome या Edge में सबसे बेहतर काम करता है।"
          : "Voice input works best in Chrome or Edge.",
      micNeedsSecureContext:
        language === "hi"
          ? "Voice input के लिए secure context चाहिए. localhost या https उपयोग करें।"
          : "Voice input requires a secure context. Use localhost or https.",
      micUnavailable:
        language === "hi"
          ? "इस browser में speech-to-text उपलब्ध नहीं है।"
          : "Speech-to-text is not available in this browser.",
      micNoDevice:
        language === "hi"
          ? "कोई microphone device नहीं मिला।"
          : "No microphone device was detected.",
      micNetworkError:
        language === "hi"
          ? "Voice recognition service तक पहुँच नहीं हो सकी।"
          : "The voice recognition service could not be reached.",
    }),
    [language]
  );

  const lastAssistantMessage = [...messages].reverse().find((message) => !message.isUser);

  const stopSpeaking = () => {
    if (!speechSupported) return;
    window.speechSynthesis.cancel();
    setActiveSpeechId(null);
  };

  const speakText = (text: string, messageId?: string) => {
    if (!speechSupported) {
      toast.error(labels.noAudio);
      return;
    }

    stopSpeaking();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = latestLanguageRef.current === "hi" ? "hi-IN" : "en-IN";
    utterance.rate = latestLanguageRef.current === "hi" ? 0.95 : 1;

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find((voice) =>
      latestLanguageRef.current === "hi"
        ? voice.lang.toLowerCase().startsWith("hi")
        : voice.lang.toLowerCase().startsWith("en-in") ||
          voice.lang.toLowerCase().startsWith("en")
    );

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => setActiveSpeechId(messageId ?? "assistant");
    utterance.onend = () => setActiveSpeechId(null);
    utterance.onerror = () => {
      setActiveSpeechId(null);
      toast.error(labels.noAudio);
    };

    window.speechSynthesis.speak(utterance);
  };

  const closeChat = () => {
    setIsOpen(false);
    stopSpeaking();
    manualStopRef.current = true;
    try {
      recognitionRef.current?.stop();
    } catch {
      // ignore stop errors
    }
    releaseMediaStream(permissionStreamRef.current);
    permissionStreamRef.current = null;
    recognitionRef.current = null;
    setIsRecording(false);
    setVoiceStatus("");
  };

  const submitMessage = async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: getId(),
      text,
      language,
      timestamp: new Date(),
      isUser: true,
    };

    const history = buildChatHistory(messages);
    setMessages((current) => [...current, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await sendChatMessage(text, language, history);
      if (response.language !== language) {
        setLanguage(response.language);
      }

      const botMessage: ChatMessage = {
        id: getId(),
        text: response.reply,
        language: response.language,
        timestamp: new Date(),
        isUser: false,
        topic: response.topic,
        suggestions: response.suggestions,
        actions: response.actions,
      };

      setMessages((current) => [...current, botMessage]);

      if (autoSpeak) {
        speakText(response.reply, botMessage.id);
      }
    } catch (error) {
      console.error("Chat submission error:", error);
      toast.error(labels.failed);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (action: ChatAction) => {
    if (action.route) {
      navigate(action.route);
      closeChat();
      return;
    }

    if (action.url) {
      window.open(action.url, "_blank", "noopener,noreferrer");
      return;
    }

    if (action.message) {
      await submitMessage(action.message);
    }
  };

  const startRecording = async () => {
    const RecognitionCtor = getRecognitionConstructor();

    if (!RecognitionCtor) {
      setVoiceStatus(labels.micBrowserHint);
      toast.error(`${labels.micUnavailable} ${labels.micBrowserHint}`);
      return;
    }

    if (
      typeof window !== "undefined" &&
      !window.isSecureContext &&
      !["localhost", "127.0.0.1", "::1"].includes(window.location.hostname)
    ) {
      setVoiceStatus(labels.micNeedsSecureContext);
      toast.error(labels.micNeedsSecureContext);
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore stop errors
      }
      recognitionRef.current = null;
    }

    stopSpeaking();
    manualStopRef.current = false;
    transcriptRef.current = "";
    setVoiceStatus(labels.micStarting);

    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        permissionStreamRef.current = stream;
        releaseMediaStream(stream);
        permissionStreamRef.current = null;
      }
    } catch (error) {
      console.error("Microphone permission error:", error);
      setVoiceStatus(labels.permissionDenied);
      toast.error(labels.permissionDenied);
      return;
    }

    const recognition = new RecognitionCtor();
    recognition.lang = language === "hi" ? "hi-IN" : "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsRecording(true);
      setVoiceStatus(labels.listening);
    };

    recognition.onresult = (event) => {
      const transcript = extractTranscript(event);

      if (transcript) {
        transcriptRef.current = transcript;
        setInput(transcript);
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event?.error);
      const errorCode = event?.error ?? "";

      if (manualStopRef.current && errorCode === "aborted") {
        recognitionRef.current = null;
        setIsRecording(false);
        setVoiceStatus(labels.micStopped);
        manualStopRef.current = false;
        return;
      }

      if (errorCode === "not-allowed" || errorCode === "service-not-allowed") {
        setVoiceStatus(labels.permissionDenied);
        toast.error(labels.permissionDenied);
      } else if (errorCode === "no-speech") {
        setVoiceStatus(labels.micNoSpeech);
        toast.error(labels.micNoSpeech);
      } else if (errorCode === "audio-capture") {
        setVoiceStatus(labels.micNoDevice);
        toast.error(labels.micNoDevice);
      } else if (errorCode === "network") {
        setVoiceStatus(labels.micNetworkError);
        toast.error(labels.micNetworkError);
      } else if (errorCode === "language-not-supported") {
        setVoiceStatus(labels.micBrowserHint);
        toast.error(labels.micBrowserHint);
      } else {
        setVoiceStatus(labels.micUnavailable);
        toast.error(labels.micUnavailable);
      }

      releaseMediaStream(permissionStreamRef.current);
      permissionStreamRef.current = null;
      setIsRecording(false);
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      releaseMediaStream(permissionStreamRef.current);
      permissionStreamRef.current = null;
      setIsRecording(false);
      recognitionRef.current = null;

      const transcript = transcriptRef.current.trim();

      if (manualStopRef.current) {
        manualStopRef.current = false;
        setVoiceStatus(labels.micStopped);
        return;
      }

      if (transcript) {
        setVoiceStatus(labels.micSending);
        void submitMessage(transcript);
        transcriptRef.current = "";
      } else {
        setVoiceStatus(labels.micNoSpeech);
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (error) {
      console.error("Speech recognition start error:", error);
      releaseMediaStream(permissionStreamRef.current);
      permissionStreamRef.current = null;
      recognitionRef.current = null;
      setIsRecording(false);
      setVoiceStatus(labels.micUnavailable);
      toast.error(labels.micUnavailable);
    }
  };

  const stopRecording = () => {
    manualStopRef.current = true;
    setVoiceStatus(labels.micStopping);
    try {
      recognitionRef.current?.stop();
    } catch {
      // ignore stop errors
    }
    releaseMediaStream(permissionStreamRef.current);
    permissionStreamRef.current = null;
  };

  return (
    <>
      <button
        type="button"
        aria-label={isOpen ? "Close chatbot" : "Open chatbot"}
        onClick={() => (isOpen ? closeChat() : setIsOpen(true))}
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-green-600 text-white shadow-xl transition-all hover:scale-105 hover:bg-green-700"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {isOpen && (
        <div
          className={cn(
            "fixed z-50 flex flex-col overflow-hidden rounded-[28px] border border-border bg-background shadow-2xl",
            isMobile
              ? "inset-x-3 bottom-3 top-20"
              : "bottom-24 right-6 h-[min(80vh,680px)] w-[min(92vw,400px)]"
          )}
        >
          <div className="border-b bg-gradient-to-br from-green-700 via-green-600 to-emerald-500 text-white">
            <div className="flex items-start justify-between gap-3 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-white/15 p-2.5">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{labels.title}</h3>
                    <Sparkles className="h-4 w-4 text-yellow-100" />
                  </div>
                  <p className="text-xs text-white/80">{labels.subtitle}</p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={closeChat}
                className="h-9 w-9 rounded-full text-white hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2 px-4 pb-4">
              <div className="rounded-full bg-white/15 px-3 py-1 text-xs text-white/90">
                Hindi + English
              </div>
              <div className="rounded-full bg-white/15 px-3 py-1 text-xs text-white/90">
                {recognitionSupported ? "Mic ready" : "Mic limited"}
              </div>
              {speechSupported && (
                <div className="rounded-full bg-white/15 px-3 py-1 text-xs text-white/90">
                  Audio ready
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/40 px-4 py-3">
            <label className="flex items-center gap-2 rounded-full border bg-background px-3 py-1.5 text-xs font-medium text-foreground">
              <Globe2 className="h-3.5 w-3.5 text-muted-foreground" />
              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value as ChatLanguage)}
                className="bg-transparent outline-none"
              >
                <option value="en">English</option>
                <option value="hi">हिंदी</option>
              </select>
            </label>

            <button
              type="button"
              onClick={() => {
                const next = !autoSpeak;
                setAutoSpeak(next);
                if (!next) {
                  stopSpeaking();
                }
              }}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                autoSpeak
                  ? "border-green-600 bg-green-50 text-green-700"
                  : "border-border bg-background text-muted-foreground"
              )}
            >
              {autoSpeak ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
              <span>{labels.autoVoice}</span>
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.08),_transparent_45%)] px-4 py-4">
            {messages.map((message) => {
              const isLatestAssistant = !message.isUser && lastAssistantMessage?.id === message.id;

              return (
                <div
                  key={message.id}
                  className={cn("flex", message.isUser ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[88%] rounded-3xl px-4 py-3 shadow-sm",
                      message.isUser
                        ? "rounded-br-md bg-green-600 text-white"
                        : "rounded-bl-md border border-border bg-background text-foreground"
                    )}
                  >
                    <p className="whitespace-pre-wrap text-sm leading-6">{message.text}</p>

                    {!message.isUser && (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            activeSpeechId === message.id
                              ? stopSpeaking()
                              : speakText(message.text, message.id)
                          }
                          className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/80"
                        >
                          {activeSpeechId === message.id ? (
                            <>
                              <VolumeX className="h-3.5 w-3.5" />
                              <span>{language === "hi" ? "रोकें" : "Stop audio"}</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="h-3.5 w-3.5" />
                              <span>{language === "hi" ? "सुनें" : "Listen"}</span>
                            </>
                          )}
                        </button>

                        {isLatestAssistant && message.actions?.length ? (
                          <>
                            {message.actions.map((action) => (
                              <button
                                key={`${message.id}-${action.label}`}
                                type="button"
                                onClick={() => void handleAction(action)}
                                className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                              >
                                <span>{action.label}</span>
                                {action.url ? (
                                  <ExternalLink className="h-3.5 w-3.5" />
                                ) : (
                                  <Sparkles className="h-3.5 w-3.5 text-green-600" />
                                )}
                              </button>
                            ))}
                          </>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-3xl rounded-bl-md border border-border bg-background px-4 py-3 text-sm text-muted-foreground shadow-sm">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                    <span>{labels.processing}</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="border-t bg-background p-4">
            {lastAssistantMessage?.suggestions?.length ? (
              <div className="mb-3 flex flex-wrap gap-2">
                {lastAssistantMessage.suggestions.slice(0, 4).map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => void submitMessage(suggestion)}
                    className="rounded-full border border-border bg-muted/60 px-3 py-1.5 text-left text-xs text-foreground transition-colors hover:bg-muted"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            ) : null}

            <div className="flex items-end gap-2">
              <Input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void submitMessage();
                  }
                }}
                placeholder={labels.placeholder}
                disabled={isLoading}
                className="h-11 flex-1 rounded-2xl border-border bg-muted/30"
              />

              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => {
                  if (isRecording) {
                    stopRecording();
                    return;
                  }
                  void startRecording();
                }}
                disabled={isLoading}
                className={cn(
                  "h-11 w-11 rounded-2xl",
                  !recognitionSupported && "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100",
                  isRecording && "border-red-300 bg-red-50 text-red-600 hover:bg-red-100"
                )}
                title={isRecording ? labels.listening : labels.mic}
              >
                {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>

              <Button
                type="button"
                onClick={() => void submitMessage()}
                disabled={isLoading || !input.trim()}
                className="h-11 rounded-2xl bg-green-600 px-4 hover:bg-green-700"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>

            <p className="mt-2 text-xs text-muted-foreground">
              {voiceStatus || (recognitionSupported ? labels.micReady : labels.micBrowserHint)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{labels.helper}</p>
          </div>
        </div>
      )}
    </>
  );
};
