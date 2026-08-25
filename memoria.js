// memoria.js
const OpenAI = require("openai");
const fs = require("fs").promises;
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const MODEL = "gpt-4o";
// 50 words in Spanish is ~90-110 tokens; cap with a small buffer so a runaway
// completion can't balloon (that also costs more D-ID minutes to speak).
const MAX_TOKENS = 130;
// Keep the system prompt plus the last N messages so long-running sessions
// don't blow past the model's context window.
const MAX_HISTORY_MESSAGES = 20;

const FORMAT_GUARD =
  "\n\nFORMATO DE RESPUESTA: responde ÚNICAMENTE con lo que el sommelier diría en voz alta " +
  "al invitado, en primera persona, sin ningún prefijo ni etiqueta. NUNCA escribas palabras " +
  "como 'Sommelier:', 'Persona:', 'Usuario:', 'Ejemplo', ni describas la escena o el formato. " +
  "No repitas ni cites los ejemplos anteriores: úsalos solo como referencia de tono. " +
  "Sé breve: máximo 50 palabras por respuesta.";

// One message history per browser session, so concurrent users don't share
// (and corrupt) each other's conversation.
const sessions = new Map();

let escenarioCache = null;
async function crear_escenario() {
  if (escenarioCache) return escenarioCache;
  try {
    escenarioCache = (await fs.readFile("./prompt2.txt", "utf-8")) + FORMAT_GUARD;
    return escenarioCache;
  } catch (err) {
    console.error(err);
    return "";
  }
}

function getSession(sessionId) {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, []);
  }
  return sessions.get(sessionId);
}

function trim(history) {
  const overflow = history.length - MAX_HISTORY_MESSAGES;
  if (overflow > 0) {
    history.splice(0, overflow);
  }
}

async function callModel(history) {
  const escenario = await crear_escenario();
  const completion = await openai.chat.completions.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    messages: [
      { role: "system", content: escenario },
      ...history
    ]
  });
  return completion.choices[0].message.content;
}

async function iniciar_conversacion(sessionId) {
  const history = getSession(sessionId);
  history.length = 0; // starting over resets any prior session state
  history.push({ role: "user", content: "Da la bienvenida e inicia la cata de vino." });

  const respuesta = await callModel(history);
  history.push({ role: "assistant", content: respuesta });
  trim(history);
  return respuesta;
}

async function consultar(prompt, sessionId) {
  const history = getSession(sessionId);
  history.push({ role: "user", content: prompt });

  const respuesta = await callModel(history);
  history.push({ role: "assistant", content: respuesta });
  trim(history);
  return respuesta;
}

module.exports = { iniciar_conversacion, consultar };
