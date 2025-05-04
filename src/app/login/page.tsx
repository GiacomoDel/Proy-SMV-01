// ✅ Nuevo login desde cero con validación en duro y aislamiento de chats por usuario

// Ruta: src/app/login/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useUser } from '@/app/lib/UserContext';
import Image from 'next/image'; // Importa el componente de imágenes de Next.js
import '../../styles/Login.css'; // Importa los estilos

const hardcodedUsers = {
  usersmv01: { password: 'Smv2025@#', name: 'Usuario smv 01' },
  usersmv02: { password: 'Smv2025@#', name: 'Usuario smv 02' },
  usersmv03: { password: 'Smv2025@#', name: 'Usuario smv 03' },
};

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user) router.push('/');
  }, [user, router]);

  const handleLogin = () => {
    const user = hardcodedUsers[username as keyof typeof hardcodedUsers];

    if (user && user.password === password) {
      login({ username, name: user.name });
      const userKey = `chat_sessions_${username}`;
      const storedSessions = localStorage.getItem(userKey);

      if (!storedSessions) {
        const defaultSession = [
          {
            id: crypto.randomUUID(),
            title: 'Nuevo Chat',
            conversation: [],
          },
        ];
        localStorage.setItem(userKey, JSON.stringify(defaultSession));
      }

      router.push('/');
    } else {
      setError('Usuario o clave incorrecta');
    }
  };

  return (
    <div className="login-container">
      {/* Contenedor del formulario */}
      <div className="login-form">
        <Image
          src="/smv.png" // Ruta de la imagen
          alt="Logo SMV"
          width={150}
          height={100}
          className="login-logo"
        />
        <h2>Iniciar Sesión</h2>
        <input
          placeholder="Usuario"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          placeholder="Clave"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={handleLogin}>Ingresar</button>
        {error && <p className="error">{error}</p>}
      </div>


    </div>
  );
}
