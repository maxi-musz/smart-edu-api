"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  Send,
  BookOpen,
  FileText,
  Lightbulb,
  SquareRadical,
  Square,
  ThumbsUp,
  ThumbsDown,
  GripVertical,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Settings,
  Copy,
  Check,
  FileDown,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useExploreChatSocket, type MessageResponseData, type MessageErrorData } from "@/hooks/explore/use-explore-chat-socket";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { TypewriterText } from "./TypewriterText";
import { ChatSettings, getStoredSettings, type ChatSettingsData } from "./ChatSettings";
import { getChatTranslations } from "./chatTranslations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "next-auth/react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isTyping?: boolean; // Whether this message is currently being typed
}

export interface StudyTool {
  id: string;
  label: string;
  iconColor: string;
  icon: React.ReactNode;
  onClick?: () => void;
}

export interface ChatInterfaceProps {
  bookTitle?: string;
  chapterTitle?: string;
  initialMessage?: string;
  messages?: ChatMessage[];
  onSendMessage?: (message: string) => void;
  isLoading?: boolean;
  studyTools?: StudyTool[];
  showStudyTools?: boolean;
  onStudyToolClick?: (toolId: string) => void;
  disclaimer?: string;
  materialId?: string; // Chapter ID for socket messaging
  useSocket?: boolean; // Whether to use socket for messaging (default: true)
}

const defaultStudyTools: StudyTool[] = [
  {
    id: "chapter-summary",
    label: "Chapter Summary",
    iconColor: "text-blue-500",
    icon: <BookOpen className="h-4 w-4" />,
  },
  {
    id: "important-notes",
    label: "Important Notes for Exams",
    iconColor: "text-amber-500",
    icon: <FileText className="h-4 w-4" />,
  },
  {
    id: "revision-notes",
    label: "Revision Notes",
    iconColor: "text-green-500",
    icon: <FileText className="h-4 w-4" />,
  },
  {
    id: "common-mistakes",
    label: "Common Mistakes",
    iconColor: "text-red-500",
    icon: <Lightbulb className="h-4 w-4" />,
  },
  {
    id: "study-tricks",
    label: "Study Tricks",
    iconColor: "text-purple-500",
    icon: <Lightbulb className="h-4 w-4" />,
  },
  {
    id: "create-definitions",
    label: "Create Definitions / Concepts",
    iconColor: "text-indigo-500",
    icon: <FileText className="h-4 w-4" />,
  },
  {
    id: "create-question-paper",
    label: "Create Question Paper",
    iconColor: "text-orange-500",
    icon: <FileText className="h-4 w-4" />,
  },
];

const MIN_WIDTH = 350;
const MAX_WIDTH = 900;
const DEFAULT_WIDTH = 600;

export function ChatInterface({
  bookTitle,
  chapterTitle,
  initialMessage,
  messages: externalMessages = [],
  onSendMessage: externalOnSendMessage,
  isLoading: externalIsLoading = false,
  studyTools = defaultStudyTools,
  showStudyTools = true,
  onStudyToolClick,
  disclaimer,
  materialId,
  useSocket = true,
}: ChatInterfaceProps) {
  const { data: session } = useSession();
  const [inputMessage, setInputMessage] = useState("");
  const [selectedStudyTool, setSelectedStudyTool] = useState<string>("");
  const [showFeedback, setShowFeedback] = useState<string | null>(null);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const [internalMessages, setInternalMessages] = useState<ChatMessage[]>([]);
  const [internalIsLoading, setInternalIsLoading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<ChatSettingsData>(() => getStoredSettings());
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [loadingTtsMessageId, setLoadingTtsMessageId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const { toast } = useToast();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);

  // Get translations based on selected language
  const translations = useMemo(() => getChatTranslations(settings.language), [settings.language]);
  
  // Get default disclaimer from translations if not provided
  const effectiveDisclaimer = disclaimer || translations.disclaimer;
  
  // Translate study tools
  const translatedStudyTools = useMemo(() => {
    const toolIdToKey: Record<string, keyof typeof translations.studyTools> = {
      "chapter-summary": "chapterSummary",
      "important-notes": "importantNotes",
      "revision-notes": "revisionNotes",
      "common-mistakes": "commonMistakes",
      "study-tricks": "studyTricks",
      "create-definitions": "createDefinitions",
      "create-question-paper": "createQuestionPaper",
    };
    
    return studyTools.map((tool) => {
      const translationKey = toolIdToKey[tool.id];
      const translatedLabel = translationKey ? translations.studyTools[translationKey] : tool.label;
      return {
        ...tool,
        label: translatedLabel,
      };
    });
  }, [studyTools, translations]);

  // Socket connection
  const {
    connectionStatus,
    isConnected,
    error: socketError,
    isTyping: socketIsTyping,
    retryConnection,
    sendMessage: socketSendMessage,
    onMessageResponse,
    onMessageError,
    onTypingStatus,
  } = useExploreChatSocket();

  // Use socket messaging if enabled, otherwise use external callbacks
  const useSocketMessaging = useSocket && isConnected && !!materialId && !!session?.user?.id;

  // Check if chapter is selected (required for socket messaging)
  const hasChapterSelected = !!materialId;
  
  // Determine if user can send messages
  // If useSocket is true, require materialId (chapter) to be selected
  const canSendMessage = useSocket
    ? hasChapterSelected && isConnected && !internalIsLoading && !socketIsTyping
    : !externalIsLoading;

  // Clear messages when chapter (materialId) changes
  useEffect(() => {
    if (useSocket && materialId) {
      console.log("[ChatInterface] Chapter changed, clearing messages. New materialId:", materialId);
      setInternalMessages([]);
      setInternalIsLoading(false);
    }
  }, [materialId, useSocket]);

  // Handle socket message responses
  useEffect(() => {
    if (!useSocketMessaging) return;

    const cleanupResponse = onMessageResponse((data: MessageResponseData) => {
      console.log("[ChatInterface] Received message response:", {
        chapterId: data.data.chapterId,
        chapterTitle: data.data.chapterTitle,
        materialId: data.data.materialId,
        materialTitle: data.data.materialTitle,
        language: data.data.language,
        tokensUsed: data.data.tokensUsed,
        responseTimeMs: data.data.responseTimeMs,
        responseLength: data.data.response?.length || 0,
      });
      setInternalIsLoading(false);
      
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: data.data.response, // Markdown content
        timestamp: new Date(data.data.timestamp),
        isTyping: true, // Mark as typing to trigger typewriter effect
      };
      
      setInternalMessages((prev) => [...prev, aiMessage]);
    });

    const cleanupError = onMessageError((error: MessageErrorData) => {
      console.error("[ChatInterface] Message error:", error);
      setInternalIsLoading(false);
      
      // Show error message to user
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: `**Error:** ${error.message || error.error || "Failed to get response. Please try again."}`,
        timestamp: new Date(),
      };
      
      setInternalMessages((prev) => [...prev, errorMessage]);
    });

    return () => {
      cleanupResponse();
      cleanupError();
    };
  }, [useSocketMessaging, onMessageResponse, onMessageError]);

  // Use internal messages if using socket, otherwise use external messages
  const messages = useSocketMessaging ? internalMessages : externalMessages;
  const isLoading = useSocketMessaging ? internalIsLoading || socketIsTyping : externalIsLoading;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Auto-scroll during typing (more frequent updates)
  useEffect(() => {
    const hasTypingMessage = messages.some((msg) => msg.isTyping);
    if (hasTypingMessage) {
      // Scroll more frequently when typing
      const interval = setInterval(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 500); // Every 500ms during typing
      return () => clearInterval(interval);
    }
  }, [messages]);

  // Handle resize
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setWidth(newWidth);
      }
    },
    [isResizing]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  const handleSend = () => {
    const message = inputMessage.trim();
    if (!message || !canSendMessage) return;

    if (useSocketMessaging && materialId && session?.user?.id) {
      // Use socket messaging
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: message,
        timestamp: new Date(),
      };
      
      setInternalMessages((prev) => [...prev, userMessage]);
      setInternalIsLoading(true);
      setInputMessage("");
      
      console.log("[ChatInterface] Sending message via socket:", {
        message,
        materialId,
        userId: session.user.id,
        language: settings.language,
      });
      
      socketSendMessage(message, materialId, session.user.id, settings.language);
    } else if (externalOnSendMessage) {
      // Use external callback
      externalOnSendMessage(message);
      setInputMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Convert markdown to plain text
  const markdownToPlainText = (markdown: string): string => {
    if (!markdown) return "";
    
    let text = markdown;
    
    // Remove code blocks (```code```)
    text = text.replace(/```[\s\S]*?```/g, "");
    
    // Remove inline code (`code`)
    text = text.replace(/`([^`]+)`/g, "$1");
    
    // Remove headers (# Header)
    text = text.replace(/^#{1,6}\s+(.+)$/gm, "$1");
    
    // Remove bold (**text** or __text__)
    text = text.replace(/\*\*([^*]+)\*\*/g, "$1");
    text = text.replace(/__([^_]+)__/g, "$1");
    
    // Remove italic (*text* or _text_)
    text = text.replace(/\*([^*]+)\*/g, "$1");
    text = text.replace(/_([^_]+)_/g, "$1");
    
    // Remove links [text](url)
    text = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1");
    
    // Remove images ![alt](url)
    text = text.replace(/!\[([^\]]*)\]\([^\)]+\)/g, "");
    
    // Remove strikethrough (~~text~~)
    text = text.replace(/~~([^~]+)~~/g, "$1");
    
    // Remove blockquotes (> text)
    text = text.replace(/^>\s+(.+)$/gm, "$1");
    
    // Remove horizontal rules (--- or ***)
    text = text.replace(/^[-*]{3,}$/gm, "");
    
    // Remove list markers (-, *, +, 1.)
    text = text.replace(/^[\s]*[-*+]\s+(.+)$/gm, "$1");
    text = text.replace(/^[\s]*\d+\.\s+(.+)$/gm, "$1");
    
    // Clean up multiple newlines
    text = text.replace(/\n{3,}/g, "\n\n");
    
    // Trim whitespace
    text = text.trim();
    
    return text;
  };

  // Handle copy to clipboard
  const handleCopyMessage = async (messageId: string, content: string) => {
    try {
      const plainText = markdownToPlainText(content);
      await navigator.clipboard.writeText(plainText);
      
      setCopiedMessageId(messageId);
      toast({
        title: "Copied!",
        description: "Response copied to clipboard as plain text",
        duration: 2000,
      });
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopiedMessageId(null);
      }, 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
      toast({
        title: "Copy failed",
        description: "Failed to copy to clipboard",
        variant: "destructive",
        duration: 2000,
      });
    }
  };

  // Handle TTS playback
  const handlePlayTTS = async (messageId: string, content: string) => {
    // If already playing this message, stop it
    if (playingMessageId === messageId && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlayingMessageId(null);
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
      return;
    }

    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
    }

    try {
      setLoadingTtsMessageId(messageId);
      
      // Convert markdown to plain text for TTS
      const plainText = markdownToPlainText(content);
      
      // Truncate if too long (backend limit is 4096 characters)
      const textToSpeak = plainText.length > 4096 ? plainText.substring(0, 4096) : plainText;

      // Get backend URL and token
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      if (!backendUrl) {
        throw new Error("Backend URL not configured");
      }

      if (!session?.user?.accessToken) {
        throw new Error("Authentication required");
      }

      // Construct endpoint - check if backendUrl already includes /api/v1
      const endpoint = backendUrl.includes('/api/v1') 
        ? '/explore/chat/tts/speak'
        : '/api/v1/explore/chat/tts/speak';
      
      // Call TTS API with streaming support
      const response = await fetch(`${backendUrl}${endpoint}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.user.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: textToSpeak,
          voice: settings.ttsVoice || "alloy",
          speed: settings.ttsSpeed || 1.0,
          language: settings.language || "en",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "TTS request failed" }));
        throw new Error(errorData.message || `TTS request failed: ${response.status}`);
      }

      // SIMPLE & RELIABLE APPROACH: Browser automatically collects all stream chunks
      // This is the recommended approach from the new TTS guide
      // The browser will collect all chunks and create a blob when stream completes
      // This is more reliable than trying to update audio source while playing
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      audioUrlRef.current = audioUrl;

      // Create and play audio
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      // Handle audio events
      audio.onplay = () => {
        setLoadingTtsMessageId(null);
        setPlayingMessageId(messageId);
      };

      audio.onended = () => {
        setPlayingMessageId(null);
        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current);
          audioUrlRef.current = null;
        }
        audioRef.current = null;
      };

      audio.onerror = (error) => {
        console.error("Audio playback error:", error);
        setLoadingTtsMessageId(null);
        setPlayingMessageId(null);
        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current);
          audioUrlRef.current = null;
        }
        audioRef.current = null;
        toast({
          title: "Playback Error",
          description: "Failed to play audio. Please try again.",
          variant: "destructive",
          duration: 3000,
        });
      };

      audio.onpause = () => {
        // Don't reset playing state on pause (user might resume)
        // Only reset when explicitly stopped
      };

      // Play the audio
      await audio.play();
    } catch (error) {
      console.error("TTS error:", error);
      setLoadingTtsMessageId(null);
      setPlayingMessageId(null);
      
      const errorMessage = error instanceof Error ? error.message : "Failed to generate speech";
      toast({
        title: "TTS Error",
        description: errorMessage,
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
    };
  }, []);

  // Handle PDF download with formatting preserved
  const handleDownloadPDF = async (messageId: string, content: string) => {
    try {
      const jsPDFModule = await import("jspdf");
      const html2canvasModule = await import("html2canvas");
      
      const jsPDF = jsPDFModule.default;
      const html2canvas = html2canvasModule.default;

      // Create a temporary container to render the markdown
      const tempContainer = document.createElement("div");
      tempContainer.style.position = "absolute";
      tempContainer.style.left = "-9999px";
      tempContainer.style.top = "0";
      tempContainer.style.width = "800px";
      tempContainer.style.padding = "40px";
      tempContainer.style.backgroundColor = "#ffffff";
      tempContainer.style.fontFamily = "Arial, sans-serif";
      tempContainer.style.fontSize = "14px";
      tempContainer.style.lineHeight = "1.6";
      tempContainer.style.color = "#333333";
      tempContainer.className = "prose prose-sm max-w-none";
      
      // Use React to render markdown into the container using MarkdownRenderer
      const React = await import("react");
      const ReactDOM = await import("react-dom/client");
      const { MarkdownRenderer } = await import("./MarkdownRenderer");
      
      // Create React element with MarkdownRenderer
      const MarkdownWrapper = React.createElement(MarkdownRenderer, { content });
      
      const root = ReactDOM.createRoot(tempContainer);
      root.render(MarkdownWrapper);
      
      document.body.appendChild(tempContainer);
      
      // Wait for rendering and images to load
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Capture the container as canvas
      const canvas = await html2canvas(tempContainer, {
        backgroundColor: "#ffffff",
        scale: 2, // Higher quality
        logging: false,
        useCORS: true,
      });
      
      // Calculate PDF dimensions
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const pdfWidth = imgWidth * 0.264583; // Convert pixels to mm (1px = 0.264583mm at 96dpi)
      const pdfHeight = imgHeight * 0.264583;
      
      // Create PDF
      const pdf = new jsPDF({
        orientation: pdfHeight > pdfWidth ? "portrait" : "landscape",
        unit: "mm",
        format: [pdfWidth, pdfHeight],
      });
      
      // Add image to PDF
      const imgData = canvas.toDataURL("image/png");
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
      const filename = `ai-response-${timestamp}.pdf`;
      
      // Download PDF
      pdf.save(filename);
      
      // Cleanup
      document.body.removeChild(tempContainer);
      root.unmount();
      
      toast({
        title: "PDF Downloaded!",
        description: "Response downloaded as PDF with formatting preserved",
        duration: 3000,
      });
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      
      // Check if it's a module not found error
      if (error instanceof Error && error.message.includes("Cannot find module")) {
        toast({
          title: "PDF Library Not Installed",
          description: "Please install jspdf and html2canvas: npm install jspdf html2canvas",
          variant: "destructive",
          duration: 5000,
        });
      } else {
        toast({
          title: "PDF Generation Failed",
          description: "Failed to generate PDF. Please try again.",
          variant: "destructive",
          duration: 3000,
        });
      }
    }
  };

  const handleStudyToolChange = (toolId: string) => {
    setSelectedStudyTool(toolId);
    onStudyToolClick?.(toolId);
    
    const toolMessages: Record<string, string> = {
      "chapter-summary": "Please provide a summary of this chapter.",
      "important-notes": "What are the important notes for exams in this chapter?",
      "revision-notes": "Generate revision notes for this chapter.",
      "common-mistakes": "What are common mistakes students make in this chapter?",
      "study-tricks": "Share some study tricks for this chapter.",
      "create-definitions": "Create definitions and key concepts for this chapter.",
      "create-question-paper": "Create a question paper based on this chapter.",
    };
    const message = toolMessages[toolId] || `Help me with ${toolId}`;
    
    // Auto-send message
    if (useSocketMessaging && materialId && session?.user?.id && canSendMessage) {
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: message,
        timestamp: new Date(),
      };
      
      setInternalMessages((prev) => [...prev, userMessage]);
      setInternalIsLoading(true);
      socketSendMessage(message, materialId, session.user.id, settings.language);
    } else if (externalOnSendMessage && canSendMessage) {
      externalOnSendMessage(message);
    }
    
    setSelectedStudyTool(""); // Reset after sending
  };

  // Use translated initial message if no custom initialMessage provided
  const defaultInitialMessage = chapterTitle
    ? translations.initialMessageWithChapter
    : translations.initialMessageNoChapter;
  
  const effectiveInitialMessage = initialMessage || defaultInitialMessage;
  
  // Only show initial message if:
  // 1. There are no messages yet, AND
  // 2. Either not using socket, OR (chapter is selected AND connected), OR not connected yet
  // When using socket and no chapter selected, show the "select chapter" prompt instead
  const shouldShowInitialMessage = messages.length === 0 && (
    !useSocket || 
    (hasChapterSelected && isConnected) || 
    !isConnected
  );
  
  const displayMessages = messages.length > 0 ? messages : (
    shouldShowInitialMessage ? [
      {
        id: "initial",
        role: "assistant" as const,
        content: effectiveInitialMessage,
        timestamp: new Date(),
      },
    ] : []
  );

  return (
    <div
      className="flex flex-col bg-white border-l border-brand-border h-full relative"
      style={{ width: `${width}px`, minWidth: `${MIN_WIDTH}px`, maxWidth: `${MAX_WIDTH}px` }}
    >
      {/* Resize Handle */}
      <div
        ref={resizeRef}
        onMouseDown={handleMouseDown}
        className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize bg-brand-primary/20 hover:bg-brand-primary/40 border-l-2 border-brand-primary/50 hover:border-brand-primary transition-all z-10 group"
        style={{ marginLeft: "-4px" }}
      >
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-100 transition-opacity">
          <GripVertical className="h-6 w-6 text-brand-primary drop-shadow-sm" />
        </div>
        {/* Additional visual indicator dots */}
        <div className="absolute left-1/2 top-1/3 -translate-x-1/2 w-1 h-1 rounded-full bg-brand-primary/60"></div>
        <div className="absolute left-1/2 bottom-1/3 -translate-x-1/2 w-1 h-1 rounded-full bg-brand-primary/60"></div>
      </div>

      {/* Header */}
      <div className="px-4 py-3 border-b border-brand-border bg-gradient-to-r from-brand-primary/5 to-brand-primary/10">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-brand-heading text-lg">iBookGPT®</h2>
          <div className="flex items-center gap-2">
            {/* Connection Status Indicator */}
            {connectionStatus === "connected" && (
              <>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-green-50 border border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-xs font-medium text-green-700">{translations.connected}</span>
                </div>
                <Button
                  onClick={() => setSettingsOpen(true)}
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 hover:bg-brand-bg"
                  title="Chat Settings"
                >
                  <Settings className="h-4 w-4 text-brand-light-accent-1" />
                </Button>
              </>
            )}
            {connectionStatus === "connecting" && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-50 border border-amber-200">
                <Loader2 className="h-4 w-4 text-amber-600 animate-spin" />
                <span className="text-xs font-medium text-amber-700">{translations.connecting}</span>
              </div>
            )}
            {connectionStatus === "error" && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-50 border border-red-200" title={socketError || "Connection failed"}>
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-xs font-medium text-red-700">{translations.disconnected}</span>
                </div>
                <Button
                  onClick={retryConnection}
                  size="sm"
                  variant="outline"
                  className="h-7 px-2 text-xs border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300"
                  title="Retry connection"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry
                </Button>
              </div>
            )}
            <div className="h-6 w-6 rounded-full bg-brand-primary/20 flex items-center justify-center border border-brand-primary/30">
              <span className="text-xs font-semibold text-brand-primary">U</span>
            </div>
          </div>
        </div>
        {(bookTitle || chapterTitle) && (
          <p className="text-xs text-brand-light-accent-1 mt-1.5 font-medium">
            {chapterTitle || bookTitle}
          </p>
        )}
        {connectionStatus === "error" && socketError && (
          <p className="text-xs text-red-600 mt-1.5 font-medium">
            {socketError}
          </p>
        )}
      </div>

      {/* Study Tools Dropdown */}
      {showStudyTools && (
        <div className="border-b border-brand-border bg-white px-4 py-3">
          <label className="block text-xs font-semibold text-brand-heading mb-2 uppercase tracking-wide">
            ✨ Study Tools
          </label>
          <Select value={selectedStudyTool} onValueChange={handleStudyToolChange} disabled={!isConnected || (useSocket && !hasChapterSelected)}>
            <SelectTrigger className="w-full bg-brand-bg border-brand-border hover:bg-white focus:ring-2 focus:ring-brand-primary disabled:opacity-50 disabled:cursor-not-allowed">
              <SelectValue placeholder={
                !isConnected 
                  ? translations.connecting 
                  : useSocket && !hasChapterSelected
                  ? translations.selectChapterFirst
                  : translations.selectStudyTool
              } />
            </SelectTrigger>
            <SelectContent className="max-h-[300px] overflow-y-auto">
              {translatedStudyTools.map((tool) => (
                <SelectItem
                  key={tool.id}
                  value={tool.id}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex-shrink-0 ${tool.iconColor}`}>
                      {tool.icon}
                    </div>
                    <span className="text-sm">{tool.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Chat Messages Area */}
      <div
        ref={chatEndRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gradient-to-b from-white to-brand-bg/30"
      >
        {/* Show message when no chapter is selected and using socket */}
        {useSocket && !hasChapterSelected && isConnected && (
          <div className="flex justify-center items-center h-full min-h-[200px]">
            <div className="text-center max-w-md">
              <BookOpen className="h-12 w-12 text-brand-light-accent-1 mx-auto mb-3 opacity-50" />
              <p className="text-sm font-medium text-brand-heading mb-2">
                {translations.selectChapterFirst}
              </p>
              <p className="text-xs text-brand-light-accent-1">
                {translations.initialMessageNoChapter}
              </p>
            </div>
          </div>
        )}
        {displayMessages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-4 py-2.5 shadow-sm ${
                message.role === "user"
                  ? "bg-gradient-to-br from-brand-primary to-brand-primary/90 text-white"
                  : "bg-white border border-brand-border/50 text-brand-heading"
              }`}
            >
              {message.role === "assistant" ? (
                message.isTyping && message.id !== "initial" ? (
                  <TypewriterText
                    key={`typewriter-${message.id}`}
                    text={message.content}
                    speed={settings.typewriterSpeed || 20}
                    showCursor={true}
                    renderMarkdown={true}
                    onComplete={() => {
                      // Mark message as complete (no longer typing)
                      // Only update if using socket messaging (internal messages)
                      if (useSocketMessaging) {
                        setInternalMessages((prev) =>
                          prev.map((msg) =>
                            msg.id === message.id ? { ...msg, isTyping: false } : msg
                          )
                        );
                      }
                    }}
                  />
                ) : (
                  <MarkdownRenderer content={message.content} />
                )
              ) : (
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
              )}
              {message.role === "assistant" && message.id !== "initial" && (
                <div className="flex items-center gap-2 mt-3 pt-2 border-t border-brand-border/30">
                  <button
                    onClick={() => handleCopyMessage(message.id, message.content)}
                    className="p-1.5 hover:bg-brand-bg rounded-md transition-colors group"
                    title="Copy response"
                  >
                    {copiedMessageId === message.id ? (
                      <Check className="h-3.5 w-3.5 text-green-500 transition-colors" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-brand-light-accent-1 group-hover:text-brand-primary transition-colors" />
                    )}
                  </button>
                  <button
                    onClick={() => handlePlayTTS(message.id, message.content)}
                    disabled={loadingTtsMessageId === message.id}
                    className="p-1.5 hover:bg-brand-bg rounded-md transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                    title={
                      playingMessageId === message.id
                        ? "Stop audio"
                        : loadingTtsMessageId === message.id
                        ? "Generating audio..."
                        : "Play audio"
                    }
                  >
                    {loadingTtsMessageId === message.id ? (
                      <Loader2 className="h-3.5 w-3.5 text-brand-primary animate-spin" />
                    ) : playingMessageId === message.id ? (
                      <VolumeX className="h-3.5 w-3.5 text-brand-primary transition-colors" />
                    ) : (
                      <Volume2 className="h-3.5 w-3.5 text-brand-light-accent-1 group-hover:text-brand-primary transition-colors" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDownloadPDF(message.id, message.content)}
                    className="p-1.5 hover:bg-brand-bg rounded-md transition-colors group"
                    title="Download as PDF"
                  >
                    <FileDown className="h-3.5 w-3.5 text-brand-light-accent-1 group-hover:text-brand-primary transition-colors" />
                  </button>
                  <button
                    onClick={() => setShowFeedback(message.id)}
                    className="p-1.5 hover:bg-brand-bg rounded-md transition-colors group"
                    title="Helpful"
                  >
                    <ThumbsUp className="h-3.5 w-3.5 text-brand-light-accent-1 group-hover:text-green-500 transition-colors" />
                  </button>
                  <button
                    onClick={() => setShowFeedback(message.id)}
                    className="p-1.5 hover:bg-brand-bg rounded-md transition-colors group"
                    title="Not helpful"
                  >
                    <ThumbsDown className="h-3.5 w-3.5 text-brand-light-accent-1 group-hover:text-red-500 transition-colors" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {(isLoading || socketIsTyping) && (
          <div className="flex justify-start">
            <div className="bg-white border border-brand-border/50 rounded-lg px-4 py-2.5 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="h-2 w-2 bg-brand-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="h-2 w-2 bg-brand-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="h-2 w-2 bg-brand-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
                <span className="text-xs text-brand-light-accent-1 font-medium">
                  {socketIsTyping ? translations.aiTyping : translations.thinking}
                </span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <div className="border-t border-brand-border bg-white p-4 space-y-2">
        <div className="flex items-end gap-2">
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              className="p-2 hover:bg-brand-bg rounded-md transition-colors group"
              title="Math equation"
            >
              <SquareRadical className="h-4 w-4 text-brand-light-accent-1 group-hover:text-brand-primary transition-colors" />
            </button>
            <button
              className="p-2 hover:bg-brand-bg rounded-md transition-colors group"
              title="Attach"
            >
              <Square className="h-4 w-4 text-brand-light-accent-1 group-hover:text-brand-primary transition-colors" />
            </button>
          </div>
          <Input
            type="text"
            placeholder={
              !isConnected
                ? translations.connectingToServer
                : !hasChapterSelected && useSocket
                ? translations.selectChapterFirst
                : translations.askQuestionPlaceholder
            }
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={!canSendMessage}
            className="flex-1 bg-brand-bg border-brand-border focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <Button
            onClick={handleSend}
            disabled={!inputMessage.trim() || !canSendMessage}
            size="icon"
            className="flex-shrink-0 bg-gradient-to-br from-brand-primary to-brand-primary/90 hover:from-brand-primary-hover hover:to-brand-primary shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            title={!isConnected ? "Please wait for connection..." : undefined}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        {effectiveDisclaimer && (
          <p className="text-xs text-brand-light-accent-1 text-center italic">
            {effectiveDisclaimer}
          </p>
        )}
      </div>

      {/* Settings Dialog */}
      <ChatSettings
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        onSettingsChange={setSettings}
      />
    </div>
  );
}
