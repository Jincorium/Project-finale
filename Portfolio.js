import { addItem, getItems, updateItem, deleteItem } from './src/api/firebaseService.js';



const articleWrapper = document.getElementById("article-wrapper");
const articleId = articleWrapper ? articleWrapper.getAttribute('data-article-id') : null;
const STORAGE_KEY = 'comments-manga';          // Klíče pro localStorage, aby se ukládaly komentáře a lajky pro tento článek
const LIKE_STORAGE_KEY = 'liked-manga-article'; // Klíč pro uložení stavu lajku článku


// Přehrání videa po kliknutí na video wrapper (nahrazení wrapperu iframe s videem)
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.video-card .video-wrapper').forEach(wrapper => {
    wrapper.addEventListener('click', () => {
      const article = wrapper.closest('.video-card');
      const videoId = article.dataset.videoId;
      if (!videoId) return;

      // Vytvoření iframe pro YouTube video
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&rel=0`;
      iframe.frameBorder = "0";
      iframe.allow = "accele  rometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; autoplay";
      iframe.allowFullscreen = true;
      iframe.style.width = '100%';
      iframe.style.height = '180px';

      // Vyčištění wrapperu a přidání iframe
      wrapper.innerHTML = '';
      wrapper.appendChild(iframe);
    });
  });
});

// Filtrace článků podle tagů a zvýraznění aktivního tagu
document.addEventListener('DOMContentLoaded', () => {
  const tags = document.querySelectorAll('.tag');
  let activeFilter = null;

  tags.forEach(tag => {
    tag.style.cursor = 'pointer'; // Přidání kurzoru pro indikaci kliknutí

    tag.addEventListener('click', () => {
      const clickedTag = tag.dataset.tag;

      if (activeFilter === clickedTag) { // Pokud je kliknutý tag již aktivní, zrušíme filtraci
        activeFilter = null;
        showAllArticles();
        clearTagHighlight(tags);
      } else {                           // Pokud je kliknutý tag jiný, nastavíme ho jako aktivní a filtrujeme články
        activeFilter = clickedTag;
        filterArticlesByTag(activeFilter);
        highlightActiveTag(tags, activeFilter);
      }
    });
  });
});

function clearTagHighlight(tags) { // Odstranění zvýraznění všech tagů
  tags.forEach(tag => tag.classList.remove('active'));
}

function highlightActiveTag(tags, tagName) {  // Zvýraznění aktivního tagu
  tags.forEach(tag => {
    tag.classList.toggle('active', tag.dataset.tag === tagName);
  });
}

function showAllArticles() {  // Zobrazení všech článků
  const articles = document.querySelectorAll('.card');
  articles.forEach(article => article.style.display = '');
}

function filterArticlesByTag(tag) { // Skrývání článků, které neobsahují zvolený tag
  const articles = document.querySelectorAll('.card');
  articles.forEach(article => {
    const articleTags = Array.from(article.querySelectorAll('.tag')).map(t => t.dataset.tag);
    if (articleTags.includes(tag)) {
      article.style.display = '';
    } else {
      article.style.display = 'none';
    }
  });
}

//  Přepínač tmavého režimu
const toggleButton = document.getElementById("darkModeToggle");
toggleButton.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");

  const isDark = document.body.classList.contains("dark-mode");
  toggleButton.textContent = isDark ? "☀️" : "🌙";
});

// Přehrávání článku pomocí Web Speech API
const listenButton = document.getElementById("listenButton");
const articleContent = document.getElementById("article-content");

let isSpeaking = false;
let utterance;

listenButton.addEventListener("click", () => {
  if (isSpeaking) { // Pokud už mluvíme, zastavíme přehrávání
    speechSynthesis.cancel();
    isSpeaking = false;
    listenButton.textContent = "🔊";
    return;
  }

  const text = articleContent.innerText || articleContent.textContent; // Získání textu z obsahu článku
  utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";

  utterance.onend = () => { // Po skončení mluvení nastavíme stav
    isSpeaking = false;
    listenButton.textContent = "🔊";
  };

  speechSynthesis.speak(utterance); // Spustíme mluvení
  isSpeaking = true;
  listenButton.textContent = "⏹";
});

// Výpočet času čtení článku
document.addEventListener("DOMContentLoaded", () => {
  const articleWrapper = document.getElementById("article-wrapper");


  if (articleWrapper) { // Pokud existuje wrapper článku, spočítáme slova
    const text = articleWrapper.innerText || articleWrapper.textContent;
    const words = text.trim().split(/\s+/).length;
    const wordsPerMinute = 200;
    const readingTime = Math.ceil(words / wordsPerMinute);

    const readingTimeElement = document.getElementById("reading-time");   // Element pro zobrazení času čtení
    if (readingTimeElement) {
      readingTimeElement.textContent = `⏱ ${readingTime} min read`;
    }
  }
});

// Lajkování článku pomocí localStorage
document.addEventListener("DOMContentLoaded", () => {
  const likeButton = document.getElementById("likeButton");

  if (localStorage.getItem(LIKE_STORAGE_KEY) === "true") {  // Zkontrolujeme, jestli je článek již lajkovaný
    likeButton.classList.add("liked");
  }

  likeButton.addEventListener("click", () => {  // Přepnutí stavu lajku při kliknutí na tlačítko
    const liked = likeButton.classList.toggle("liked");
    localStorage.setItem(LIKE_STORAGE_KEY, liked);
  });
});


// Komentáře: přidání, zobrazení a uložení do localStorage

const commentModal = document.getElementById('commentModal');
const commentButton = document.getElementById('commentButton');
const submitComment = document.getElementById('submitComment');
const cancelComment = document.getElementById('cancelComment');
const commentName = document.getElementById('commentName');
const commentText = document.getElementById('commentText');
const commentList = document.getElementById('commentList');

// Otevření modálního okna pro přidání komentáře
commentButton.addEventListener('click', () => {
  commentModal.classList.remove('hidden');
});

// Skrytí modálního okna a vyčištění vstupů
cancelComment.addEventListener('click', () => {
  commentModal.classList.add('hidden');
  commentName.value = '';
  commentText.value = '';
});

// Načtení uložených komentářů z localStorage při načtení stránky
window.addEventListener('DOMContentLoaded', async () => { 
  try {
    const items = await getItems(articleId);  // Fetch comments for this specific article
    items.forEach(({ name, comment }) => {
      appendCommentToDOM(name, comment);
    });
  } catch (error) {
    console.error('Error loading comments from Firestore:', error);
  }
});

// Odeslání komentáře: přidání do DOM a uložení do localStorage
submitComment.addEventListener('click', async () => {
  const name = commentName.value.trim();
  const comment = commentText.value.trim();

  if (!name || !comment) {
    alert('Please fill in both name and comment!');
    return;
  }

  // Save to Firebase
  await addItem({ name, comment, articleId });

  appendCommentToDOM(name, comment);

  commentName.value = '';
  commentText.value = '';
  commentModal.classList.add('hidden');
});

// Funkce pro přidání komentáře do DOM
function appendCommentToDOM(name, comment) {
  const div = document.createElement('div');
  div.classList.add('comment-entry');
  div.innerHTML = `<strong>${escapeHtml(name)}</strong><p>${escapeHtml(comment)}</p>`;
  commentList.appendChild(div);
}

// Funkce pro únik HTML znaků, aby se zabránilo XSS útokům
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

const sidebar = document.getElementById("sidebarSecondary");
const toggleBtn = document.getElementById("sidebarToggle");

if (sidebar && toggleBtn) { // Inicializace sidebaru a přepínače
  toggleBtn.setAttribute("aria-expanded", "false");

  toggleBtn.addEventListener("click", () => {
    const isVisible = sidebar.classList.toggle("sidebar-visible");
    sidebar.classList.toggle("sidebar-hidden", !isVisible);
    toggleBtn.setAttribute("aria-expanded", isVisible ? "true" : "false");
  });

  document.addEventListener("click", (event) => { // Kliknutí mimo sidebar a přepínač skryje sidebar
    if (!sidebar.contains(event.target) && !toggleBtn.contains(event.target)) {
      sidebar.classList.remove("sidebar-visible");
      sidebar.classList.add("sidebar-hidden");
      toggleBtn.setAttribute("aria-expanded", "false");
    }
  });

  // Zavření sidebaru pomocí klávesy Escape
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      sidebar.classList.remove("sidebar-visible");
      sidebar.classList.add("sidebar-hidden");
      toggleBtn.setAttribute("aria-expanded", "false");
    }
  });
}


