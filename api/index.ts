<<<<<<< HEAD
﻿import express, { Request, Response } from "express";
import axios from "axios";
import bodyParser from "body-parser";
import { config } from "dotenv";

console.log("Loading .env file...");
const result = config();
if (result.error) {
  throw result.error;
}
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

app.get("/", (req: Request, res: Response) => {
  res.send("Asim Al-Zill bot is live");
});

app.get("/webhook", (req: Request, res: Response) => {
  const mode = req.query["hub.mode"] as string;
  const token = req.query["hub.verify_token"] as string;
  const challenge = req.query["hub.challenge"] as string;

  if (mode === "subscribe" && token === WEBHOOK_VERIFY_TOKEN) {
    console.log("Webhook verified");
    res.status(200).send(challenge);
  } else {
    res.status(403).send("Forbidden");
  }
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

      const reply = aiRes.data.reply || `${greeting} Sorry, I couldn"t process your request.`;
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
=======
require('dotenv').config();

const express = require('express');
const app = express();
const { sql } = require('@vercel/postgres');

const bodyParser = require('body-parser');
const path = require('path');

// Create application/x-www-form-urlencoded parser
const urlencodedParser = bodyParser.urlencoded({ extended: false });

app.use(express.static('public'));

app.get('/', function (req, res) {
	res.sendFile(path.join(__dirname, '..', 'components', 'home.htm'));
});

app.get('/about', function (req, res) {
	res.sendFile(path.join(__dirname, '..', 'components', 'about.htm'));
});

app.get('/uploadUser', function (req, res) {
	res.sendFile(path.join(__dirname, '..', 'components', 'user_upload_form.htm'));
});

app.post('/uploadSuccessful', urlencodedParser, async (req, res) => {
	try {
		await sql`INSERT INTO Users (Id, Name, Email) VALUES (${req.body.user_id}, ${req.body.name}, ${req.body.email});`;
		res.status(200).send('<h1>User added successfully</h1>');
	} catch (error) {
		console.error(error);
		res.status(500).send('Error adding user');
	}
});

app.get('/allUsers', async (req, res) => {
	try {
		const users = await sql`SELECT * FROM Users;`;
		if (users && users.rows.length > 0) {
			let tableContent = users.rows
				.map(
					(user) =>
						`<tr>
                        <td>${user.id}</td>
                        <td>${user.name}</td>
                        <td>${user.email}</td>
                    </tr>`
				)
				.join('');

			res.status(200).send(`
                <html>
                    <head>
                        <title>Users</title>
                        <style>
                            body {
                                font-family: Arial, sans-serif;
                            }
                            table {
                                width: 100%;
                                border-collapse: collapse;
                                margin-bottom: 15px;
                            }
                            th, td {
                                border: 1px solid #ddd;
                                padding: 8px;
                                text-align: left;
                            }
                            th {
                                background-color: #f2f2f2;
                            }
                            a {
                                text-decoration: none;
                                color: #0a16f7;
                                margin: 15px;
                            }
                        </style>
                    </head>
                    <body>
                        <h1>Users</h1>
                        <table>
                            <thead>
                                <tr>
                                    <th>User ID</th>
                                    <th>Name</th>
                                    <th>Email</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${tableContent}
                            </tbody>
                        </table>
                        <div>
                            <a href="/">Home</a>
                            <a href="/uploadUser">Add User</a>
                        </div>
                    </body>
                </html>
            `);
		} else {
			res.status(404).send('Users not found');
		}
	} catch (error) {
		console.error(error);
		res.status(500).send('Error retrieving users');
	}
});

app.listen(3000, () => console.log('Server ready on port 3000.'));

module.exports = app;
>>>>>>> 73a33be3e2034f13c84e6e468a826097254e663a
