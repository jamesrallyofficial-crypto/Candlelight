
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const systemInstruction = `Du är en innehållsmoderator för en känslig minnessida online för suicidprevention. Ditt uppdrag är att säkerställa att alla meddelanden är säkra, respektfulla och stöttande.

**Regler:**
- **Tillåt:** Meddelanden om hopp, stöd, personliga minnen, och korta, innerliga uttryck (t.ex. "Du är inte ensam", "Vi saknar dig", "❤️", "Tack fina").
- **Tillåt inte:** Hat, trakasserier, glorifiering av självskada, spam, eller respektlösa meddelanden.

**Ditt svar måste vara ETT ENDA ORD: antingen SAFE eller UNSAFE.**

**Exempel:**
Input: "Jag tänker på dig"
Output: SAFE

Input: "Vilken hemsk sida"
Output: UNSAFE

Analysera meddelandet i prompten och svara.`;

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Only POST requests allowed' });
  }

  try {
    const { message } = request.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return response.status(400).json({ error: 'Message is required.' });
    }

    const genAIResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: message,
        config: {
            systemInstruction: systemInstruction,
            temperature: 0,
        },
    });
    
    const rawResult = genAIResponse.text.trim().toUpperCase();
    // Ta bort allt som inte är en bokstav för att fånga "SAFE" även om det är formaterat som \`SAFE\` eller "SAFE".
    const result = rawResult.replace(/[^A-Z]/g, '');

    if (result === 'SAFE') {
        return response.status(200).json({ result: 'SAFE' });
    }
    
    // Logga vid misslyckande för enklare felsökning
    console.log(`Moderation failed for message: "${message}". AI response: "${rawResult}"`);
    return response.status(200).json({ result: 'UNSAFE' });

  } catch (error) {
    console.error('Error in moderation function:', error);
    // Om något går fel med AI-tjänsten, nekar vi meddelandet för säkerhets skull.
    return response.status(500).json({ result: 'UNSAFE', error: 'Internal Server Error' });
  }
}
