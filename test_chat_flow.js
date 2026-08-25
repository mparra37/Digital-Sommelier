// test_chat_flow.js
// Simulates a short wine-tasting conversation against the running local
// server, acting as a user, and sanity-checks the OpenAI-backed replies.
// Requires the server to be running first: npm start
// Run with: node test_chat_flow.js
'use strict';

const BASE_URL = 'http://localhost:3002';
const SESSION_ID = `test-chat-flow-${Date.now()}`;

// A short but representative slice of what a real guest would type.
const USER_TURNS = [
  'Veo un color rojo oscuro, casi granate.',
  'Huele a frutas rojas y un poco a vainilla.',
  'Sabe a frutos del bosque, es bastante intenso.',
  '¿Con qué comida lo puedo acompañar?',
  'Perfecto, muchas gracias, eso es todo.',
];

// Anything that leaks the prompt's internal formatting is a bug, not a
// stylistic choice — the model should only ever speak as the sommelier.
const FORBIDDEN_SUBSTRINGS = ['Sommelier:', 'Persona:', 'Usuario:', 'Ejemplo', 'FIN DEL'];
const MAX_WORDS = 60; // 50-word rule + a little slack

function check(reply) {
  const problems = [];
  if (!reply || !reply.trim()) problems.push('respuesta vacía');
  for (const bad of FORBIDDEN_SUBSTRINGS) {
    if (reply.includes(bad)) problems.push(`contiene etiqueta filtrada: "${bad}"`);
  }
  const wordCount = reply.trim().split(/\s+/).length;
  if (wordCount > MAX_WORDS) problems.push(`respuesta muy larga (${wordCount} palabras)`);
  return problems;
}

async function post(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`${path} -> HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.message;
}

async function main() {
  let failures = 0;

  console.log(`Session: ${SESSION_ID}\n`);

  const opening = await post('/iniciar', { sessionId: SESSION_ID });
  console.log(`Salomón: ${opening}`);
  let problems = check(opening);
  if (problems.length) {
    failures++;
    console.log(`  FAIL: ${problems.join('; ')}`);
  } else {
    console.log('  OK');
  }

  for (const userMessage of USER_TURNS) {
    console.log(`\nTú: ${userMessage}`);
    const reply = await post('/chat', { prompt: userMessage, sessionId: SESSION_ID });
    console.log(`Salomón: ${reply}`);
    problems = check(reply);
    if (problems.length) {
      failures++;
      console.log(`  FAIL: ${problems.join('; ')}`);
    } else {
      console.log('  OK');
    }
  }

  console.log(`\n${failures === 0 ? 'PASS' : 'FAIL'}: ${USER_TURNS.length + 1 - failures}/${USER_TURNS.length + 1} replies looked good.`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('Test run crashed:', err.message);
  console.error('Is the server running? Start it with: npm start');
  process.exit(1);
});
