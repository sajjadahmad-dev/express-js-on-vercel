import express, { Request, Response } from "express";
import axios from "axios";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.json());

// Environment variables
const PORT = process.env.PORT || 10000;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const WEBHOOK_VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN;
const AI_API_URL = process.env.AI_API_URL || "https://shadow-cdk8sgo14t-asem-bakirs-projects.vercel.app";

// Validate required environment variables
if (!PHONE_NUMBER_ID || !WHATSAPP_TOKEN || !WEBHOOK_VERIFY_TOKEN) {
    throw new Error("Missing required environment variables: PHONE_NUMBER_ID, WHATSAPP_TOKEN, and WEBHOOK_VERIFY_TOKEN must be set.");
}

// Root endpoint
app.get("/", (req: Request, res: Response) => {
    res.send("Asim Al-Zill bot is live");
});

// Webhook verification for Meta
app.get("/webhook", (req: Request, res: Response) => {
    const mode = req.query["hub.mode"] as string;
    const token = req.query["hub.verify_token"] as string;
    const challenge = req.query["hub.challenge"] as string;

    console.log("Webhook verification attempt:", { mode, token, challenge, expectedToken: WEBHOOK_VERIFY_TOKEN });

    if (mode === "subscribe" && token === WEBHOOK_VERIFY_TOKEN) {
        console.log("Webhook Verified!");
        res.status(200).send(challenge);
    } else {
        console.log("Webhook verification failed.");
        res.sendStatus(403);
    }
});

// Webhook handler for incoming messages
app.post("/webhook", async (req: Request, res: Response) => {
    try {
        const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
        if (!message?.from || !message?.text?.body) {
            console.log("Invalid message received:", req.body);
            return res.status(400).send("Invalid message");
        }

        const senderPhone = message.from;
        const text = message.text.body.trim();
        const hour = new Date().getHours();
        const greeting = hour < 12 ? "Good morning!" : hour < 18 ? "Good afternoon!" : "Good evening!";
        const language = /^[a-zA-Z\s]+$/.test(text) ? "en" : text.match(/merhaba/i) ? "tr" : "ar";

        console.log("Processing message:", { senderPhone, text, language });

        // Call AI API
        const aiRes = await axios.post(AI_API_URL, { message: text, greeting, language }, {
            headers: { "Content-Type": "application/json" },
            timeout: 10000,
        });
        const reply = aiRes.data.reply || `${greeting} Sorry, I couldn't process your request.`;
        const detectedIntent = aiRes.data.intent || "unknown";

        console.log("AI response:", { reply, detectedIntent });

        // Send reply via WhatsApp
        await axios.post(`https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`, {
            messaging_product: "whatsapp",
            to: senderPhone,
            type: "text",
            text: { body: reply },
        }, {
            headers: {
                Authorization: `Bearer ${WHATSAPP_TOKEN}`,
                "Content-Type": "application/json",
            },
            timeout: 10000,
        });

        console.log("Reply sent to WhatsApp:", { to: senderPhone, reply });
        res.status(200).send("Message processed");
    } catch (error: any) {
        console.error("Error processing webhook:", error.message, error.response?.data || error);
        res.status(500).send("Server error: " + error.message);
    }
});

// Start server (only for local testing, Vercel handles this in production)
if (process.env.NODE_ENV !== "production") {
    app.listen(PORT, () => {
        console.log(`✅ Server running on port ${PORT}`);
    });
}
