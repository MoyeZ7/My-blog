const apiOrigin = window.localStorage.getItem("my-blog-api-origin") ?? "http://localhost:3001";
const tokenKey = "my-blog-admin-token";

function getStoredToken() {
  return window.localStorage.getItem(tokenKey);
}

function setStoredToken(token) {
  window.localStorage.setItem(tokenKey, token);
}

function clearStoredToken() {
  window.localStorage.removeItem(tokenKey);
}

async function fetchJson(path, options = {}) {
  const response = await fetch(`${apiOrigin}${path}`, options);
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.message ?? `Request failed: ${response.status}`);
  }

  return payload;
}

function setMessage(message, isError = false) {
  const node = document.querySelector("#login-message");
  node.textContent = message;
  node.classList.toggle("is-error", isError);
}

function showDashboard() {
  document.querySelector("#login-view").classList.add("is-hidden");
  document.querySelector("#dashboard-view").classList.remove("is-hidden");
}

function showLogin() {
  document.querySelector("#dashboard-view").classList.add("is-hidden");
  document.querySelector("#login-view").classList.remove("is-hidden");
}

function renderStats(summary) {
  const root = document.querySelector("#stats-grid");
  const template = document.querySelector("#stat-card-template");
  const cards = [
    ["文章总数", summary.stats.postCount],
    ["分类数量", summary.stats.categoryCount],
    ["标签数量", summary.stats.tagCount]
  ];

  root.replaceChildren(
    ...cards.map(([label, value]) => {
      const fragment = template.content.cloneNode(true);
      fragment.querySelector('[data-role="label"]').textContent = label;
      fragment.querySelector('[data-role="value"]').textContent = String(value);
      return fragment;
    })
  );
}

function renderRecentPosts(items) {
  const root = document.querySelector("#recent-posts");
  root.replaceChildren(
    ...items.map((item) => {
      const card = document.createElement("article");
      card.className = "item-card";
      card.innerHTML = `
        <strong>${item.title}</strong>
        <span>${item.category} · ${item.readingTimeMinutes} 分钟阅读</span>
      `;
      return card;
    })
  );
}

function renderCategories(items) {
  const root = document.querySelector("#category-stats");
  root.replaceChildren(
    ...items.map((item) => {
      const card = document.createElement("article");
      card.className = "item-card";
      card.innerHTML = `
        <strong>${item.name}</strong>
        <span>${item.count} 篇文章</span>
      `;
      return card;
    })
  );
}

function renderTags(items) {
  const root = document.querySelector("#tag-list");
  root.replaceChildren(
    ...items.map((item) => {
      const tag = document.createElement("span");
      tag.className = "tag-pill";
      tag.textContent = `# ${item.name}`;
      return tag;
    })
  );
}

async function loadDashboard() {
  const token = getStoredToken();

  if (!token) {
    showLogin();
    return;
  }

  try {
    const data = await fetchJson("/api/admin/summary", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    document.querySelector("#session-note").textContent = `${data.session.displayName} 已登录`;
    renderStats(data.summary);
    renderRecentPosts(data.summary.recentPosts);
    renderCategories(data.summary.categories);
    renderTags(data.summary.tags);
    showDashboard();
  } catch (error) {
    clearStoredToken();
    showLogin();
  }
}

function bindLoginForm() {
  document.querySelector("#login-form").addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.querySelector("#username-input").value.trim();
    const password = document.querySelector("#password-input").value;

    try {
      const session = await fetchJson("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
      });

      setStoredToken(session.token);
      setMessage("登录成功，正在加载后台数据。");
      await loadDashboard();
    } catch (error) {
      setMessage(error.message, true);
    }
  });
}

function bindLogout() {
  document.querySelector("#logout-button").addEventListener("click", () => {
    clearStoredToken();
    setMessage("");
    showLogin();
  });
}

bindLoginForm();
bindLogout();
loadDashboard();
