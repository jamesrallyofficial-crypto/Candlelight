/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { GoogleGenAI } from "@google/genai";

// --- DOM Elements ---
const memorialScene = document.getElementById('memorial-scene') as HTMLDivElement;
const candleContainer = document.getElementById('candle-container') as HTMLDivElement;
const lightCandleBtn = document.getElementById('light-candle-btn') as HTMLButtonElement;
const candleCountSpan = document.getElementById('candle-count') as HTMLSpanElement;
const thankYouMessage = document.getElementById('thank-you-message') as HTMLParagraphElement;
const messageInputArea = document.getElementById('message-input-area') as HTMLDivElement;
const messageInput = document.getElementById('message-input') as HTMLTextAreaElement;
const submitMessageBtn = document.getElementById('submit-message-btn') as HTMLButtonElement;
const errorMessage = document.getElementById('error-message') as HTMLParagraphElement;
const messageDisplay = document.getElementById('message-display') as HTMLDivElement;
const messageText = document.getElementById('message-text') as HTMLParagraphElement;
const closeMessageBtn = document.getElementById('close-message-btn') as HTMLButtonElement;

// --- State and Constants ---
const LOCAL_STORAGE_KEY = 'suicidePreventionMemorial';
const ZOOM_FACTOR_PER_CANDLE = 0.002;
const MAX_ZOOM_OUT = 0.4;
let candleCount = 0;
let initialCandleCount = 0;

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Creates and adds a single candle element to the scene.
 * @param message - The message to attach to the candle.
 * @param isInitial - If true, the candle fades in immediately.
 */
function addCandleToScene(message: string | null, isInitial = false): void {
  if (!candleContainer) return;

  const candle = document.createElement('div');
  candle.className = 'candle';
  
  if (message) {
    candle.classList.add('has-message');
    candle.dataset.message = message;
  }
  
  const x = Math.random() * 95 + 2.5;
  const y = Math.random() * 95 + 2.5; // Use more vertical space
  candle.style.left = `${x}%`;
  candle.style.top = `${y}%`;
  
  const size = Math.random() * 10 + 5;
  candle.style.width = `${size}px`;
  candle.style.height = `${size}px`;
  
  const flickerDuration = (Math.random() * 2 + 3).toFixed(2); // Random duration between 3s and 5s

  if (isInitial) {
    // Initial candles fade in over 3s. Start flickering after that + a random delay.
    const flickerDelay = (3 + Math.random() * 2).toFixed(2);
    candle.style.animation = `fadeIn 3s ease-out forwards, candleGlow ${flickerDuration}s ease-in-out ${flickerDelay}s infinite alternate`;
  } else {
    // User-lit candles fade in over 2s with a 0.5s delay. Flicker starts right after.
    const userFadeInDuration = 2;
    const userFadeInDelay = 0.5;
    const flickerStartTime = userFadeInDuration + userFadeInDelay;
    candle.style.animation = `fadeIn ${userFadeInDuration}s ease-out ${userFadeInDelay}s forwards, candleGlow ${flickerDuration}s ease-in-out ${flickerStartTime}s infinite alternate`;
  }

  candleContainer.appendChild(candle);
  candleCount++;
}

/**
 * Updates the UI counter and applies the zoom-out effect.
 */
function updateView(): void {
  if (candleCountSpan) {
    candleCountSpan.textContent = candleCount.toString();
  }

  if (candleContainer) {
    const candlesAddedBeyondInitial = Math.max(0, candleCount - initialCandleCount);
    const scale = 1 - (candlesAddedBeyondInitial * ZOOM_FACTOR_PER_CANDLE);
    const finalScale = Math.max(MAX_ZOOM_OUT, scale);
    candleContainer.style.transform = `scale(${finalScale})`;
  }
}

/**
 * Shows the message input form.
 */
function showInputForm(): void {
  if (lightCandleBtn && messageInputArea) {
    lightCandleBtn.style.display = 'none';
    messageInputArea.style.display = 'flex';
  }
}

/**
 * Uses Gemini to moderate the user's message.
 * @param message - The message to moderate.
 * @returns 'SAFE' or 'UNSAFE'.
 */
async function moderateMessage(message: string): Promise<'SAFE' | 'UNSAFE'> {
    try {
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

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Meddelande: "${message}"`,
            config: {
                systemInstruction: systemInstruction,
            },
        });

        const result = response.text.trim().toUpperCase();
        if (result === 'SAFE' || result === '"SAFE"') {
            return 'SAFE';
        }
        return 'UNSAFE';
    } catch (error) {
        console.error('Error moderating message:', error);
        return 'UNSAFE'; // Fail closed
    }
}

/**
 * Sends the new message to the backend to be saved.
 * @param newMessage The new message to add.
 */
async function saveMessageToBackend(newMessage: string): Promise<boolean> {
  try {
    const response = await fetch('/api/add-candle', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: newMessage }),
    });
    return response.ok;
  } catch (error) {
    console.error('Could not save message to backend:', error);
    return false;
  }
}


/**
 * Handles the submission of a message.
 */
async function handleMessageSubmit(): Promise<void> {
  const message = messageInput.value.trim();
  if (message.length === 0) return;

  submitMessageBtn.disabled = true;
  submitMessageBtn.textContent = 'Granskar...';
  errorMessage.style.display = 'none';

  const moderationResult = await moderateMessage(message);

  if (moderationResult === 'SAFE') {
    // Add candle to the scene immediately for good UX
    addCandleToScene(message);
    updateView();

    // Save to backend
    const success = await saveMessageToBackend(message);
    if (!success) {
        // Handle error case - maybe show a small error to the user
        // For now, we'll just log it. The candle is already on their screen.
        console.error("Failed to save candle for other users.");
    }

    try {
      const data = { hasLit: true };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Could not save to localStorage', e);
    }
    
    if (messageInputArea && thankYouMessage) {
      messageInputArea.style.display = 'none';
      thankYouMessage.style.display = 'block';
    }

  } else {
    errorMessage.textContent = 'Meddelandet kunde inte godkännas. Försök att omformulera dig.';
    errorMessage.style.display = 'block';
  }

  submitMessageBtn.disabled = false;
  submitMessageBtn.textContent = 'Skicka';
}

/**
 * Checks if the user has already lit a candle in a previous session.
 */
function checkSessionState(): void {
  let sessionData = null;
  try {
    const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedData) {
      sessionData = JSON.parse(storedData);
    }
  } catch (e) {
    console.error('Could not read from localStorage', e);
  }

  if (sessionData?.hasLit) {
    if (lightCandleBtn && thankYouMessage) {
      lightCandleBtn.style.display = 'none';
      thankYouMessage.style.display = 'block';
    }
  }
}

/**
 * Shows a message in the display modal.
 * @param candle - The candle element that was clicked.
 */
function showMessage(candle: HTMLElement): void {
  const message = candle.dataset.message;
  if (!message || !messageDisplay || !messageText) return;

  messageText.textContent = `"${message}"`;
  
  const candleRect = candle.getBoundingClientRect();

  const viewX = candleRect.left + (candleRect.width / 2);
  const viewY = candleRect.top + (candleRect.height / 2);

  messageDisplay.style.left = `${viewX}px`;
  messageDisplay.style.top = `${viewY}px`;
  
  messageDisplay.style.transform = 'translate(-50%, -120%)';

  messageDisplay.classList.remove('hidden');
  messageDisplay.classList.add('visible');
}

/**
 * Hides the message display modal.
 */
function hideMessage(): void {
  if (!messageDisplay) return;
  messageDisplay.classList.remove('visible');
  setTimeout(() => {
    if (!messageDisplay.classList.contains('visible')) {
        messageDisplay.classList.add('hidden');
    }
  }, 300);
}

/**
 * Creates and adds a shooting star element to the scene.
 */
function createShootingStar(): void {
  if (!memorialScene) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'shooting-star-wrapper';

  const star = document.createElement('div');
  star.className = 'shooting-star';

  const startX = Math.random() * window.innerWidth;
  const startY = Math.random() * window.innerHeight * 0.4;
  const angle = Math.random() * 45 + 20;
  const duration = Math.random() * 2 + 1.5;

  wrapper.style.left = `${startX}px`;
  wrapper.style.top = `${startY}px`;
  wrapper.style.transform = `rotate(${angle}deg)`;
  
  star.style.animationDuration = `${duration}s`;

  star.addEventListener('animationend', () => {
    wrapper.remove();
  });

  wrapper.appendChild(star);
  memorialScene.appendChild(wrapper);
}

/**
 * Schedules the next shooting star to appear after a random delay.
 */
function scheduleNextShootingStar(): void {
  const delay = Math.random() * 15000 + 10000; // 10-25 seconds
  setTimeout(() => {
    createShootingStar();
    scheduleNextShootingStar();
  }, delay);
}


/**
 * Initializes the memorial scene.
 */
async function initialize(): Promise<void> {
  try {
    const response = await fetch('/api/get-candles');
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const candlesData: { message: string }[] = await response.json();
    initialCandleCount = candlesData.length;
    
    candlesData.forEach((candle) => {
        addCandleToScene(candle.message, true);
    });

  } catch (error) {
    console.error("Could not load initial candle data:", error);
    const errorDisplay = document.querySelector('.counter') as HTMLDivElement;
    if (errorDisplay) {
        errorDisplay.textContent = "Kunde inte ladda ljusdata. Försök att ladda om sidan.";
    }
  }
  
  checkSessionState();
  updateView();
  scheduleNextShootingStar();

  // --- Event Listeners ---
  if (lightCandleBtn) {
    lightCandleBtn.addEventListener('click', showInputForm);
  }
  if(submitMessageBtn) {
    submitMessageBtn.addEventListener('click', handleMessageSubmit);
  }
  if(candleContainer) {
    candleContainer.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (target.classList.contains('candle') && target.dataset.message) {
            showMessage(target);
        }
    });
  }
  if(closeMessageBtn) {
    closeMessageBtn.addEventListener('click', hideMessage);
  }

  document.addEventListener('click', (e) => {
    if (messageDisplay.classList.contains('visible') && !messageDisplay.contains(e.target as Node) && !(e.target as HTMLElement).classList.contains('candle')) {
        hideMessage();
    }
  });
}

// --- Start the application ---
initialize();
