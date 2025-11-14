// utils/n8nReplies.js
import fetch from "node-fetch";

export const sendUserReplyToN8N = async (messageData) => {
  try {
    await fetch("https://webhook.agenciafocomkt.com.br/webhook/SECOND_WEBHOOK_ID", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(messageData),
    });
  } catch (err) {
    console.error("Failed to send user reply to n8n:", err.message);
  }
};
