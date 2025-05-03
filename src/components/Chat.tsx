"use client";
import '../styles/Chat.css';

import React, { ChangeEvent, useEffect, useRef, useState } from "react";
import { sendMessageToAgent } from "@/app/lib/apiClient";
import { ChatSession, Message } from "../types";
import Sidebar from "./Sidebar";
import { v4 as uuidv4 } from "uuid";
import { useUser } from "@/app/lib/UserContext";
import { useRouter } from "next/navigation";

export function Chat() {
  const { user, logout } = useUser();
  const router = useRouter();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    const LOCAL_STORAGE_KEY = `chat_sessions_${user.username}`;
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      try {
        const parsed: ChatSession[] = JSON.parse(stored);
        if (parsed.length > 0) {
          setSessions(parsed);
          setCurrentSessionId(parsed[0].id);
          return;
        }
      } catch {
        console.warn("Error parsing stored sessions.");
      }
    }

    const newSession = createNewSession();
    setSessions([newSession]);
    setCurrentSessionId(newSession.id);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([newSession]));
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const LOCAL_STORAGE_KEY = `chat_sessions_${user.username}`;
    if (sessions.length > 0) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sessions));
    }
  }, [sessions, user]);

  const currentSession = sessions.find((s) => s.id === currentSessionId);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setError("");
    setInputValue(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentSession) {
      return setError("No hay sesión activa.");
    }
    if (inputValue.trim()) {
      const message = setNewUserMessage();
      fetchChatResponse(message);
    }
  };

  const handleButtonClick = () => {
    if (!currentSession) {
      return setError("No hay sesión activa.");
    }
    if (inputValue.trim()) {
      const message = setNewUserMessage();
      fetchChatResponse(message);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const setNewUserMessage = (): Message => {
    const newMessage: Message = {
      role: "user",
      content: [{ text: inputValue }],
    };

    setSessions((prev) =>
      prev.map((session) =>
        session.id === currentSessionId
          ? {
              ...session,
              conversation: [...session.conversation, newMessage],
              title:
                session.conversation.length === 0
                  ? inputValue.slice(0, 20) + "..."
                  : session.title,
            }
          : session
      )
    );

    setInputValue("");
    return newMessage;
  };

  const fetchChatResponse = async (message: Message) => {
    setIsLoading(true);
    try {
      const response = await sendMessageToAgent([
        ...currentSession!.conversation,
        message,
      ]);

      const reply: Message = {
        role: "assistant",
        content: [{ text: response.body }],
      };

      setSessions((prev) =>
        prev.map((session) =>
          session.id === currentSessionId
            ? {
                ...session,
                conversation: [...session.conversation, reply],
              }
            : session
        )
      );
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    messagesRef.current?.lastElementChild?.scrollIntoView();
  }, [currentSession]);

  const createNewSession = (): ChatSession => ({
    id: uuidv4(),
    title: "Nuevo Chat",
    conversation: [],
  });

  const handleCreateNewSession = () => {
    const newSession = createNewSession();
    setSessions((prev) => [...prev, newSession]);
    setCurrentSessionId(newSession.id);
  };

  const handleSelectSession = (id: string) => {
    setCurrentSessionId(id);
  };

  const handleDeleteSession = (id: string) => {
    const updatedSessions = sessions.filter((s) => s.id !== id);
    setSessions(updatedSessions);
    if (id === currentSessionId) {
      if (updatedSessions.length > 0) {
        setCurrentSessionId(updatedSessions[0].id);
      } else {
        const newSession = createNewSession();
        setSessions([newSession]);
        setCurrentSessionId(newSession.id);
      }
    }
  };

  const handleRenameSession = (id: string, newTitle: string) => {
    setSessions((prev) =>
      prev.map((session) =>
        session.id === id ? { ...session, title: newTitle } : session
      )
    );
  };

  return (
    <div className="snc-container">
      <div className="sidebar-section">
        <Sidebar
          sessions={sessions}
          currentSessionId={currentSessionId}
          onSelectSession={handleSelectSession}
          onCreateSession={handleCreateNewSession}
          onDeleteSession={handleDeleteSession}
          onRenameSession={handleRenameSession}
        />
      </div>

      <div className="main-section">
        <div className="top-bar">
          <h1>Chat Asistente SMV</h1>
          <div className="right-section">
            <span>{user?.name}</span>
            <button className="logout-button" onClick={handleLogout}>
              Cerrar sesión
            </button>
          </div>
        </div>

        <div className="chat-container">
          {/* Input-container arriba de messages */}
          <div className="input-container">
            <label className="input-label">¿Qué quieres hacer?</label>
            <div className="input-wrapper">
              <input
                value={inputValue}
                onChange={handleInputChange}
                placeholder="Escribe tu mensaje..."
                className="input"
                type="text"
              />
              <button
                type="button" // Cambia a "button" para evitar conflictos con el formulario
                disabled={isLoading || !currentSession}
                className="send-button"
                onClick={handleButtonClick} // Usa la nueva función
              >
                {isLoading ? "Enviando..." : "Enviar"}
              </button>
            </div>
          </div>

          {/* Contenedor de mensajes */}
          <div className="messages" ref={messagesRef}>
            {currentSession?.conversation.map((msg, index) => (
              <div key={index} className={`message ${msg.role}`}>
                <span className={msg.role === "user" ? "icon-user" : "icon-ai"}></span>
                {msg.content[0].text}
              </div>
            ))}
          </div>

          {isLoading && <div className="typing-indicator">Pensando...</div>}

          {error && <div className="error-message">{error}</div>}
        </div>
      </div>
    </div>
  );
}

export default Chat;
