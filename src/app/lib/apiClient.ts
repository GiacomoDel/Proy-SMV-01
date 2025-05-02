export async function sendMessageToAgent(conversation: any[]) {
  try {
    // Obtenemos el último mensaje del usuario para usar como input directo
    const lastUserMessage = conversation
      .slice()
      .reverse()
      .find((msg) => msg.role === "user");

    const userInput = lastUserMessage?.content?.[0]?.text || "Hola";

    const response = await fetch(
      "https://oy9fpzccbb.execute-api.us-east-1.amazonaws.com/prod/chat",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: userInput,
          sessionId: "default-session", // podrías hacer esto dinámico si quieres
        }),
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
