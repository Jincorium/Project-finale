import { addItem, getItems, updateItem, deleteItem } from './src/api/firebaseService.js';
import { register, login, logout, onUserStateChanged } from './src/api/firebaseAuth.js';

function showAdminUI() {
  document.getElementById('adminPanel').style.display = 'block';
  document.getElementById('userPanel').style.display = 'none';
  document.getElementById('loginForm').style.display = 'none';
}

function showNormalUI(user) {
  document.getElementById('userName').textContent = user.email || user.displayName || 'User';
  document.getElementById('adminPanel').style.display = 'none';
  document.getElementById('userPanel').style.display = 'block';
  document.getElementById('loginForm').style.display = 'none';
}

function showLoginUI() {
  document.getElementById('adminPanel').style.display = 'none';
  document.getElementById('userPanel').style.display = 'none';
  document.getElementById('loginForm').style.display = 'block';
}

onUserStateChanged(user => {
  if (user) {
    if (user.email === "admin@bonter.com") {
      showAdminUI();
    } else {
      showNormalUI(user);  // <-- pass user here!
    }
  } else {
    showLoginUI();
  }
});

// DOM interactions
document.addEventListener("DOMContentLoaded", () => {
  const articleWrapper = document.getElementById("article-wrapper");
  const articleId = articleWrapper ? articleWrapper.getAttribute('data-article-id') : null;
  const STORAGE_KEY = 'comments-manga';
  const LIKE_STORAGE_KEY = 'liked-manga-article';

  // Video Play
  document.querySelectorAll('.video-card .video-wrapper').forEach(wrapper => {
    wrapper.addEventListener('click', () => {
      const article = wrapper.closest('.video-card');
      const videoId = article?.dataset?.videoId;
      if (!videoId) return;

      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&rel=0`;
      iframe.frameBorder = "0";
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; autoplay";
      iframe.allowFullscreen = true;
      iframe.style.width = '100%';
      iframe.style.height = '180px';

      wrapper.innerHTML = '';
      wrapper.appendChild(iframe);
    });
  });

  // Tag Filtering
  const tags = document.querySelectorAll('.tag');
  let activeFilter = null;

  tags.forEach(tag => {
    tag.style.cursor = 'pointer';
    tag.addEventListener('click', () => {
      const clickedTag = tag.dataset.tag;
      if (activeFilter === clickedTag) {
        activeFilter = null;
        showAllArticles();
        clearTagHighlight(tags);
      } else {
        activeFilter = clickedTag;
        filterArticlesByTag(activeFilter);
        highlightActiveTag(tags, activeFilter);
      }
    });
  });

  function clearTagHighlight(tags) {
    tags.forEach(tag => tag.classList.remove('active'));
  }

  function highlightActiveTag(tags, tagName) {
    tags.forEach(tag => {
      tag.classList.toggle('active', tag.dataset.tag === tagName);
    });
  }

  function showAllArticles() {
    document.querySelectorAll('.card').forEach(article => article.style.display = '');
  }

  function filterArticlesByTag(tag) {
    document.querySelectorAll('.card').forEach(article => {
      const articleTags = Array.from(article.querySelectorAll('.tag')).map(t => t.dataset.tag);
      article.style.display = articleTags.includes(tag) ? '' : 'none';
    });
  }

  // Dark Mode Toggle
  const toggleButton = document.getElementById("darkModeToggle");
  if (toggleButton) {
    toggleButton.addEventListener("click", () => {
      document.body.classList.toggle("dark-mode");
      toggleButton.textContent = document.body.classList.contains("dark-mode") ? "☀️" : "🌙";
    });
  }

  // Text-to-Speech
  const listenButton = document.getElementById("listenButton");
  const articleContent = document.getElementById("article-content");

  if (listenButton && articleContent) {
    let isSpeaking = false;
    let utterance;

    listenButton.addEventListener("click", () => {
      if (isSpeaking) {
        speechSynthesis.cancel();
        isSpeaking = false;
        listenButton.textContent = "🔊";
        return;
      }

      const text = articleContent.innerText || articleContent.textContent;
      utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.onend = () => {
        isSpeaking = false;
        listenButton.textContent = "🔊";
      };

      speechSynthesis.speak(utterance);
      isSpeaking = true;
      listenButton.textContent = "⏹";
    });
  }

  // Reading Time
  if (articleWrapper) {
    const text = articleWrapper.innerText || articleWrapper.textContent;
    const words = text.trim().split(/\s+/).length;
    const readingTime = Math.ceil(words / 200);
    const readingTimeElement = document.getElementById("reading-time");
    if (readingTimeElement) {
      readingTimeElement.textContent = `⏱ ${readingTime} min read`;
    }
  }

  // Like Button
  const likeButton = document.getElementById("likeButton");
  if (likeButton) {
    if (localStorage.getItem(LIKE_STORAGE_KEY) === "true") {
      likeButton.classList.add("liked");
    }
    likeButton.addEventListener("click", () => {
      const liked = likeButton.classList.toggle("liked");
      localStorage.setItem(LIKE_STORAGE_KEY, liked);
    });
  }

  // Comments
  const commentModal = document.getElementById('commentModal');
  const commentButton = document.getElementById('commentButton');
  const submitComment = document.getElementById('submitComment');
  const cancelComment = document.getElementById('cancelComment');
  const commentName = document.getElementById('commentName');
  const commentText = document.getElementById('commentText');
  const commentList = document.getElementById('commentList');

  if (commentButton && commentModal) {
    commentButton.addEventListener('click', () => {
      commentModal.classList.remove('hidden');
    });
  }

  if (cancelComment && commentModal && commentName && commentText) {
    cancelComment.addEventListener('click', () => {
      commentModal.classList.add('hidden');
      commentName.value = '';
      commentText.value = '';
    });
  }

  if (submitComment && commentName && commentText && commentModal && commentList) {
    submitComment.addEventListener('click', async () => {
      const name = commentName.value.trim();
      const comment = commentText.value.trim();
      if (!name || !comment) {
        alert('Please fill in both name and comment!');
        return;
      }

      await addItem({ name, comment, articleId });
      appendCommentToDOM(name, comment);
      commentName.value = '';
      commentText.value = '';
      commentModal.classList.add('hidden');
    });

    window.addEventListener('DOMContentLoaded', async () => {
      try {
        const items = await getItems(articleId);
        items.forEach(({ name, comment }) => {
          appendCommentToDOM(name, comment);
        });
      } catch (error) {
        console.error('Error loading comments:', error);
      }
    });

    function appendCommentToDOM(name, comment) {
      const div = document.createElement('div');
      div.classList.add('comment-entry');
      div.innerHTML = `<strong>${escapeHtml(name)}</strong><p>${escapeHtml(comment)}</p>`;
      commentList.appendChild(div);
    }

    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
  }

  // Sidebar
  const sidebar = document.getElementById("sidebarSecondary");
  const toggleBtn = document.getElementById("sidebarToggle");

  if (sidebar && toggleBtn) {
    toggleBtn.setAttribute("aria-expanded", "false");

    toggleBtn.addEventListener("click", () => {
      const isVisible = sidebar.classList.toggle("sidebar-visible");
      sidebar.classList.toggle("sidebar-hidden", !isVisible);
      toggleBtn.setAttribute("aria-expanded", isVisible ? "true" : "false");
    });

    document.addEventListener("click", (event) => {
      if (!sidebar.contains(event.target) && !toggleBtn.contains(event.target)) {
        sidebar.classList.remove("sidebar-visible");
        sidebar.classList.add("sidebar-hidden");
        toggleBtn.setAttribute("aria-expanded", "false");
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        sidebar.classList.remove("sidebar-visible");
        sidebar.classList.add("sidebar-hidden");
        toggleBtn.setAttribute("aria-expanded", "false");
      }
    });
  }
});

// Login form submit handler
const loginForm = document.getElementById('loginForm');
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    await login(email, password);  // call your Firebase login function
    console.log("Login successful");
    // The onUserStateChanged listener will handle UI update after login
  } catch (error) {
    console.error("Login failed", error);
    alert("Login failed: " + error.message);
  }
});

// Logout buttons (admin and user)
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    logout();
  });
}

const logoutBtnUser = document.getElementById('logoutBtnUser');
if (logoutBtnUser) {
  logoutBtnUser.addEventListener('click', () => {
    logout();
  });
}
