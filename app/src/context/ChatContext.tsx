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
          id: session.id.toString(),
          title: session.title,
          lastMessage: session.last_message || "Start a new conversation",
          updatedAt: new Date(session.updated_at),
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

      // Convert data to match our Message type
      const formattedMessages: Message[] = messagesData.map((msg: any) => ({
        id: msg.id.toString(),
        content: msg.content,
        sender: msg.sender as "user" | "bot",
        timestamp: new Date(msg.timestamp),
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
      await chatService.sendMessage(currentSession.id, content);

      // Simulate a delay for the bot response
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Sample bot responses (in a real app, this would come from the backend)
      const botResponses = [
        "Thank you for your question. I'm here to help you with government services.",
        "That's a great question about our services. Let me provide you with some information.",
        "I understand your concern. Here's what you need to know about this topic.",
        "Based on your query, I can direct you to the right department for more assistance.",
        "The information you're looking for can be found on our official website. Would you like me to provide a direct link?",
        "I'm processing your request. This might take a moment.",
        "For security reasons, please do not share any personal identification details in this chat.",
        "To better assist you, could you please provide more specific details about your query?",
        "This information is handled by a different department. I'm directing your query to the appropriate channel.",
      ];

      // Pick a random response
      const randomResponse =
        botResponses[Math.floor(Math.random() * botResponses.length)];

      const botMessage: Message = {
        id: `temp-bot-${Date.now()}`,
        content: randomResponse,
        sender: "bot",
        timestamp: new Date(),
      };

      const updatedMessagesWithBot = [...updatedMessages, botMessage];

      // Update session with bot response
      updateSessionLocally(currentSession.id, {
        messages: updatedMessagesWithBot,
        lastMessage: randomResponse,
        updatedAt: new Date(),
      });

      // Note: In a real implementation, you would send the bot message to the backend too
      // and then refresh messages from the server to ensure consistency

      // Reload sessions after sending message to get the latest state
      loadSessions();
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
