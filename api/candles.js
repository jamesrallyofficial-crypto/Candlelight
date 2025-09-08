import { kv } from '@vercel/kv';

export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  if (request.method === 'GET') {
    try {
      const messages = await kv.lrange('candles:messages', 0, -1);
      return new Response(JSON.stringify({ messages: messages || [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error(error);
      return new Response(JSON.stringify({ error: 'Failed to fetch candles' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  if (request.method === 'POST') {
    try {
      const body = await request.json();
      const message = body.message;

      if (!message || typeof message !== 'string' || message.trim().length === 0 || message.length > 150) {
        return new Response(JSON.stringify({ error: 'Invalid message provided' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      await kv.rpush('candles:messages', message.trim());

      return new Response(JSON.stringify({ success: true }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });

    } catch (error) {
      console.error(error);
      return new Response(JSON.stringify({ error: 'Failed to light a candle' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  return new Response('Method Not Allowed', { status: 405 });
}
