import React, { useState } from "react";
import { ChatSession } from "../types";
import '../styles/Chat.css';
import Image from 'next/image';
import { FiHome, FiMoreHorizontal, FiEdit2, FiTrash2 } from "react-icons/fi"; // Elimina FiShare2 si ya no se usa

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  currentSessionId,
  onSelectSession,
  onCreateSession,
  onDeleteSession,
  onRenameSession,
}) => {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const toggleMenu = (id: string) => {
    setOpenMenuId((prev) => (prev === id ? null : id));
  };

  const handleRename = (id: string) => {
    const newTitle = prompt("Nuevo nombre para esta sesión:");
    if (newTitle && newTitle.trim() !== "") {
      onRenameSession(id, newTitle.trim());
    }
  };

  return (
    <div className="sidebar">
      {/* Parte superior: Inicio */}
      <div>
        <div className="sidebar-header">
          <FiHome />
          <span>Inicio</span>
        </div>

        {/* Botón nuevo */}
        <button className="new-chat-button" onClick={onCreateSession}>
          Nueva Consulta
        </button>

        {/* Historial de consultas */}
        <div className="history-label">Historial de Consultas</div>

        {/* Contenedor de chats */}
        <div className="contHistoryChats">
          {sessions.map((session) => (
            <div key={session.id} className="chat-entry">
              <span onClick={() => onSelectSession(session.id)}>{session.title}</span>
              <button onClick={() => toggleMenu(session.id)} className="menu-button">
                <FiMoreHorizontal />
              </button>
              {openMenuId === session.id && (
                <div className="dropdown">
                  <button onClick={() => handleRename(session.id)}>
                    <FiEdit2 />
                    Renombrar
                  </button>
                  <button onClick={() => onDeleteSession(session.id)}>
                    <FiTrash2 />
                    Eliminar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Logo SMV + línea blanca */}
      <div className="sidebar-footer">
        <img src="/smv.png" alt="Logo SMV" width={165} height={100} className="sidebar-logo" />
        <hr className="sidebar-divider" />
      </div>
    </div>
  );
};

export default Sidebar;
