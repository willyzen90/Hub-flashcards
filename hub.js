// Estándares de conteo de palabras objetivo por nivel
const CEFR_TARGETS = {
  "A1": 500, "A2": 1000, "B1": 2000, "B2": 4000, "C1": 8000, "C2": 16000
};

const HSK3_TARGETS = {
  "HSK1": 500, "HSK2": 1200, "HSK3": 2245, "HSK4": 3245, 
  "HSK5": 4316, "HSK6": 5456, "HSK7": 7000, "HSK8": 9000, "HSK9": 11000
};

let userDecks = [
  { topic: "Mazo Chino", langCode: "CHINO", cards: [] },
  { topic: "Mazo Inglés", langCode: "INGLÉS", cards: [] }
];

// Cargar datos
function initHub() {
  if (typeof chrome !== "undefined" && chrome.storage) {
    chrome.storage.local.get(["userDecks"], (res) => {
      if (res.userDecks) userDecks = res.userDecks;
      renderAll();
    });
  } else {
    renderAll();
  }
}

function renderAll() {
  renderProgressBars();
  setupNavigation();
  setupStoryGenerator();
}

// Clasificación automática simplificada por longitud y caracteres
function classifyWord(card) {
  if (card.lang === "CHINO") {
    const len = card.text.length;
    if (len <= 2) return "HSK1";
    if (len === 3) return "HSK2";
    if (len === 4) return "HSK3";
    return "HSK4";
  } else {
    const wordLen = card.text.length;
    if (wordLen <= 4) return "A1";
    if (wordLen <= 6) return "A2";
    if (wordLen <= 8) return "B1";
    if (wordLen <= 10) return "B2";
    return "C1";
  }
}

// Renderizado de barras de progreso
function renderProgressBars() {
  const englishContainer = document.getElementById("english-levels-container");
  const chineseContainer = document.getElementById("chinese-levels-container");

  englishContainer.innerHTML = "";
  chineseContainer.innerHTML = "";

  const englishCards = userDecks.find(d => d.langCode === "INGLÉS")?.cards || [];
  const chineseCards = userDecks.find(d => d.langCode === "CHINO")?.cards || [];

  // Calcular conteos
  const cefrCounts = { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0 };
  englishCards.forEach(c => {
    const lvl = classifyWord(c);
    if (cefrCounts[lvl] !== undefined) cefrCounts[lvl]++;
  });

  const hskCounts = { HSK1: 0, HSK2: 0, HSK3: 0, HSK4: 0, HSK5: 0, HSK6: 0, HSK7: 0, HSK8: 0, HSK9: 0 };
  chineseCards.forEach(c => {
    const lvl = classifyWord(c);
    if (hskCounts[lvl] !== undefined) hskCounts[lvl]++;
  });

  // Renderizar barras CEFR
  Object.keys(CEFR_TARGETS).forEach(lvl => {
    const count = cefrCounts[lvl] || 0;
    const target = CEFR_TARGETS[lvl];
    const pct = Math.min(100, Math.round((count / target) * 100));

    englishContainer.appendChild(createBarRow(lvl, pct, count, target, false));
  });

  // Renderizar barras HSK
  Object.keys(HSK3_TARGETS).forEach(lvl => {
    const count = hskCounts[lvl] || 0;
    const target = HSK3_TARGETS[lvl];
    const pct = Math.min(100, Math.round((count / target) * 100));

    chineseContainer.appendChild(createBarRow(lvl, pct, count, target, true));
  });
}

function createBarRow(label, percentage, count, target, isChinese) {
  const row = document.createElement("div");
  row.className = "bar-row";
  row.innerHTML = `
    <span class="bar-label">${label}</span>
    <div class="bar-track">
      <div class="bar-fill ${isChinese ? 'chinese' : ''}" style="width: ${percentage}%"></div>
    </div>
    <span class="bar-stats">${count} / ${target}</span>
  `;
  return row;
}

// Navegación por pestañas
function setupNavigation() {
  document.querySelectorAll(".nav-item").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(btn.dataset.tab).classList.add("active");
    });
  });
}

// Generador de historias simulado con vocabulario local
function setupStoryGenerator() {
  const genBtn = document.getElementById("generate-story-btn");
  const output = document.getElementById("story-output");
  const wordsList = document.getElementById("story-words-list");

  genBtn.addEventListener("click", () => {
    const lang = document.getElementById("story-deck-select").value;
    const deck = userDecks.find(d => d.langCode === lang);

    if (!deck || !deck.cards || deck.cards.length === 0) {
      output.textContent = "Agrega más tarjetas a este mazo antes de generar una historia.";
      wordsList.innerHTML = "";
      return;
    }

    const selectedCards = deck.cards.slice(0, 5); // Toma hasta 5 palabras
    wordsList.innerHTML = "";
    selectedCards.forEach(c => {
      const li = document.createElement("li");
      li.textContent = `${c.text} (${c.translation})`;
      wordsList.appendChild(li);
    });

    if (lang === "CHINO") {
      output.innerHTML = `<strong>Historia en Chino:</strong><br>
      今天我开始学习。在我的词汇库中，${selectedCards.map(c => `<u style="color:#dc2626">${c.text}</u>`).join(" 与 ")} 是非常重要的词汇。只要每天复习，就能不断进步。`;
    } else {
      output.innerHTML = `<strong>Historia en Inglés:</strong><br>
      While studying today, I wanted to focus on key concepts. Terms like ${selectedCards.map(c => `<u style="color:#0284c7">${c.text}</u>`).join(", ")} played an essential role in understanding the lesson in context.`;
    }
  });
}

document.addEventListener("DOMContentLoaded", initHub);