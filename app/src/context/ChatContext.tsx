import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { ChatSession, Message } from "@/types/chat";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "./AuthContext";
import chatService from "@/services/chatService";

interface ChatContextType {
  sessions: ChatSession[];
  currentSession: ChatSession | null;
  isLoading: boolean;
  createNewSession: () => Promise<void>;
  selectSession: (sessionId: string) => void;
  sendMessage: (content: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}

export const ChatProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);

  // Load sessions when user changes
  useEffect(() => {
    if (user) {
      loadSessions();
    } else {
      setSessions([]);
      setCurrentSession(null);
    }
  }, [user]);

  const loadSessions = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const sessionsData = await chatService.getSessions();
      const formattedSessions = sessionsData.map((session, index) => ({
        id: session.id?.toString() || "",
        title: session.title || `Chat ${index + 1}`,
        lastMessage: session.last_message || "Start a new conversation",
        updatedAt: new Date(session.updated_at || Date.now()),
        messages: [],
      }));
      setSessions(formattedSessions);
      if (formattedSessions.length > 0) {
        selectSession(formattedSessions[0].id);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load chat sessions",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const loadSessionMessages = useCallback(async (sessionId: string) => {
    setIsLoading(true);
    try {
      const messagesData = await chatService.getMessages(sessionId);
      const formattedMessages: Message[] = messagesData.map((msg) => ({
        id: msg.id?.toString() || `temp-${Date.now()}-${Math.random()}`,
        content: msg.content || "",
        sender: msg.sender === "bot" ? "bot" : "user",
        timestamp: new Date(msg.timestamp || Date.now()),
      }));

      setSessions((prev) =>
        prev.map((session) =>
          session.id === sessionId
            ? { ...session, messages: formattedMessages }
            : session
        )
      );

      setCurrentSession((prev) =>
        prev?.id === sessionId ? { ...prev, messages: formattedMessages } : prev
      );
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectSession = useCallback(
    (sessionId: string) => {
      const session = sessions.find((s) => s.id === sessionId);
      if (session) {
        setCurrentSession(session);
        if (!session.messages.length) {
          loadSessionMessages(sessionId);
        }
      }
    },
    [sessions, loadSessionMessages]
  );

  const createNewSession = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const newSession = await chatService.createSession(
        `Chat ${sessions.length + 1}`
      );
      const formattedSession: ChatSession = {
        id: newSession.id.toString(),
        title: `Chat ${sessions.length + 1}`,
        lastMessage: "Start a new conversation",
        updatedAt: new Date(),
        messages: [],
      };
      setSessions((prev) => [formattedSession, ...prev]);
      setCurrentSession(formattedSession);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create new chat",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, sessions.length]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!currentSession || !user) return;
      setIsLoading(true);

      try {
        // Optimistic update for user message
        const userMessage: Message = {
          id: `temp-${Date.now()}`,
          content,
          sender: "user",
          timestamp: new Date(),
        };

        setSessions((prev) =>
          prev.map((session) =>
            session.id === currentSession.id
              ? {
                  ...session,
                  messages: [...session.messages, userMessage],
                  lastMessage: content,
                  updatedAt: new Date(),
                }
              : session
          )
        );

        setCurrentSession((prev) =>
          prev?.id === currentSession.id
            ? {
                ...prev,
                messages: [...prev.messages, userMessage],
                lastMessage: content,
                updatedAt: new Date(),
              }
            : prev
        );

        // Send to backend and get response
        const response = await chatService.sendMessage(
          currentSession.id,
          content
        );

        if (response?.reply) {
          const botMessage: Message = {
            id: `bot-${Date.now()}`,
            content: response.reply,
            sender: "bot",
            timestamp: new Date(),
          };

          setSessions((prev) =>
            prev.map((session) =>
              session.id === currentSession.id
                ? {
                    ...session,
                    messages: [...session.messages, botMessage],
                    lastMessage: response.reply,
                    updatedAt: new Date(),
                  }
                : session
            )
          );

          setCurrentSession((prev) =>
            prev?.id === currentSession.id
              ? {
                  ...prev,
                  messages: [...prev.messages, botMessage],
                  lastMessage: response.reply,
                  updatedAt: new Date(),
                }
              : prev
          );
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to send message",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [currentSession, user]
  );

  return (
    <ChatContext.Provider
      value={{
        sessions,
        currentSession,
        isLoading,
        createNewSession,
        selectSession,
        sendMessage,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
