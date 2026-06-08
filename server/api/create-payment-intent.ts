import type { IncomingMessage, ServerResponse } from "node:http";
import Stripe from "stripe";
import { readJsonBody } from "../lib/readRequestBody";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

const sendJson = (res: ServerResponse, statusCode: number, payload: Record<string, unknown>) => {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.end(JSON.stringify(payload));
};

interface PaymentIntentRequest {
  amount: number;
  currency: string;
  projectId: string;
  tonnes: number;
  userId: string;
}

const handler = async (req: IncomingMessage, res: ServerResponse) => {
  // Handle CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.statusCode = 200;
    res.end();
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { success: false, error: "Method not allowed" });
    return;
  }

  try {
    const { amount, currency, projectId, tonnes, userId } = await readJsonBody<PaymentIntentRequest>(req);

    if (!amount || !currency || !projectId) {
      sendJson(res, 400, { success: false, error: "Missing required fields" });
      return;
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: currency.toLowerCase(),
      metadata: {
        projectId,
        tonnes: tonnes.toString(),
        userId,
      },
    });

    sendJson(res, 200, {
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error("Payment intent error:", error);
    sendJson(res, 500, { success: false, error: (error as Error).message });
  }
};

export default handler;
