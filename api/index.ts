import express, { Request, Response } from "express";
import axios from "axios";
import bodyParser from "body-parser";

console.log("Checking environment variables...");
console.log("ENV CHECK:", {
  PHONE_NUMBER_ID: process.env.PHONE_NUMBER_ID,
  WHATSAPP_TOKEN: process.env.WHATSAPP_TOKEN,
  WEBHOOK_VERIFY_TOKEN: process.env.WEBHOOK_VERIFY_TOKEN,
});

const app = express();

// Ensure environment variables are set
const PORT = process.env.PORT || 10000;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const AI_API_URL = process.env.AI_API_URL || "https://shadow-cdk8sgo14t-asem-bakirs-projects.vercel.app";
const WEBHOOK_VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN;

// Validate required environment variables
if (!PHONE_NUMBER_ID || !WHATSAPP_TOKEN || !WEBHOOK_VERIFY_TOKEN) {
  throw new Error("Missing required environment variables: PHONE_NUMBER_ID, WHATSAPP_TOKEN, and WEBHOOK_VERIFY_TOKEN must be set.");
}

app.use(bodyParser.json());

app.get("/webhook", (req: Request, res: Response) => {
  const verify_token = "asim-zill-12345";

  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === verify_token) {
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

app.get("/", (req: Request, res: Response) => {
  res.send("Asim Al-Zill bot is live");
});

app.post("/webhook", async (req: Request, res: Response) => {
  try {
    const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    const senderPhone = message?.from;
    const text = message?.text?.body?.trim();

    if (senderPhone && text) {
      console.log(`Received from ${senderPhone}: ${text}`);

      const hour = new Date().getHours();
      let greeting = "Hello!";
      if (hour < 12) greeting = "Good morning!";
      else if (hour < 18) greeting = "Good afternoon!";
      else greeting = "Good evening!";

      let language = "ar";
      if (/^[a-zA-Z\s]+$/.test(text)) language = "en";
      else if (text.match(/merhaba/i)) language = "tr";

      const aiRes = await axios.post(AI_API_URL, {
        message: text,
        greeting: greeting,
        language: language,
      }, {
        headers: { "Content-Type": "application/json" },
      });

      const reply = aiRes.data.reply || `${greeting} Sorry, I couldn't process your request.`;
      const detectedIntent = aiRes.data.intent || "unknown";

      console.log(`Detected intent: ${detectedIntent}, Language: ${language}, Reply: ${reply}`);

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
    } else {
      res.status(400).send("Invalid message");
    }
  } catch (error) {
    console.error("Error in webhook:", (error as Error).message);
    res.status(500).send("Server error");
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
