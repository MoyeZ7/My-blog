const apiOrigin = window.localStorage.getItem("my-blog-api-origin") ?? "http://localhost:3001";
const tokenKey = "my-blog-admin-token";
const adminState = {
  q: "",
  category: "",
  editingSlug: null
};

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

function setCreatePostMessage(message, isError = false) {
  const node = document.querySelector("#create-post-message");
  node.textContent = message;
  node.classList.toggle("is-error", isError);
}

function setEditorMode(isEditing) {
  document.querySelector("#editor-mode-label").textContent = isEditing ? "内容编辑" : "内容创建";
  document.querySelector("#editor-title").textContent = isEditing ? "编辑文章" : "新建文章";
  document.querySelector("#cancel-edit-button").classList.toggle("is-hidden", !isEditing);
  document.querySelector("#create-post-form button[type='submit']").textContent = isEditing
    ? "保存更新"
    : "保存文章";
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

function renderPostCategoryOptions(items) {
  const root = document.querySelector("#post-category-select");
  const options = [
    '<option value="">全部分类</option>',
    ...items.map((item) => {
      const selected = adminState.category === item.name ? " selected" : "";
      return `<option value="${item.name}"${selected}>${item.name}</option>`;
    })
  ];

  root.innerHTML = options.join("");
}

function resetCreatePostForm() {
  document.querySelector("#create-post-form").reset();
  document.querySelector("#create-status-select").value = "published";
  adminState.editingSlug = null;
  setEditorMode(false);
}

function renderAdminPosts(items, total) {
  const root = document.querySelector("#post-admin-list");
  const template = document.querySelector("#post-row-template");
  document.querySelector("#post-list-summary").textContent = `共 ${total} 篇文章`;

  if (!items.length) {
    const empty = document.createElement("p");
    empty.className = "muted-text";
    empty.textContent = "当前筛选条件下没有文章。";
    root.replaceChildren(empty);
    return;
  }

  root.replaceChildren(
    ...items.map((item) => {
      const fragment = template.content.cloneNode(true);
      fragment.querySelector('[data-role="title"]').textContent = item.title;
      fragment.querySelector('[data-role="excerpt"]').textContent = item.excerpt;
      fragment.querySelector('[data-role="category"]').textContent = item.category;
      fragment.querySelector('[data-role="status"]').textContent = item.status;
      fragment.querySelector('[data-role="date"]').textContent = item.updatedAt;
      fragment.querySelector('[data-role="edit"]').dataset.slug = item.slug;
      return fragment;
    })
  );
}

function createPostQuery() {
  const params = new URLSearchParams();

  if (adminState.q) {
    params.set("q", adminState.q);
  }

  if (adminState.category) {
    params.set("category", adminState.category);
  }

  const query = params.toString();
  return query ? `?${query}` : "";
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
    renderPostCategoryOptions(data.summary.categories);
    showDashboard();
  } catch (error) {
    clearStoredToken();
    showLogin();
  }
}

async function loadAdminPosts() {
  const token = getStoredToken();

  if (!token) {
    return;
  }

  const data = await fetchJson(`/api/admin/posts${createPostQuery()}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  renderAdminPosts(data.items, data.total);
}

async function loadAdminPostDetail(slug) {
  const token = getStoredToken();

  if (!token) {
    return;
  }

  const data = await fetchJson(`/api/admin/posts/${encodeURIComponent(slug)}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  adminState.editingSlug = data.post.slug;
  document.querySelector("#create-title-input").value = data.post.title;
  document.querySelector("#create-category-input").value = data.post.category;
  document.querySelector("#create-status-select").value = data.post.status;
  document.querySelector("#create-excerpt-input").value = data.post.excerpt;
  document.querySelector("#create-tags-input").value = data.post.tags;
  document.querySelector("#create-cover-input").value = data.post.coverImage;
  document.querySelector("#create-content-input").value = data.post.content;
  setCreatePostMessage(`正在编辑：${data.post.title}`);
  setEditorMode(true);
  document.querySelector("#create-post-form").scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
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
      await loadAdminPosts();
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

function bindPostFilters() {
  document.querySelector("#post-filter-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    adminState.q = document.querySelector("#post-search-input").value.trim();
    adminState.category = document.querySelector("#post-category-select").value;
    await loadAdminPosts();
  });
}

function bindPostActions() {
  document.querySelector("#post-admin-list").addEventListener("click", async (event) => {
    const target = event.target;

    if (!(target instanceof HTMLElement)) {
      return;
    }

    if (target.dataset.role === "edit") {
      const slug = target.dataset.slug;

      if (!slug) {
        return;
      }

      try {
        await loadAdminPostDetail(slug);
      } catch (error) {
        setCreatePostMessage(error.message, true);
      }
      return;
    }

    if (target.dataset.role !== "delete") {
      return;
    }

    const slug = target.dataset.slug;

    if (!slug) {
      return;
    }

    try {
      const shouldDelete = window.confirm("确认删除这篇文章吗？该操作不可恢复。");

      if (!shouldDelete) {
        return;
      }

      const token = getStoredToken();

      if (!token) {
        setCreatePostMessage("请先登录后台。", true);
        return;
      }

      const result = await fetchJson(`/api/admin/posts/${encodeURIComponent(slug)}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (adminState.editingSlug === slug) {
        resetCreatePostForm();
      }

      setCreatePostMessage(`已删除文章：${result.post.title}`);
      await loadDashboard();
      await loadAdminPosts();
    } catch (error) {
      setCreatePostMessage(error.message, true);
    }
  });
}

function bindCreatePostForm() {
  document.querySelector("#create-post-form").addEventListener("submit", async (event) => {
    event.preventDefault();

    const token = getStoredToken();

    if (!token) {
      setCreatePostMessage("请先登录后台。", true);
      return;
    }

    const payload = {
      title: document.querySelector("#create-title-input").value.trim(),
      category: document.querySelector("#create-category-input").value.trim(),
      status: document.querySelector("#create-status-select").value,
      excerpt: document.querySelector("#create-excerpt-input").value.trim(),
      tags: document.querySelector("#create-tags-input").value.trim(),
      coverImage: document.querySelector("#create-cover-input").value.trim(),
      content: document.querySelector("#create-content-input").value.trim()
    };

    try {
      const isEditing = Boolean(adminState.editingSlug);
      const result = await fetchJson(
        isEditing ? `/api/admin/posts/${encodeURIComponent(adminState.editingSlug)}` : "/api/admin/posts",
        {
          method: isEditing ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        }
      );

      setCreatePostMessage(
        isEditing ? `已更新文章：${result.post.title}` : `已创建文章：${result.post.title}`
      );
      resetCreatePostForm();
      await loadDashboard();
      await loadAdminPosts();
    } catch (error) {
      setCreatePostMessage(error.message, true);
    }
  });
}

function bindEditorControls() {
  document.querySelector("#cancel-edit-button").addEventListener("click", () => {
    setCreatePostMessage("");
    resetCreatePostForm();
  });
}

bindLoginForm();
bindLogout();
bindPostFilters();
bindPostActions();
bindCreatePostForm();
bindEditorControls();

setEditorMode(false);

loadDashboard().then(loadAdminPosts);
