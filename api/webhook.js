import { createHmac } from 'crypto';

// Global variable to store webhook data (will reset on server restart)
let webhookEvents = [];

/**
 * Verify the signature from Periskope
 */
function verifySignature(body, signature) {
  // Get signing key from environment variable
  const SHARED_SECRET = process.env.PERISKOPE_SIGNING_SECRET;
  
  if (!SHARED_SECRET) {
    console.warn("Warning: PERISKOPE_SIGNING_SECRET not set");
    return false;
  }
  
  try {
    const hmac = createHmac("sha256", SHARED_SECRET);
    hmac.update(JSON.stringify(body));
    const digest = hmac.digest("hex");
    return digest === signature;
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

export default function handler(req, res) {
  // Set CORS headers to allow requests from any origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-periskope-signature');
  
  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Handle POST request (webhook)
  if (req.method === 'POST') {
    try {
      // Get signature from header
      const signature = req.headers["x-periskope-signature"];
      
      if (!signature) {
        console.log("Request received without signature");
        // For testing, accept requests without signature
        // return res.status(400).json({ error: 'Missing signature header' });
      }
      
      // Only verify if signature exists
      if (signature) {
        const isValid = verifySignature(req.body, signature);
        if (!isValid) {
          console.log("Invalid signature received");
          // For testing, accept requests with invalid signature
          // return res.status(401).json({ error: 'Invalid signature' });
        }
      }

      // Store the webhook data with received timestamp
      const webhookData = {
        ...req.body,
        receivedAt: new Date().toISOString()
      };
      
      // Store at the beginning of array
      webhookEvents.unshift(webhookData);
      
      // Keep only latest 100 events
      if (webhookEvents.length > 100) {
        webhookEvents = webhookEvents.slice(0, 100);
      }
      
      console.log("Received webhook data:", req.body.event || "Unknown event");
      
      return res.status(200).json({ success: true, message: 'Webhook received' });
    } catch (error) {
      console.error("Error processing webhook:", error);
      return res.status(500).json({ error: 'Server error', message: error.message });
    }
  } 
  // Handle GET request (view data)
  else if (req.method === 'GET') {
    return res.status(200).json({
      count: webhookEvents.length,
      events: webhookEvents
    });
  } 
  else {
    res.setHeader('Allow', ['GET', 'POST', 'OPTIONS']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
}
