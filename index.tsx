/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// --- DOM Elements ---
const memorialScene = document.getElementById('memorial-scene') as HTMLDivElement;
const candleContainer = document.getElementById('candle-container') as HTMLDivElement;
const lightCandleBtn = document.getElementById('light-candle-btn') as HTMLButtonElement;
const candleCountSpan = document.getElementById('candle-count') as HTMLSpanElement;
const thankYouMessage = document.getElementById('thank-you-message') as HTMLParagraphElement;
const messageDisplay = document.getElementById('message-display') as HTMLDivElement;
const messageText = document.getElementById('message-text') as HTMLParagraphElement;
const closeMessageBtn = document.getElementById('close-message-btn') as HTMLButtonElement;


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
 * Creates and adds a single candle element to the scene.
 * @param message - The message to attach to the candle. If null, candle is not clickable.
 * @param isInitial - If true, the candle fades in immediately.
 * @returns The newly created candle element.
 */
function addCandleToScene(message: string | null, isInitial = false): HTMLDivElement {
  if (!candleContainer) throw new Error("Candle container not found");

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
  return candle;
}

/**
 * Displays a sparkle animation at a specific viewport location.
 * @param x - The horizontal coordinate.
 * @param y - The vertical coordinate.
 */
function showSparkleAt(x: number, y: number): void {
  const sparkle = document.createElement('div');
  sparkle.className = 'sparkle';
  sparkle.style.left = `${x}px`;
  sparkle.style.top = `${y}px`;
  // The sparkle is positioned relative to the viewport, so it needs to be outside the candle container.
  document.body.appendChild(sparkle);
  sparkle.addEventListener('animationend', () => {
      sparkle.remove();
  });
}

/**
 * Updates the UI counter and applies the zoom-out effect.
 */
function updateView(): void {
  if (candleCountSpan) {
    candleCountSpan.textContent = candleCount.toString();
  }

  if (candleContainer) {
    const candlesAddedByUser = Math.max(0, candleCount - INITIAL_CANDLE_COUNT);
    const scale = 1 - (candlesAddedByUser * ZOOM_FACTOR_PER_CANDLE);
    const finalScale = Math.max(MAX_ZOOM_OUT, scale);
    candleContainer.style.transform = `scale(${finalScale})`;
  }
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
    // Add a non-clickable candle for the returning user
    addCandleToScene(null, true);
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
  
  // Position the modal near the candle
  const candleRect = candle.getBoundingClientRect();

  // Calculate position relative to the viewport
  const viewX = candleRect.left + (candleRect.width / 2);
  const viewY = candleRect.top + (candleRect.height / 2);

  messageDisplay.style.left = `${viewX}px`;
  messageDisplay.style.top = `${viewY}px`;
  
  // Adjust position to not go off-screen
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
  // Use a timeout to allow fade-out animation before setting display to none
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
  const startY = Math.random() * window.innerHeight * 0.4; // Appear in top 40% of screen
  const angle = Math.random() * 45 + 20; // Angle between 20 and 65 degrees
  const duration = Math.random() * 2 + 1.5; // 1.5s to 3.5s animation

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
function initialize(): void {
  for (let i = 0; i < INITIAL_CANDLE_COUNT; i++) {
    const message = predefinedMessages[i % predefinedMessages.length];
    addCandleToScene(message, true);
  }
  
  checkSessionState();
  updateView();
  scheduleNextShootingStar();

  // --- Event Listeners ---
  if (lightCandleBtn) {
    lightCandleBtn.addEventListener('click', () => {
      // Disable button immediately to prevent double clicks
      lightCandleBtn.disabled = true;

      // Add a candle without a message and get the element back
      const newCandle = addCandleToScene(null, false);
      updateView();

      // Show a sparkle effect where the new candle appeared.
      // We need to wait a frame for the candle to be positioned.
      requestAnimationFrame(() => {
          const candleRect = newCandle.getBoundingClientRect();
          const x = candleRect.left + candleRect.width / 2;
          const y = candleRect.top + candleRect.height / 2;
          showSparkleAt(x, y);
      });

      // Save state to local storage
      try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ hasLit: true }));
      } catch (e) {
          console.error('Could not save to localStorage', e);
      }

      // Update the UI to show thank you message
      if (thankYouMessage) {
          lightCandleBtn.style.display = 'none';
          thankYouMessage.style.display = 'block';
      }
    });
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
  // Hide message when clicking outside
  document.addEventListener('click', (e) => {
    if (messageDisplay?.classList.contains('visible') && !messageDisplay.contains(e.target as Node) && !(e.target as HTMLElement).classList.contains('candle')) {
        hideMessage();
    }
  });

}

// --- Start the application ---
initialize();
