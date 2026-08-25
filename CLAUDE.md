# MyndFood — Salomón the AI Sommelier

A browser-based virtual wine sommelier ("Salomón"). The user talks or types to it;
an LLM plays the sommelier persona and guides a wine-tasting session; a D-ID
talking-head avatar speaks the reply back over WebRTC video. D-ID is optional —
without it configured, text chat still works, just without the avatar video.

## Request flow

1. Browser loads `public/index.html` (served statically by Express at `/`).
2. User clicks **Connect** → [streaming-client-api.js](public/streaming-client-api.js)
   fetches `public/api.json` (git-ignored; copy `public/api.json.example`) for the
   D-ID key/URL, then talks **directly from the browser to D-ID** (`POST
   /talks/streams`, WebRTC SDP/ICE exchange) to open a video stream. Idle avatar
   video starts playing. If `api.json` is missing/invalid, Connect just alerts and
   the rest of the app keeps working.
3. User types (or speaks, via `webkitSpeechRecognition` where supported) a message
   → [langindex.js](public/langindex.js) `enviar()` POSTs `{ prompt, sessionId }`
   to the local Express server at `/chat` (or `/iniciar` for the opening line).
   `sessionId` is a random id generated once per browser tab and stored in
   `sessionStorage`.
4. [server.js](server.js) forwards `sessionId` into [memoria.js](memoria.js),
   which keeps a **per-session** message history and calls the OpenAI Chat
   Completions API (`gpt-4o`) directly, seeding the first turn with the persona
   script in `prompt2.txt`.
5. `langindex.js` receives the reply and dispatches a `chatResponse` `CustomEvent`.
6. `streaming-client-api.js` listens for that event and — again directly from the
   browser, not through the Express server — `POST`s the reply text to
   `/talks/streams/{streamId}` on D-ID, which lip-syncs/TTS's it over the existing
   WebRTC connection so the avatar video "speaks" the answer.

So there are two independent legs: **browser ⇄ local server ⇄ OpenAI** for getting
the text reply, and **browser ⇄ D-ID** directly for turning that text into video.
The Express server never talks to D-ID.

## File responsibilities

- **server.js** — Express app on port 3002. Serves `public/` statically, exposes
  `POST /chat` (→ `memoria.consultar`) and `POST /iniciar` (→
  `memoria.iniciar_conversacion`), both keyed by `sessionId`. CORS wide open.
- **memoria.js** — Owns the conversation with OpenAI (`gpt-4o`, plain `openai`
  SDK, no LangChain). Keeps an in-memory `Map<sessionId, messages[]>` so
  concurrent browser sessions don't share/corrupt each other's history, and trims
  each session's history to the last 20 messages so it can't grow past the
  model's context window. `iniciar_conversacion()` seeds a fresh session with
  `prompt2.txt`.
- **public/index.html** — The UI: video element + connect/initiate/mic/destroy
  buttons. Loads `langindex.js` and `streaming-client-api.js`.
- **public/langindex.js** — Speech-to-text (only wired up where
  `webkitSpeechRecognition` exists), posts to `/chat` and `/iniciar` with the
  session id, animates the text reply, fires `chatResponse`.
- **public/streaming-client-api.js** — D-ID WebRTC client: creates the stream,
  handles SDP/ICE, plays idle/talking video, sends replies to D-ID on
  `chatResponse`. Degrades to "no avatar" instead of crashing if `api.json` is
  absent.
- **prompt2.txt** — the sommelier persona/scenario script fed to the LLM. Sent
  as the OpenAI **system** message on every call (see `memoria.js`), with a
  `FORMAT_GUARD` appended in code so the model replies only as spoken dialogue
  (no "Sommelier:"/"Persona:" labels) and stays short — keep it short.
- **public/api.json.example**, **env.example** — templates for the two
  git-ignored config files you need to create locally.
- **test_did_credits.js** — standalone script, run with `node
  test_did_credits.js`, that hits D-ID's `GET /credits` with the key from
  `public/api.json` and prints remaining/total credits to the console. Doesn't
  touch the running app.
- **test_chat_flow.js** — standalone script, run with `node test_chat_flow.js`
  against an already-running server (`npm start` first). Plays a short
  scripted wine-tasting conversation through `/iniciar` and `/chat`, and
  flags empty replies, leaked prompt formatting (`"Sommelier:"`, etc.), or
  replies over ~60 words.
- **legacy/** — earlier/experimental UI variants and ad-hoc test scripts, kept for
  reference but not served or required by the running app: `chat.html` +
  `script.js` (older standalone chat page), `index_anterior.html`,
  `myndfood_mago.html` + `script2.js`, `streaming-client-api2.js` (WIP rewrite
  that depended on a `public/openai.js` module that was never added),
  `chat.js` (superseded by `memoria.js`), and `test_d_id.js` / `test_d_id2.js` /
  `test_openai.js`.

## Env vars the code actually reads

- **`OPENAI_API_KEY`** (`memoria.js`) — loaded via `dotenv` from a root-level
  `.env` file (git-ignored; see `env.example`).
- No `PORT` env var is read; the port (3002) is hardcoded in `server.js`.
- The D-ID key is **not** an env var — it lives client-side in `public/api.json`
  (git-ignored; see `public/api.json.example`), fetched by the browser at
  runtime. Note this means the D-ID key is visible to anyone who opens devtools
  on the page — don't reuse a key you care about keeping private.

## Running it locally

```
npm install
cp env.example .env                       # then fill in OPENAI_API_KEY
cp public/api.json.example public/api.json # optional: fill in your D-ID key for avatar video
npm start
```
Open `http://localhost:3002` (Express serves `public/index.html` at `/`).
