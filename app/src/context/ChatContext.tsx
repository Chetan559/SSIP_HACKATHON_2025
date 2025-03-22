
import React, { createContext, useContext, useState, useEffect } from 'react';
import { ChatSession, Message } from '@/types/chat';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from './AuthContext';

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
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load sessions from localStorage when user changes
  useEffect(() => {
    if (user) {
      const storedSessions = localStorage.getItem(`chat_sessions_${user.id}`);
      if (storedSessions) {
        const parsedSessions: ChatSession[] = JSON.parse(storedSessions);
        // Convert string dates back to Date objects
        const sessionsWithDates = parsedSessions.map(session => ({
          ...session,
          updatedAt: new Date(session.updatedAt),
          messages: session.messages.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
        setSessions(sessionsWithDates);
        // Set current session to the most recent one if any exist
        if (sessionsWithDates.length > 0) {
          setCurrentSession(sessionsWithDates[0]);
        } else {
          createNewSession();
        }
      } else {
        // Create initial session if none exists
        createNewSession();
      }
    } else {
      // Clear sessions when user logs out
      setSessions([]);
      setCurrentSession(null);
    }
  }, [user]);

  // Save sessions to localStorage whenever they change
  useEffect(() => {
    if (user && sessions.length > 0) {
      localStorage.setItem(`chat_sessions_${user.id}`, JSON.stringify(sessions));
    }
  }, [sessions, user]);

  const createNewSession = () => {
    if (!user) return;
    
    const newSession: ChatSession = {
      id: Math.random().toString(36).substr(2, 9),
      title: `Chat ${sessions.length + 1}`,
      lastMessage: "Start a new conversation",
      updatedAt: new Date(),
      messages: []
    };
    
    setSessions(prev => [newSession, ...prev]);
    setCurrentSession(newSession);
  };

  const selectSession = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSession(session);
    }
  };

  const updateSession = (sessionId: string, updatedSession: Partial<ChatSession>) => {
    setSessions(prev => 
      prev.map(session => 
        session.id === sessionId 
          ? { ...session, ...updatedSession } 
          : session
      )
    );
    
    if (currentSession?.id === sessionId) {
      setCurrentSession(prev => prev ? { ...prev, ...updatedSession } : prev);
    }
  };

  const sendMessage = async (content: string): Promise<void> => {
    if (!currentSession || !user) return;
    
    setIsLoading(true);
    
    try {
      // Add user message
      const userMessage: Message = {
        id: Math.random().toString(36).substr(2, 9),
        content,
        sender: 'user',
        timestamp: new Date()
      };
      
      const updatedMessages = [...currentSession.messages, userMessage];
      
      updateSession(currentSession.id, {
        messages: updatedMessages,
        lastMessage: content,
        updatedAt: new Date()
      });
      
      // Simulate API delay for bot response
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Sample bot responses
      const botResponses = [
        "Thank you for your question. I'm here to help you with government services.",
        "That's a great question about our services. Let me provide you with some information.",
        "I understand your concern. Here's what you need to know about this topic.",
        "Based on your query, I can direct you to the right department for more assistance.",
        "The information you're looking for can be found on our official website. Would you like me to provide a direct link?",
        "I'm processing your request. This might take a moment.",
        "For security reasons, please do not share any personal identification details in this chat.",
        "To better assist you, could you please provide more specific details about your query?",
        "This information is handled by a different department. I'm directing your query to the appropriate channel."
      ];
      
      // Pick a random response
      const randomResponse = botResponses[Math.floor(Math.random() * botResponses.length)];
      
      const botMessage: Message = {
        id: Math.random().toString(36).substr(2, 9),
        content: randomResponse,
        sender: 'bot',
        timestamp: new Date()
      };
      
      const updatedMessagesWithBot = [...updatedMessages, botMessage];
      
      updateSession(currentSession.id, {
        messages: updatedMessagesWithBot,
        lastMessage: randomResponse,
        updatedAt: new Date()
      });
      
      // Reorder sessions to bring current one to top
      setSessions(prev => {
        const updatedSessions = prev.filter(s => s.id !== currentSession.id);
        return [
          { ...currentSession, 
            messages: updatedMessagesWithBot, 
            lastMessage: randomResponse, 
            updatedAt: new Date() 
          }, 
          ...updatedSessions
        ];
      });
      
    } catch (error) {
      toast({
        title: "Failed to send message",
        description: "There was an error processing your message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ChatContext.Provider value={{
      sessions,
      currentSession,
      createNewSession,
      selectSession,
      sendMessage,
      isLoading
    }}>
      {children}
    </ChatContext.Provider>
  );
};
