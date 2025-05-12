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
