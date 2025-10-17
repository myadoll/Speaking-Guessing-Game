// Guess Mya's Lucky Number — Voice Number Game
// - Winning number fixed to 77
// - "So close" for 75,76,78,79
// - Otherwise random incorrect message from the two provided
// - Bonus: if user says "tell me a dad joke", show the joke line

const TARGET = 77;
const CLOSE_SET = new Set([75, 76, 78, 79]);
const WRONG_MESSAGES = ["nope, try again", "not quite, keep trying"];
const DAD_JOKE_TRIGGER = "tell me a dad joke";
const DAD_JOKE = "Where do you go to learn how to make a banana split?.... Sundae school!!!";

const $ = sel => document.querySelector(sel);

const micBtn   = $("#micBtn");
const speakBtn = $("#speakBtn");
const statusEl = $("#status");
const msgs     = $("#messages");
const guessInput = $("#guessInput");
const guessBtn   = $("#guessBtn");

function say(msg, cls = "") {
  const div = document.createElement("div");
  div.className = `msg ${cls}`.trim();
  div.textContent = msg;
  msgs.appendChild(div);
  msgs.scrollTo({ top: msgs.scrollHeight, behavior: "smooth" });
}

function clearStatus() {
  statusEl.textContent = "Click the mic or “Tap to Speak”, then say a number or say “tell me a dad joke”.";
}

function evaluateGuess(n) {
  if (n === TARGET) {
    say("congratulations, you guessed correctly.", "ok");
    return;
  }
  if (CLOSE_SET.has(n)) {
    say("ouuu so close, keep guessing.", "warn");
    return;
  }
  const msg = WRONG_MESSAGES[Math.floor(Math.random() * WRONG_MESSAGES.length)];
  say(msg, "err");
}

function extractNumberFromTranscript(text) {
  // Grab the first number we can find in the text (1–100)
  const m = text.match(/\b(\d{1,3})\b/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  if (n >= 1 && n <= 100) return n;
  return null;
}

function handleTranscript(text) {
  const lower = text.toLowerCase().trim();
  if (lower.includes(DAD_JOKE_TRIGGER)) {
    say(DAD_JOKE, "ok");
    return;
  }
  const guess = extractNumberFromTranscript(lower);
  if (guess == null) {
    say("I didn’t catch a number. Say something like “seventy seven” or “77”.", "err");
    return;
  }
  evaluateGuess(guess);
}

// ---------- Speech recognition (Web Speech API) ----------
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.addEventListener("start", () => {
    micBtn.classList.add("listening");
    micBtn.setAttribute("aria-pressed", "true");
    statusEl.textContent = "Listening… say a number between 1–100 or say “tell me a dad joke.”";
  });

  recognition.addEventListener("end", () => {
    micBtn.classList.remove("listening");
    micBtn.setAttribute("aria-pressed", "false");
    clearStatus();
  });

  recognition.addEventListener("result", (e) => {
    const transcript = Array.from(e.results)
      .map(r => r[0].transcript)
      .join(" ")
      .trim();
    if (transcript) {
      say(`Heard: “${transcript}”`, "");
      handleTranscript(transcript);
    } else {
      say("Heard nothing — try again.", "err");
    }
  });

  recognition.addEventListener("error", (e) => {
    say(`Mic error: ${e.error}. You can also type a number below.`, "err");
  });
} else {
  // No speech API support
  statusEl.textContent = "Microphone not supported in this browser. Use the input box below.";
  micBtn.disabled = true;
  speakBtn.disabled = true;
}

function startListening() {
  if (!recognition) return;
  try {
    recognition.start();
  } catch {
    // start may throw if called rapidly; ignore
  }
}

// Bind controls
micBtn.addEventListener("click", startListening);
speakBtn.addEventListener("click", startListening);

guessBtn.addEventListener("click", () => {
  const v = parseInt(guessInput.value, 10);
  if (Number.isNaN(v)) {
    say("Enter a number between 1 and 100.", "err");
    return;
  }
  if (v < 1 || v > 100) {
    say("Keep it between 1 and 100.", "err");
    return;
  }
  evaluateGuess(v);
  guessInput.value = "";
});

// Quality-of-life: Enter key submits typed guess
guessInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    guessBtn.click();
  }
});

// First helpful messages
say("Guess a number between 1–100.", "");
say('Or say “tell me a dad joke”.', "muted");
