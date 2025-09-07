
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const systemInstruction = `Du är en innehållsmoderator för en känslig minnessida online för suicidprevention. Ditt uppdrag är att säkerställa att alla meddelanden är säkra, respektfulla och lämpliga. Tonen på minnessidan är sorgsen, hoppfull och stöttande.

Tillåtna meddelanden inkluderar:
- Meddelanden om hopp och stöd (t.ex. "Du är inte ensam", "Det finns hopp").
- Personliga minnesmeddelanden (t.ex. "Till minne av en älskad vän", "Vi saknar dig").
- Korta, innerliga uttryck (t.ex. "En tanke", "Jag älskar dig", "❤️").

Otillåtna meddelanden inkluderar:
- Hatpropaganda, trakasserier eller mobbning.
- Glorifiering eller uppmuntran till självskadebeteende.
- Spam eller reklam.
- Grafiskt eller våldsamt innehåll.
- Meddelanden som är respektlösa eller trivialiserande.

Analysera följande meddelande och svara ENDAST med ordet "SAFE" om det är tillåtet, eller "UNSAFE" om det inte är det.`;

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
        contents: message, // Skicka bara det rena meddelandet
        config: {
            systemInstruction: systemInstruction,
            temperature: 0,
        },
    });
    
    // Trimma bort eventuella extra tecken och gör om till versaler för en säker jämförelse.
    const rawResult = genAIResponse.text.trim().toUpperCase();
    // Städa bort eventuella markdown-tecken som citattecken eller backticks.
    // Detta gör kontrollen mer robust.
    const result = rawResult.replace(/["`]/g, '');

    // Använd .includes() för en mer robust kontroll
    if (result.includes('SAFE')) {
        return response.status(200).json({ result: 'SAFE' });
    }
    
    // Alla svar förutom "SAFE" behandlas som osäkra.
    return response.status(200).json({ result: 'UNSAFE' });

  } catch (error) {
    console.error('Error in moderation function:', error);
    // Om något går fel med AI-tjänsten, nekar vi meddelandet för säkerhets skull.
    return response.status(500).json({ result: 'UNSAFE', error: 'Internal Server Error' });
  }
}
