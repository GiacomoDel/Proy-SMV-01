import React, { useState, useEffect, useRef } from "react";
import { ChatSession } from "../types";
import "../styles/Chat.css";
import { FiHome, FiMoreHorizontal, FiEdit2, FiTrash2 } from "react-icons/fi";

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
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [renameSessionId, setRenameSessionId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const toggleMenu = (id: string) => {
    setOpenMenuId((prev) => (prev === id ? null : id));
  };

  const handleRename = (id: string) => {
    setOpenMenuId(null); // Cierra el dropdown
    onRenameSession(id, ""); // Llama a la función de renombrar con un valor vacío
  };

  const handleDeleteClick = (id: string) => {
    setOpenMenuId(null); // Cierra el dropdown
    setSessionToDelete(id);
    setShowConfirmation(true); // Muestra el recuadro de confirmación
  };

  const confirmDelete = () => {
    if (sessionToDelete) {
      onDeleteSession(sessionToDelete);
      setSessionToDelete(null);
      setShowConfirmation(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenMenuId(null); // Cierra el dropdown si se hace clic fuera de él
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <>
      <div className="sidebar">
        <div>
          <div className="sidebar-header">
            <FiHome />
            <span>Inicio</span>
          </div>

          <button className="new-chat-button" onClick={onCreateSession}>
            Nueva Consulta
          </button>

          <div className="history-label">Historial de Consultas</div>

          <div className="contHistoryChats">
            {sessions.map((session) => (
              <div className="chat-entry" key={session.id}>
                {/* Contenedor para el nombre del chat */}
                <div
                  className="chat-name"
                  onClick={() => onSelectSession(session.id)} // Invoca el evento al hacer clic
                >
                  {session.title}
                </div>

                {/* Contenedor para el botón del menú */}
                <div className="menu-container">
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Evita que el clic en el botón active el evento del contenedor
                      toggleMenu(session.id); // Abre o cierra el menú
                    }}
                    className="menu-button"
                  >
                    <FiMoreHorizontal />
                  </button>
                  {openMenuId === session.id && (
                    <div className="dropdown show" ref={dropdownRef}>
                      <button
                        onClick={() => {
                          setRenameSessionId(session.id); // Guarda el ID de la sesión a renombrar
                          setRenameValue(session.title); // Prellena el campo con el título actual
                          setOpenMenuId(null); // Cierra el dropdown
                        }}
                      >
                        <FiEdit2 />
                        Renombrar
                      </button>
                      <button onClick={() => handleDeleteClick(session.id)}>
                        <FiTrash2 />
                        Eliminar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="sidebar-footer">
          <img src="/smv.png" alt="Logo SMV" width={165} height={100} className="sidebar-logo" />
          <hr className="sidebar-divider" />
        </div>
      </div>

      {showConfirmation && <div className="overlay show"></div>}

      {showConfirmation && (
        <div className={`confirmation-modal ${showConfirmation ? "show" : ""}`}>
          <h2>¿Eliminar el chat?</h2>
          <p>Esto eliminará el chat seleccionado de forma permanente.</p>
          <div className="modal-buttons">
            <button className="cancel-button" onClick={() => setShowConfirmation(false)}>
              Cancelar
            </button>
            <button className="delete-button" onClick={confirmDelete}>
              Borrar
            </button>
          </div>
        </div>
      )}

      {renameSessionId && (
        <div className="overlay show"></div> /* Fondo oscuro con opacidad */
      )}

      {renameSessionId && (
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
              onClick={() => setRenameSessionId(null)} // Cierra el recuadro
            >
              Cancelar
            </button>
            <button
              className="rename-button"
              onClick={() => {
                if (renameSessionId) {
                  onRenameSession(renameSessionId, renameValue); // Renombra la sesión
                  setRenameSessionId(null); // Cierra el recuadro
                }
              }}
            >
              Hecho
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
