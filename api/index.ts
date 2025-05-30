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
app.get("/webhook", (req: Request, res: Response) => {
  console.log("WEBHOOK VERIFICATION ATTEMPT", {
    mode: req.query["hub.mode"],
    receivedToken: req.query["hub.verify_token"],
    expectedToken: WEBHOOK_VERIFY_TOKEN,
    challenge: req.query["hub.challenge"]
  });

  if (req.query["hub.mode"] === "subscribe" && 
      req.query["hub.verify_token"] === WEBHOOK_VERIFY_TOKEN) {
    console.log("VERIFICATION SUCCESS");
    return res.status(200).send(req.query["hub.challenge"]);
  }

  console.log("VERIFICATION FAILED - Token Mismatch or Invalid Mode");
  return res.sendStatus(403);
});
// Webhook handler for incoming messages
app.post("/webhook", async (req: Request, res: Response) => {
  try {
    const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!message?.from || !message?.text?.body) {
      return res.status(400).send("Invalid message");
    }

    const senderPhone = message.from;
    const text = message.text.body.trim();

    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning!" : hour < 18 ? "Good afternoon!" : "Good evening!";
    const language = /^[a-zA-Z\s]+$/.test(text) ? "en" : text.match(/merhaba/i) ? "tr" : "ar";

    // Call AI API (default)
    const aiRes = await axios.post(
      AI_API_URL,
      { message: text, greeting, language },
      { headers: { "Content-Type": "application/json" } }
    );
    const reply = aiRes.data.reply || `${greeting} Sorry, I couldn't process your request.`;
    const detectedIntent = aiRes.data.intent || "unknown";

    /*
    // Alternative: Use Groq API (uncomment to use)
    const aiRes = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama3-70b-8192",
        messages: [{ role: "user", content: `${greeting} ${text}` }],
        max_tokens: 150,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
      }
    );
    const reply = aiRes.data.choices[0].message.content || `${greeting} Sorry, I couldn't process your request.`;
    const detectedIntent = "unknown"; // Groq doesn't provide intent detection
    */

    // Send reply via WhatsApp
    await axios.post(
      `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: senderPhone,
        type: "text",
        text: { body: reply },
      },
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.status(200).send("Message processed");
  } catch (error) {
    res.status(500).send("Server error");
  }
});

app.listen(PORT);
