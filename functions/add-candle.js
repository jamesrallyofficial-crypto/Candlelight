import { kv } from '@vercel/kv';

const CANDLES_KEY = 'candles';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Only POST requests allowed' });
  }

  try {
    const { message } = request.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return response.status(400).json({ error: 'Message is required and must be a non-empty string.' });
    }

    // Get the current list of candles
    let candles = await kv.get(CANDLES_KEY);
    if (!Array.isArray(candles)) {
        candles = []; // Initialize if it doesn't exist or is not an array
    }
    
    // Add the new candle
    candles.push({ message: message.trim() });
    
    // Save the updated list
    await kv.set(CANDLES_KEY, candles);

    return response.status(200).json({ success: true, message: 'Candle added.' });
  } catch (error) {
    console.error('Error adding candle:', error);
    return response.status(500).json({ error: 'Internal Server Error' });
  }
}
