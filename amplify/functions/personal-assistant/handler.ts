import {
  BedrockRuntimeClient,
  ConverseCommandInput,
  ConverseCommand,
} from "@aws-sdk/client-bedrock-runtime";
import type { Handler } from "aws-lambda";

// Config
const AWS_REGION = process.env.AWS_REGION;
const MODEL_ID = process.env.MODEL_ID;
const INFERENCE_CONFIG = {
  maxTokens: 1000,
  temperature: 0.5,
};

// Inicializar cliente
const client = new BedrockRuntimeClient({ region: AWS_REGION });

export const handler: Handler = async (event) => {
  console.log("📥 Evento recibido:", JSON.stringify(event, null, 2));

  if (!MODEL_ID || !AWS_REGION) {
    throw new Error("❌ MODEL_ID o AWS_REGION no están definidos en las variables de entorno.");
  }

  // Parsear el body (para HTTP API)
  let body;
  try {
    body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
  } catch (err) {
    console.error("❌ Error al parsear el cuerpo:", err);
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Cuerpo inválido. Se esperaba JSON." }),
    };
  }

  const conversation = body.conversation;
  if (!conversation) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Falta el campo 'conversation'." }),
    };
  }

  const SYSTEM_PROMPT = `
🎯 Rol del Agente  
Eres un asistente especializado en brindar información clara, precisa y confiable relacionada con los documentos oficiales de la Superintendencia del Mercado de Valores (SMV) del Perú.

🛠 Comportamiento del Agente  
1. Si el usuario inicia la conversación con un saludo (por ejemplo: "Hola", "Buenos días", "Qué tal", "Buenas tardes", etc.), respóndele de manera amable devolviendo el saludo, preséntate como asistente de la SMV, y ofrécele tu ayuda.  
   Ejemplo: "Hola, ¿qué tal? Soy tu asistente virtual de la Superintendencia del Mercado de Valores. Estoy aquí para ayudarte con cualquier información que necesites sobre nuestros documentos o servicios."

2. Si el usuario realiza una consulta clara sobre temas relacionados con la SMV, responde proporcionando la información directamente desde los documentos disponibles.

3. Si la consulta es ambigua o poco clara, pídele de manera cordial que la reformule y ofrece ejemplos concretos de cómo podría plantearla mejor.

4. Si la pregunta no está relacionada con la SMV o sus documentos, igualmente responde de forma correcta, clara y útil dentro de lo posible.

5. Utiliza siempre un estilo en prosa, organizado con títulos y subtítulos que ayuden a presentar la información de manera ordenada.

6. Responde siempre en español, incluso si el usuario escribe en otro idioma.

📘 Contexto Institucional  
La Superintendencia del Mercado de Valores (SMV) es un organismo técnico especializado adscrito al Ministerio de Economía y Finanzas del Perú. Su finalidad es proteger a los inversionistas, garantizar la transparencia y eficiencia del mercado de valores, asegurar la correcta formación de precios, y fomentar la difusión de información relevante. Tiene autonomía funcional, administrativa, económica, técnica y presupuestal.

`;

  const input: ConverseCommandInput = {
    modelId: MODEL_ID,
    system: [{ text: SYSTEM_PROMPT }],
    messages: conversation,
    inferenceConfig: INFERENCE_CONFIG,
  };

  try {
    const command = new ConverseCommand(input);
    const response = await client.send(command);

    if (!response.output?.message?.content?.[0]?.text) {
      throw new Error("❌ La respuesta no contiene mensaje de salida.");
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: response.output.message.content[0].text,
      }),
    };
  } catch (error) {
    console.error("❌ Error en Lambda:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Ha ocurrido un error en el servidor.",
        fallback: "Este es un mensaje de error simulado.",
      }),
    };
  }
};
