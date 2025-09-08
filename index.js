/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// --- DOM Elements ---
const memorialScene = document.getElementById('memorial-scene');
const candleContainer = document.getElementById('candle-container');
const lightCandleBtn = document.getElementById('light-candle-btn');
const candleCountSpan = document.getElementById('candle-count');
const thankYouMessage = document.getElementById('thank-you-message');
const messageDisplay = document.getElementById('message-display');
const messageText = document.getElementById('message-text');
const closeMessageBtn = document.getElementById('close-message-btn');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const errorMessage = document.getElementById('error-message');


// --- State and Constants ---
const LOCAL_STORAGE_KEY = 'suicidePreventionMemorial';
const INITIAL_CANDLE_COUNT = 75;
const ZOOM_FACTOR_PER_CANDLE = 0.002;
const MAX_ZOOM_OUT = 0.4;
let candleCount = 0;

const predefinedMessages = [
  "Du är inte ensam.",
  "Det finns hopp, även när det känns som mörkast.",
  "En dag i taget. Du klarar det här.",
  "Vila. Du behöver inte lösa allt på en gång.",
  "Din existens gör världen ljusare.",
  "Till minne av en älskad vän.",
  "Vi tänker på dig.",
  "Tillsammans är vi starka.",
  "Det är okej att inte vara okej.",
  "Var snäll mot dig själv.",
  "För de vi saknar, i evigt minne."
];

/**
 * Displays an error message to the user.
 * @param {string} text The error text to display.
 */
function showError(text) {
    if(!errorMessage) return;
    errorMessage.textContent = text;
    errorMessage.classList.add('error-visible');
    errorMessage.classList.remove('error-hidden');
}

/**
 * Hides the error message.
 */
function hideError() {
    if(!errorMessage) return;
    errorMessage.classList.add('error-hidden');
    errorMessage.classList.remove('error-visible');
}

/**
 * Creates and adds a single candle element to the scene.
 * @param {string} message - The message to attach to the candle.
 * @param {boolean} [isInitial=false] - If true, the candle fades in immediately.
 * @returns {HTMLDivElement} The newly created candle element.
 */
function addCandleToScene(message, isInitial = false) {
  if (!candleContainer) throw new Error("Candle container not found");

  const candle = document.createElement('div');
  candle.className = 'candle has-message';
  candle.dataset.message = message;

  const x = Math.random() * 95 + 2.5;
  const y = Math.random() * 95 + 2.5;
  candle.style.left = `${x}%`;
  candle.style.top = `${y}%`;

  const size = Math.random() * 10 + 5;
  candle.style.width = `${size}px`;
  candle.style.height = `${size}px`;

  const flickerDuration = (Math.random() * 2 + 3).toFixed(2);

  if (isInitial) {
    const flickerDelay = (3 + Math.random() * 2).toFixed(2);
    candle.style.animation = `fadeIn 3s ease-out forwards, candleGlow ${flickerDuration}s ease-in-out ${flickerDelay}s infinite alternate`;
  } else {
    const userFadeInDuration = 2;
    const userFadeInDelay = 0.5;
    const flickerStartTime = userFadeInDuration + userFadeInDelay;
    candle.style.animation = `fadeIn ${userFadeInDuration}s ease-out ${userFadeInDelay}s forwards, candleGlow ${flickerDuration}s ease-in-out ${flickerStartTime}s infinite alternate`;
  }

  candleContainer.appendChild(candle);
  candleCount++;
  return candle;
}

/**
 * Displays a sparkle animation at a specific viewport location.
 * @param {number} x - The horizontal coordinate.
 * @param {number} y - The vertical coordinate.
 */
function showSparkleAt(x, y) {
  const sparkle = document.createElement('div');
  sparkle.className = 'sparkle';
  sparkle.style.left = `${x}px`;
  sparkle.style.top = `${y}px`;
  document.body.appendChild(sparkle);
  sparkle.addEventListener('animationend', () => {
      sparkle.remove();
  });
}

/**
 * Updates the UI counter and applies the zoom-out effect.
 */
function updateView() {
  if (candleCountSpan) {
    candleCountSpan.textContent = candleCount.toString();
  }

  if (candleContainer) {
    const userAddedCandles = Math.max(0, candleCount - INITIAL_CANDLE_COUNT);
    const scale = 1 - (userAddedCandles * ZOOM_FACTOR_PER_CANDLE);
    const finalScale = Math.max(MAX_ZOOM_OUT, scale);
    candleContainer.style.transform = `scale(${finalScale})`;
  }
}

/**
 * Checks if the user has already lit a candle in a previous session to hide the form.
 */
function checkSessionState() {
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
    if (messageForm && thankYouMessage) {
      messageForm.style.display = 'none';
      thankYouMessage.style.display = 'block';
    }
  }
}

/**
 * Shows a message in the display modal.
 * @param {HTMLElement} candle - The candle element that was clicked.
 */
function showMessage(candle) {
  const message = candle.dataset.message;
  if (!message || !messageDisplay || !messageText) return;

  messageText.textContent = `"${message}"`;

  const candleRect = candle.getBoundingClientRect();
  const viewX = candleRect.left + (candleRect.width / 2);
  const viewY = candleRect.top + (candleRect.height / 2);

  messageDisplay.style.left = `${viewX}px`;
  messageDisplay.style.top = `${viewY}px`;
  messageDisplay.classList.remove('hidden');
  messageDisplay.classList.add('visible');
}

/**
 * Hides the message display modal.
 */
function hideMessage() {
  if (!messageDisplay) return;
  messageDisplay.classList.remove('visible');
  messageDisplay.classList.add('hidden');
}

/**
 * Creates and adds a shooting star element to the scene.
 */
function createShootingStar() {
    if (!memorialScene) return;

    const star = document.createElement('div');
    star.className = 'shooting-star';

    const startX = Math.random() * window.innerWidth;
    const startY = -50;
    const endX = Math.random() * window.innerWidth;
    const endY = window.innerHeight + 50;
    const duration = Math.random() * 4 + 6;

    star.style.setProperty('--start-x', `${startX}px`);
    star.style.setProperty('--start-y', `${startY}px`);
    star.style.setProperty('--end-x', `${endX}px`);
    star.style.setProperty('--end-y', `${endY}px`);
    star.style.animation = `shoot ${duration}s ease-in-out forwards`;

    star.addEventListener('animationend', () => {
        star.remove();
    });

    memorialScene.appendChild(star);
}

/**
 * Schedules the next shooting star to appear after a random delay.
 * @param {boolean} [isFirst=false] - If true, schedule the first star to appear quickly.
 */
function scheduleNextShootingStar(isFirst = false) {
  const delay = isFirst ? 2000 : Math.random() * 15000 + 10000;
  setTimeout(() => {
    createShootingStar();
    scheduleNextShootingStar();
  }, delay);
}

/**
 * Initializes the memorial scene by fetching candle data from the server.
 */
async function initialize() {
  // Add the predefined "base" candles first
  for (let i = 0; i < INITIAL_CANDLE_COUNT; i++) {
    const message = predefinedMessages[i % predefinedMessages.length];
    addCandleToScene(message, true);
  }

  // Fetch user-submitted candles from the server
  try {
    const response = await fetch('/api/candles');
    if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
    }
    const data = await response.json();
    data.messages.forEach(message => {
        addCandleToScene(message, true);
    });
  } catch (error) {
      console.error("Failed to load user-lit candles:", error);
  }

  checkSessionState();
  updateView();
  scheduleNextShootingStar(true);

  // --- Event Listeners ---
  if (messageForm) {
    messageForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const message = messageInput.value.trim();
      if (!message) {
        showError("Vänligen skriv ett meddelande.");
        return;
      }

      hideError();
      lightCandleBtn.disabled = true;
      lightCandleBtn.textContent = 'Tänder ljus...';

      try {
        const response = await fetch('/api/candles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: message }),
        });

        if (!response.ok) {
            throw new Error(`Server responded with ${response.status}`);
        }
        
        const newCandle = addCandleToScene(message, false);
        updateView();

        requestAnimationFrame(() => {
            const candleRect = newCandle.getBoundingClientRect();
            const x = candleRect.left + candleRect.width / 2;
            const y = candleRect.top + candleRect.height / 2;
            showSparkleAt(x, y);
        });

        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ hasLit: true }));
        } catch (err) {
            console.error('Could not save to localStorage', err);
        }

        if (thankYouMessage) {
            messageForm.style.display = 'none';
            thankYouMessage.style.display = 'block';
        }

      } catch (error) {
        console.error("Failed to submit candle:", error);
        showError("Kunde inte tända ljuset. Försök igen.");
        lightCandleBtn.disabled = false;
        lightCandleBtn.textContent = 'Tänd ett ljus';
      }
    });
  }

  if(candleContainer) {
    candleContainer.addEventListener('click', (e) => {
        const target = e.target;
        if (target instanceof HTMLElement && target.classList.contains('candle') && target.dataset.message) {
            showMessage(target);
        }
    });
  }

  if(closeMessageBtn) {
    closeMessageBtn.addEventListener('click', hideMessage);
  }

  document.addEventListener('click', (e) => {
    if (messageDisplay?.classList.contains('visible') && !messageDisplay.contains(e.target) && !(e.target instanceof HTMLElement && e.target.classList.contains('candle'))) {
        hideMessage();
    }
  });
}

// --- Start the application ---
document.addEventListener('DOMContentLoaded', initialize);
