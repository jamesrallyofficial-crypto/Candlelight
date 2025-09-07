/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
  const memorialScene = document.getElementById('memorial-scene') as HTMLDivElement;
  const candleContainer = document.getElementById('candle-container') as HTMLDivElement;
  const lightCandleBtn = document.getElementById('light-candle-btn') as HTMLButtonElement;
  const candleCountSpan = document.getElementById('candle-count') as HTMLSpanElement;
  const interactionArea = document.getElementById('interaction-area') as HTMLDivElement;
  const messageInput = document.getElementById('message-input') as HTMLTextAreaElement;
  const submitMessageBtn = document.getElementById('submit-message-btn') as HTMLButtonElement;
  const errorMessage = document.getElementById('error-message') as HTMLParagraphElement;
  const messageDisplay = document.getElementById('message-display') as HTMLDivElement;
  const messageText = document.getElementById('message-text') as HTMLParagraphElement;
  const closeMessageBtn = document.getElementById('close-message-btn') as HTMLButtonElement;

  // --- State and Constants ---
  const ZOOM_FACTOR_PER_CANDLE = 0.002;
  const MAX_ZOOM_OUT = 0.4;
  let candleCount = 0;
  let initialCandleCount = 0;

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
   * Sets the state of the interaction area, controlling which element is visible.
   * @param state - The state to set ('initial', 'input', or 'thanks').
   */
  function setInteractionState(state: 'initial' | 'input' | 'thanks'): void {
      if (!interactionArea) return;
      interactionArea.className = `state-${state}`;
  }

  /**
   * Shows the message input form.
   */
  function showInputForm(): void {
    setInteractionState('input');
    messageInput.value = ''; // Clear previous message
    errorMessage.style.display = 'none'; // Also reset error message
    submitMessageBtn.disabled = false;
    submitMessageBtn.textContent = 'Skicka';
  }

  /**
   * Uses a backend endpoint to moderate the user's message.
   * @param message - The message to moderate.
   * @returns 'SAFE' or 'UNSAFE'.
   */
  async function moderateMessage(message: string): Promise<'SAFE' | 'UNSAFE'> {
      try {
          const response = await fetch('/api/moderate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ message }),
          });

          if (!response.ok) {
              console.error('Moderation API request failed');
              return 'UNSAFE';
          }

          const data = await response.json();
          return data.result === 'SAFE' ? 'SAFE' : 'UNSAFE';
      } catch (error) {
          console.error('Error calling moderation API:', error);
          return 'UNSAFE'; // Fail closed on network errors etc.
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
    try {
      const message = messageInput.value.trim();
      if (message.length === 0) return;

      submitMessageBtn.disabled = true;
      submitMessageBtn.textContent = 'Granskar...';
      errorMessage.style.display = 'none';

      const moderationResult = await moderateMessage(message);

      if (moderationResult === 'SAFE') {
        const success = await saveMessageToBackend(message);
        if (success) {
          addCandleToScene(message, false);
          updateView();
          setInteractionState('thanks');
          // Reset UI to initial state after a delay to allow lighting more candles
          setTimeout(() => {
            setInteractionState('initial');
          }, 3000);
        } else {
          errorMessage.textContent = 'Kunde inte spara meddelandet. Försök igen.';
          errorMessage.style.display = 'block';
          submitMessageBtn.disabled = false;
          submitMessageBtn.textContent = 'Skicka';
        }
      } else {
        errorMessage.textContent = 'Meddelandet godkändes inte. Vänligen justera och försök igen.';
        errorMessage.style.display = 'block';
        submitMessageBtn.disabled = false;
        submitMessageBtn.textContent = 'Skicka';
      }
    } catch (error) {
        console.error("A critical error occurred during message submission:", error);
        errorMessage.textContent = 'Ett oväntat fel inträffade. Vänligen försök igen senare.';
        errorMessage.style.display = 'block';
        if (submitMessageBtn) {
            submitMessageBtn.disabled = false;
            submitMessageBtn.textContent = 'Skicka';
        }
    }
  }

  /**
   * Shows the message display popup.
   * @param text - The message to show.
   * @param targetElement - The element to position the popup near.
   */
  function showMessage(text: string, targetElement: HTMLElement): void {
      if (!messageDisplay || !messageText) return;

      messageText.textContent = text;
      messageDisplay.classList.remove('hidden');
      messageDisplay.classList.add('visible');

      const targetRect = targetElement.getBoundingClientRect();
      const popupRect = messageDisplay.getBoundingClientRect();

      let top = targetRect.top - popupRect.height - 10;
      let left = targetRect.left + (targetRect.width / 2) - (popupRect.width / 2);

      if (top < 10) top = targetRect.bottom + 10;
      if (left < 10) left = 10;
      if (left + popupRect.width > window.innerWidth - 10) {
          left = window.innerWidth - popupRect.width - 10;
      }

      messageDisplay.style.top = `${top}px`;
      messageDisplay.style.left = `${left}px`;
  }

  /**
   * Hides the message display popup.
   */
  function hideMessage(): void {
      if (!messageDisplay) return;
      messageDisplay.classList.remove('visible');
      messageDisplay.classList.add('hidden');
  }

  /**
   * Creates a shooting star element and animates it.
   */
  function createShootingStar(): void {
    if (!memorialScene) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'shooting-star-wrapper';

    const star = document.createElement('div');
    star.className = 'shooting-star';

    const top = Math.random() * 60;
    wrapper.style.top = `${top}%`;
    wrapper.style.left = `-200px`;

    const angle = Math.random() * 20 - 10;
    const duration = Math.random() * 3 + 4;
    
    wrapper.style.transform = `rotate(${angle}deg)`;
    star.style.animationDuration = `${duration}s`;

    wrapper.appendChild(star);
    memorialScene.appendChild(wrapper);

    setTimeout(() => {
      wrapper.remove();
    }, duration * 1000);
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
      if (response.ok) {
        const candles: { message: string }[] = await response.json();
        initialCandleCount = candles.length;
        candles.forEach(candle => addCandleToScene(candle.message, true));
        updateView();
      } else {
          console.error('Could not load initial candles, using fallback.');
          addCandleToScene("Du är inte ensam.", true);
          initialCandleCount = 1;
          updateView();
      }
    } catch (error) {
      console.error('Error fetching initial candles:', error);
      addCandleToScene("Du är inte ensam.", true);
      initialCandleCount = 1;
      updateView();
    }
  }

  // --- Event Listeners ---
  lightCandleBtn?.addEventListener('click', showInputForm);
  submitMessageBtn?.addEventListener('click', handleMessageSubmit);
  closeMessageBtn?.addEventListener('click', hideMessage);

  memorialScene?.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (target.classList.contains('has-message') && target.dataset.message) {
          showMessage(target.dataset.message, target);
      }
  });

  // --- Start the application ---
  initialize();
  scheduleNextShootingStar();
});
