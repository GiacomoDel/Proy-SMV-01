"use client";
import '../styles/Chat.css';
import Markdown from 'react-markdown'; // Importa el componente de Markdown
import React, { ChangeEvent, useEffect, useRef, useState } from "react";
import { sendMessageToAgent } from "@/app/lib/apiClient";
import { ChatSession, Message } from "../types";
import Sidebar from "./Sidebar";
import { v4 as uuidv4 } from "uuid";
import { useUser } from "@/app/lib/UserContext";
import { useRouter } from "next/navigation";
import { FiLogOut, FiEdit2 } from "react-icons/fi";

export function Chat() {
  const { user, logout } = useUser();
  const router = useRouter();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameValue, setRenameValue] = useState("");
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
    if (!user || !user.username) {
      console.error("❌ Usuario no definido o sin username.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await sendMessageToAgent(
        [...currentSession!.conversation, message],
        user.username
      );

      console.log("✅ Respuesta del backend:", response.body);

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

  const confirmDelete = () => {
    if (currentSessionId) {
      handleDeleteSession(currentSessionId);
      setShowDeleteConfirmation(false);
    }
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
            <span>Usuario: {user?.username}</span> {/* Muestra el nombre del usuario */}
            <button
              className="logout-button"
              onClick={() => setShowLogoutConfirmation(true)} // Muestra el cuadro de confirmación
            >
              <FiLogOut />
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
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleButtonClick(); // Llama a la función para enviar el mensaje
                  }
                }}
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

          {/* Separador visual */}
          <hr className="separator" />

          {/* Contenedor de mensajes */}
          <div className="messages" ref={messagesRef}>
            {currentSession?.conversation.map((msg, index) => (
              <div key={index} className={`message ${msg.role}`}>
                <span className={msg.role === "user" ? "icon-user" : "icon-ai"}></span>
                <Markdown>{msg.content[0].text}</Markdown>
              </div>
            ))}
          </div>
          {isLoading && (
            <div className="typing-indicator">
              Procesando
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          )}
  {/* Separador visual */}
  <hr className="separator2" />
      

          {error && <div className="error-message">{error}</div>}
        </div>
      </div>
      {/* Fondo oscuro con opacidad */}
      {(showLogoutConfirmation || showDeleteConfirmation) && (
        <div className="overlay show"></div>
      )}

      {/* Cuadro de confirmación para cerrar sesión */}
      {showLogoutConfirmation && (
        <div className="confirmation-modal show">
          <h2>¿Cerrar sesión?</h2>
          <p>¿Estás seguro de que deseas cerrar sesión?</p>
          <div className="modal-buttons">
            <button
              className="cancel-button"
              onClick={() => setShowLogoutConfirmation(false)} // Cierra el cuadro de confirmación
            >
              Cancelar
            </button>
            <button
              className="delete-button"
              onClick={handleLogout} // Llama a la función de logout
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      )}

      {/* Cuadro de confirmación para eliminar chat */}
      {showDeleteConfirmation && (
        <div className="confirmation-modal show">
          <h2>¿Eliminar el chat?</h2>
          <p>Esto eliminará el chat seleccionado de forma permanente.</p>
          <div className="modal-buttons">
            <button
              className="cancel-button"
              onClick={() => setShowDeleteConfirmation(false)} // Cierra el cuadro de confirmación
            >
              Cancelar
            </button>
            <button
              className="delete-button"
              onClick={confirmDelete} // Llama a la función de eliminación
            >
              Borrar
            </button>
          </div>
        </div>
      )}



      {/* Fondo oscuro con opacidad */}
      {showRenameModal && (
        <div className="overlay show"></div>
      )}

      {/* Cuadro de renombrar sesión */}
      {showRenameModal && (
        <div className="rename-modal show">
          <h2>Renombrar</h2>
          <input
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            placeholder="Nuevo nombre"
            className="rename-input"
          />
          <div className="modal-buttons">
            <button
              className="cancel-button"
              onClick={() => setShowRenameModal(false)} // Cierra el recuadro
            >
              Cancelar
            </button>
            <button
              className="rename-button"
              onClick={() => {
                handleRenameSession(currentSessionId, renameValue); // Renombra la sesión
                setShowRenameModal(false); // Cierra el recuadro
              }}
            >
              Renombrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Chat;
