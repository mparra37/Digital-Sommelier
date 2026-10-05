# MyndFood — The Digital Sommelier

A browser-based virtual wine sommelier ("Salomón"). You talk or type to it, an
LLM plays the sommelier persona and guides a wine-tasting session, and a D-ID
talking-head avatar speaks the reply back over live video. D-ID is optional —
without it configured, text chat still works, just without the avatar video.

## How it works

- You type (or speak) a message in the browser.
- The message goes to a small local server, which forwards it to OpenAI
  (`gpt-4o`) and gets back the sommelier's reply.
- If you've set up a D-ID avatar, the browser sends that reply straight to
  D-ID, which lip-syncs and speaks it over a live WebRTC video connection.
- Each browser tab keeps its own conversation history, so multiple people can
  use it at the same time without mixing up each other's sessions.

## Requirements

- [Node.js](https://nodejs.org/) 18 or newer
- An [OpenAI API key](https://platform.openai.com/api-keys) (required — this
  is what powers the sommelier's replies)
- A [D-ID API key](https://www.d-id.com/) (optional — only needed for the
  talking avatar video; without it you get text chat only)

## Setup

1. Install dependencies:
   ```
   npm install
   ```
2. Set your OpenAI key:
   ```
   cp env.example .env
   ```
   Then open `.env` and replace the placeholder with your real
   `OPENAI_API_KEY`.
3. (Optional) Enable the talking avatar:
   ```
   cp public/api.json.example public/api.json
   ```
   Then open `public/api.json` and replace `YOUR_DID_API_KEY` with your real
   D-ID key.

   > Note: this key is used directly from the browser, so it's visible to
   > anyone who opens devtools on the page. Don't reuse a key you care about
   > keeping private, and don't commit `public/api.json` (it's already
   > git-ignored).

## Running it

```
npm start
```

Then open **http://localhost:3002** in your browser.

## Using the app

The interface has four buttons:

| Button | What it does |
|---|---|
| 🤖 **Connect** | Opens the D-ID video connection and starts the idle avatar (skip this if you don't have a D-ID key set up). |
| ▶️ **Initiate** | Starts a fresh conversation — Salomón greets you and kicks off the tasting session. |
| 🎤 **Voice** | Toggles speech-to-text so you can talk instead of type (supported browsers only, e.g. Chrome). |
| 📞 **Destroy** | Ends the current avatar video connection. |

**Typical flow:**

1. Click **Connect** first if you want the avatar video (optional).
2. Click **Initiate** to have Salomón introduce the tasting and greet you.
3. Type your message in the text box (or click the mic button and speak),
   and send it.
4. Salomón's reply appears as text, and — if connected — is spoken by the
   avatar.
5. Keep chatting to move through the tasting session. Click **Destroy** when
   you're done to close the avatar connection.

## Troubleshooting

- **Clicking Connect does nothing / shows an alert** — `public/api.json` is
  missing or invalid. Text chat still works; you just won't get avatar video.
- **No reply / server error** — check that `.env` exists and has a valid
  `OPENAI_API_KEY`, and that you ran `npm start` from a terminal where you
  can see error output.
- **Mic button doesn't work** — voice input relies on `webkitSpeechRecognition`,
  which only a subset of browsers (e.g. Chrome) support.

## Project layout

See [CLAUDE.md](CLAUDE.md) for a detailed breakdown of each file's
responsibility and the full request flow, if you're working on the code
itself.
