export async function sendMessageToAgent(
  conversation: any[],
  username: string
) {
  try {
    const lastUserMessage = conversation
      .slice()
      .reverse()
      .find((msg) => msg.role === "user");

    const userInput = lastUserMessage?.content?.[0]?.text || "Hola";

    const requestBody = {
      input: userInput,
      sessionId: "default-session",
      username: username, // Enviar el nombre del usuario
    };

    console.log("📤 Enviando solicitud al backend:", requestBody);

    const response = await fetch(
      "https://oy9fpzccbb.execute-api.us-east-1.amazonaws.com/prod/chat",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();

    if (!data || !data.message) {
      throw new Error("Respuesta inválida del backend.");
    }

    return {
      body: data.message,
    };
  } catch (error) {
    console.error("Error al llamar a la API:", error);
    throw error;
  }
}
