import { kv } from '@vercel/kv';

const CANDLES_KEY = 'candles';

const initialCandles = [
  { "message": "Du är inte ensam." },
  { "message": "Det finns hopp, även när det känns som mörkast." },
  { "message": "En dag i taget. Du klarar det här." },
  { "message": "Vila. Du behöver inte lösa allt på en gång." },
  { "message": "Din existens gör världen ljusare." },
  { "message": "Till minne av en älskad vän." },
  { "message": "Vi tänker på dig." },
  { "message": "Tillsammans är vi starka." },
  { "message": "Det är okej att inte vara okej." },
  { "message": "Var snäll mot dig själv." },
  { "message": "För de vi saknar, i evigt minne." }
];

export default async function handler(request, response) {
  try {
    let candles = await kv.get(CANDLES_KEY);

    // If no candles exist, seed the database with initial ones
    if (!candles || candles.length === 0) {
      await kv.set(CANDLES_KEY, initialCandles);
      candles = initialCandles;
    }

    // Return the list of candles
    return response.status(200).json(candles);
  } catch (error) {
    console.error('Error fetching candles:', error);
    // If there's an error, return the initial set as a fallback
    return response.status(500).json(initialCandles);
  }
}
