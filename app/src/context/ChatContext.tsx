import React, { createContext, useContext, useState, useEffect } from "react";
import { ChatSession, Message } from "@/types/chat";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "./AuthContext";
import chatService from "@/services/chatService";

type ChatContextType = {
  sessions: ChatSession[];
  currentSession: ChatSession | null;
  createNewSession: () => void;
  selectSession: (sessionId: string) => void;
  sendMessage: (content: string) => Promise<void>;
  isLoading: boolean;
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);

  // Load chat sessions when user is authenticated
  useEffect(() => {
    if (user) {
      loadSessions();
    } else {
      // Clear sessions when user logs out
      setSessions([]);
      setCurrentSession(null);
    }
  }, [user]);

  const loadSessions = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const sessionsData = await chatService.getSessions();

      // Convert data to match our ChatSession type
      const formattedSessions: ChatSession[] = sessionsData.map(
        (session: any) => ({
          id: session.id ? session.id.toString() : "",
          title: session.title || `Chat ${sessionsData.indexOf(session) + 1}`,
          lastMessage: session.last_message || "Start a new conversation",
          updatedAt: new Date(session.updated_at || Date.now()),
          messages: [],
        })
      );

      setSessions(formattedSessions);

      // Set current session to the most recent one if any exist
      if (formattedSessions.length > 0) {
        selectSession(formattedSessions[0].id);
      }
    } catch (error) {
      console.error("Error loading sessions:", error);
      toast({
        title: "Failed to load chat sessions",
        description: "There was an error loading your chat history.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadSessionMessages = async (sessionId: string) => {
    setIsLoading(true);
    try {
      const messagesData = await chatService.getMessages(sessionId);

      // Convert data to match our Message type with null checks
      const formattedMessages: Message[] = messagesData.map((msg: any) => ({
        id: msg.id ? msg.id.toString() : `temp-${Date.now()}-${Math.random()}`,
        content: msg.content || "",
        // Use 'user' or 'bot' as sender values for UI rendering
        sender: msg.sender === "bot" ? "bot" : "user",
        timestamp: new Date(msg.timestamp || Date.now()),
      }));

      // Update the session with loaded messages
      setSessions((prev) =>
        prev.map((session) =>
          session.id === sessionId
            ? { ...session, messages: formattedMessages }
            : session
        )
      );

      // Update current session if it's the one being loaded
      if (currentSession?.id === sessionId) {
        setCurrentSession((prev) =>
          prev ? { ...prev, messages: formattedMessages } : prev
        );
      }
    } catch (error) {
      console.error("Error loading messages:", error);
      toast({
        title: "Failed to load messages",
        description: "There was an error loading the conversation.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createNewSession = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const title = `Chat ${sessions.length + 1}`;
      const newSession = await chatService.createSession(title);

      const formattedSession: ChatSession = {
        id: newSession.id.toString(),
        title,
        lastMessage: "Start a new conversation",
        updatedAt: new Date(),
        messages: [],
      };

      setSessions((prev) => [formattedSession, ...prev]);
      setCurrentSession(formattedSession);
    } catch (error) {
      console.error("Error creating session:", error);
      toast({
        title: "Failed to create new chat",
        description: "There was an error creating a new conversation.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectSession = (sessionId: string) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (session) {
      setCurrentSession(session);

      // Load messages if they haven't been loaded yet
      if (session.messages.length === 0) {
        loadSessionMessages(sessionId);
      }
    }
  };

  const sendMessage = async (content: string): Promise<void> => {
    if (!currentSession || !user) return;

    setIsLoading(true);

    try {
      // Create a temporary user message to show immediately
      const tempUserMessage: Message = {
        id: `temp-${Date.now()}`,
        content,
        sender: "user",
        timestamp: new Date(),
      };

      // Update UI optimistically
      const updatedMessages = [
        ...(currentSession.messages || []),
        tempUserMessage,
      ];

      updateSessionLocally(currentSession.id, {
        messages: updatedMessages,
        lastMessage: content,
        updatedAt: new Date(),
      });

      // Send message to backend
      const response = await chatService.sendMessage(
        currentSession.id,
        content
      );

      if (response && response.reply) {
        // Use the actual bot response from the backend
        const botMessage: Message = {
          id: `bot-${Date.now()}`,
          content: response.reply,
          sender: "bot",
          timestamp: new Date(),
        };

        const updatedMessagesWithBot = [...updatedMessages, botMessage];

        // Update session with bot response
        updateSessionLocally(currentSession.id, {
          messages: updatedMessagesWithBot,
          lastMessage: response.reply,
          updatedAt: new Date(),
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Failed to send message",
        description:
          "There was an error processing your message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to update session locally while waiting for server response
  const updateSessionLocally = (
    sessionId: string,
    updatedProps: Partial<ChatSession>
  ) => {
    setSessions((prev) =>
      prev.map((session) =>
        session.id === sessionId ? { ...session, ...updatedProps } : session
      )
    );

    if (currentSession?.id === sessionId) {
      setCurrentSession((prev) => (prev ? { ...prev, ...updatedProps } : prev));
    }
  };

  return (
    <ChatContext.Provider
      value={{
        sessions,
        currentSession,
        createNewSession,
        selectSession,
        sendMessage,
        isLoading,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
