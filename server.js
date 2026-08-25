const express = require('express');
const cors = require('cors'); // Require CORS middleware
const app = express();
const port = 3002;
const { iniciar_conversacion, consultar } = require('./memoria'); 

// Enable CORS for all routes
app.use(cors());

// Body parser middleware to handle JSON and URL encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (HTML, CSS, JS)
app.use(express.static('public'));

// Endpoint to handle chat requests
app.post('/chat', async (req, res) => {
    const prompt = req.body.prompt;
    const sessionId = req.body.sessionId || req.ip;
    try {
        const response = await consultar(prompt, sessionId);
        res.json({ message: response });
    } catch (error) {
        console.error("Error occurred:", error);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint to (re)start the conversation
app.post('/iniciar', async (req, res) => {
    const sessionId = req.body.sessionId || req.ip;
    try {
        const response = await iniciar_conversacion(sessionId);
        res.json({ message: response });
    } catch (error) {
        console.error("Error occurred:", error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
