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
const WEBHOOK_VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN; // Fixed: Correct environment variable
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
        const message = (_f = (_e = (_d = (_c = (_b = (_a = req.body.entry) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.changes) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.value) === null || _e ===The second `index.js` you shared appears to be the compiled JavaScript output of a TypeScript file, but you’ve labeled it as `index.js`. However, the first file you shared, also labeled `index.js`, contains TypeScript syntax (e.g., type annotations like `req: Request, res: Response`). This suggests that the first `index.js` should actually be named `index.ts` because it’s written in TypeScript, not JavaScript.

### Issues Identified
1. **File Naming Confusion**:
   - The first `index.js` is actually a TypeScript file (`index.ts`) because it contains TypeScript-specific syntax like type annotations (`req: Request, res: Response`) and the `async` keyword in a way that’s typical for TypeScript.
   - The second `index.js` is the compiled JavaScript output of a TypeScript file, which is correct for deployment on Vercel, but it contains a bug (see below).

2. **Bug in Compiled `index.js`**:
   - In the compiled `index.js`, there’s an error in the environment variable assignment:
     ```javascript
     const WEBHOOK_VERIFY_TOKEN = process.env.WHATSAPP_TOKEN;
