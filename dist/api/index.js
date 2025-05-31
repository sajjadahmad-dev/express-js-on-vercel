"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const body_parser_1 = __importDefault(require("body-parser"));
const app = (0, express_1.default)();
app.use(body_parser_1.default.json());
// Environment variables
const PORT = process.env.PORT || 10000;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const WEBHOOK_VERIFY_TOKEN = process.env.WHATSAPP_TOKEN;
const AI_API_URL = process.env.AI_API_URL || "https://shadow-cdk8sgo14t-asem-bakirs-projects.vercel.app";
// Validate required environment variables
if (!PHONE_NUMBER_ID || !WHATSAPP_TOKEN || !WEBHOOK_VERIFY_TOKEN) {
    throw new Error("Missing required environment variables: PHONE_NUMBER_ID, WHATSAPP_TOKEN, and WEBHOOK_VERIFY_TOKEN must be set.");
}
// Root endpoint
app.get("/", (req, res) => {
    res.send("Asim Al-Zill bot is live");
});
// Webhook verification for Meta
app.get("/webhook", (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];
    console.log("Webhook verification attempt:", { mode, token, challenge, expectedToken: WEBHOOK_VERIFY_TOKEN });
    if (mode === "subscribe" && token === WEBHOOK_VERIFY_TOKEN) {
        console.log("Webhook Verified!");
        res.status(200).send(challenge);
    }
    else {
        console.log("Webhook verification failed.");
        res.sendStatus(403);
    }
});
// Webhook handler for incoming messages
app.post("/webhook", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g;
    try {
        const message = (_f = (_e = (_d = (_c = (_b = (_a = req.body.entry) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.changes) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.value) === null || _e === void 0 ? void 0 : _e.messages) === null || _f === void 0 ? void 0 : _f[0];
        if (!(message === null || message === void 0 ? void 0 : message.from) || !((_g = message === null || message === void 0 ? void 0 : message.text) === null || _g === void 0 ? void 0 : _g.body)) {
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
        const aiRes = yield axios_1.default.post(AI_API_URL, { message: text, greeting, language }, {
            headers: { "Content-Type": "application/json" },
            timeout: 10000,
        });
        const reply = aiRes.data.reply || `${greeting} Sorry, I couldn't process your request.`;
        const detectedIntent = aiRes.data.intent || "unknown";
        console.log("AI response:", { reply, detectedIntent });
        // Send reply via WhatsApp
        yield axios_1.default.post(`https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`, {
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
    }
    catch (error) {
        console.error("Error processing webhook:", error.message, error.response ? error.response.data : error);
        res.status(500).send("Server error: " + error.message);
    }
}));
// Start server (only for local testing, Vercel handles this in production)
if (process.env.NODE_ENV !== "production") {
    app.listen(PORT, () => {
        console.log(`✅ Server running on port ${PORT}`);
    });
}
