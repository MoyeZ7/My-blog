const apiOrigin = window.localStorage.getItem("my-blog-api-origin") ?? "http://localhost:3001";
const tokenKey = "my-blog-admin-token";
const adminState = {
  coverQuery: "",
  q: "",
  category: "",
  categoryAdminQuery: "",
  editingSlug: null,
  commentQuery: "",
  commentStatus: "",
  tagQuery: ""
};
const coverLibraryState = {
  defaultCoverImage: "",
  items: []
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

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => {
      const result = String(reader.result ?? "");
      const [, contentBase64 = ""] = result.split(",", 2);
      resolve(contentBase64);
    });

    reader.addEventListener("error", () => {
      reject(new Error("图片读取失败，请重新选择文件"));
    });

    reader.readAsDataURL(file);
  });
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

function setSiteConfigMessage(message, isError = false) {
  const node = document.querySelector("#site-config-message");
  node.textContent = message;
  node.classList.toggle("is-error", isError);
}

function setTagMessage(message, isError = false) {
  const node = document.querySelector("#tag-message");
  node.textContent = message;
  node.classList.toggle("is-error", isError);
}

function setCategoryMessage(message, isError = false) {
  const node = document.querySelector("#category-message");
  node.textContent = message;
  node.classList.toggle("is-error", isError);
}

function setCoverUploadMessage(message, isError = false) {
  const node = document.querySelector("#cover-upload-message");
  node.textContent = message;
  node.classList.toggle("is-error", isError);
}

function getEffectiveCoverImage() {
  return document.querySelector("#create-cover-input").value.trim() || coverLibraryState.defaultCoverImage;
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

function renderCoverPreview() {
  const image = document.querySelector("#cover-preview-image");
  const title = document.querySelector("#cover-preview-title");
  const note = document.querySelector("#cover-preview-note");
  const activeUrl = getEffectiveCoverImage();
  const activeItem = coverLibraryState.items.find((item) => item.url === activeUrl);

  image.src = activeUrl;
  image.alt = activeItem?.title ?? "当前封面预览";

  if (activeItem) {
    title.textContent = activeItem.title;
    note.textContent = `${activeItem.source} · ${activeItem.description}`;
    return;
  }

  if (document.querySelector("#create-cover-input").value.trim()) {
    title.textContent = "自定义封面链接";
    note.textContent = "当前使用的是手动输入的封面地址。";
    return;
  }

  title.textContent = "系统默认封面";
  note.textContent = "未填写封面地址时，会自动使用系统默认封面。";
}

function createCoverOptionCard(item) {
  const card = document.createElement("article");
  const isActive = getEffectiveCoverImage() === item.url;
  card.className = `cover-option-card${isActive ? " is-active" : ""}`;

  const image = document.createElement("img");
  image.className = "cover-option-image";
  image.src = item.url;
  image.alt = item.title;

  const head = document.createElement("div");
  head.className = "cover-option-head";

  const title = document.createElement("strong");
  title.textContent = item.title;

  const meta = document.createElement("p");
  meta.className = "cover-option-meta";
  meta.textContent = `${item.source} · 已使用 ${item.usageCount} 次`;

  const description = document.createElement("p");
  description.className = "muted-text";
  description.textContent = item.description;

  const actions = document.createElement("div");
  actions.className = "cover-option-actions";

  const button = document.createElement("button");
  button.className = "secondary-button";
  button.type = "button";
  button.dataset.role = "select-cover";
  button.dataset.url = item.url;
  button.textContent = isActive ? "当前已选" : "使用这张";

  head.append(title, meta);
  actions.append(button);
  card.append(image, head, description, actions);
  return card;
}

function renderAdminCoverOptions(items, total) {
  coverLibraryState.items = items;
  const root = document.querySelector("#cover-library-list");
  document.querySelector("#cover-library-summary").textContent = `共 ${total} 张可选封面`;

  if (!items.length) {
    const empty = document.createElement("p");
    empty.className = "muted-text";
    empty.textContent = "没有找到符合条件的封面。";
    root.replaceChildren(empty);
    renderCoverPreview();
    return;
  }

  root.replaceChildren(...items.map(createCoverOptionCard));
  renderCoverPreview();
}

function resetCreatePostForm() {
  document.querySelector("#create-post-form").reset();
  document.querySelector("#cover-upload-input").value = "";
  document.querySelector("#create-status-select").value = "published";
  adminState.editingSlug = null;
  setEditorMode(false);
  setCoverUploadMessage("");
  renderCoverPreview();
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

function renderAdminComments(items, total) {
  const root = document.querySelector("#comment-admin-list");
  const template = document.querySelector("#comment-row-template");
  document.querySelector("#comment-list-summary").textContent = `共 ${total} 条评论`;

  if (!items.length) {
    const empty = document.createElement("p");
    empty.className = "muted-text";
    empty.textContent = "当前筛选条件下没有评论。";
    root.replaceChildren(empty);
    return;
  }

  root.replaceChildren(
    ...items.map((item) => {
      const fragment = template.content.cloneNode(true);
      fragment.querySelector('[data-role="author"]').textContent = item.author;
      fragment.querySelector('[data-role="status"]').textContent = item.status;
      fragment.querySelector('[data-role="content"]').textContent = item.content;
      fragment.querySelector('[data-role="post-title"]').textContent = item.postTitle;
      fragment.querySelector('[data-role="date"]').textContent = item.createdAt;
      fragment.querySelector('[data-role="approve"]').dataset.id = String(item.id);
      fragment.querySelector('[data-role="reject"]').dataset.id = String(item.id);
      return fragment;
    })
  );
}

function renderAdminTags(items, total) {
  const root = document.querySelector("#tag-admin-list");
  const template = document.querySelector("#tag-row-template");
  document.querySelector("#tag-list-summary").textContent = `共 ${total} 个标签`;

  if (!items.length) {
    const empty = document.createElement("p");
    empty.className = "muted-text";
    empty.textContent = "当前筛选条件下没有标签。";
    root.replaceChildren(empty);
    return;
  }

  root.replaceChildren(
    ...items.map((item) => {
      const fragment = template.content.cloneNode(true);
      fragment.querySelector('[data-role="name"]').textContent = item.name;
      fragment.querySelector('[data-role="count"]').textContent = `${item.postCount} 篇文章`;
      fragment.querySelector('[data-role="related-posts"]').textContent = item.relatedPosts.join(" / ");
      fragment.querySelector('[data-role="rename"]').dataset.name = item.name;
      fragment.querySelector('[data-role="delete"]').dataset.name = item.name;
      return fragment;
    })
  );
}

function renderAdminCategoriesList(items, total) {
  const root = document.querySelector("#category-admin-list");
  const template = document.querySelector("#category-row-template");
  document.querySelector("#category-admin-summary").textContent = `共 ${total} 个分类`;

  if (!items.length) {
    const empty = document.createElement("p");
    empty.className = "muted-text";
    empty.textContent = "当前筛选条件下没有分类。";
    root.replaceChildren(empty);
    return;
  }

  root.replaceChildren(
    ...items.map((item) => {
      const fragment = template.content.cloneNode(true);
      fragment.querySelector('[data-role="name"]').textContent = item.name;
      fragment.querySelector('[data-role="count"]').textContent = `${item.postCount} 篇文章`;
      fragment.querySelector('[data-role="related-posts"]').textContent = item.relatedPosts.join(" / ");
      fragment.querySelector('[data-role="rename"]').dataset.name = item.name;
      fragment.querySelector('[data-role="delete"]').dataset.name = item.name;
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

function createCommentQuery() {
  const params = new URLSearchParams();

  if (adminState.commentQuery) {
    params.set("q", adminState.commentQuery);
  }

  if (adminState.commentStatus) {
    params.set("status", adminState.commentStatus);
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}

function createTagQuery() {
  const params = new URLSearchParams();

  if (adminState.tagQuery) {
    params.set("q", adminState.tagQuery);
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}

function createCategoryAdminQuery() {
  const params = new URLSearchParams();

  if (adminState.categoryAdminQuery) {
    params.set("q", adminState.categoryAdminQuery);
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}

function createCoverQuery() {
  const params = new URLSearchParams();

  if (adminState.coverQuery) {
    params.set("q", adminState.coverQuery);
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
  renderCoverPreview();
  setCreatePostMessage(`正在编辑：${data.post.title}`);
  setEditorMode(true);
  document.querySelector("#create-post-form").scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

async function loadAdminComments() {
  const token = getStoredToken();

  if (!token) {
    return;
  }

  const data = await fetchJson(`/api/admin/comments${createCommentQuery()}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  renderAdminComments(data.items, data.total);
}

async function loadAdminSiteConfig() {
  const token = getStoredToken();

  if (!token) {
    return;
  }

  const data = await fetchJson("/api/admin/site-config", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  document.querySelector("#site-brand-input").value = data.config.brandName;
  document.querySelector("#site-header-note-input").value = data.config.headerNote;
  document.querySelector("#site-hero-eyebrow-input").value = data.config.heroEyebrow;
  document.querySelector("#site-hero-title-input").value = data.config.heroTitle;
  document.querySelector("#site-hero-description-input").value = data.config.heroDescription;
  document.querySelector("#site-panel-eyebrow-input").value = data.config.panelEyebrow;
  document.querySelector("#site-panel-title-input").value = data.config.panelTitle;
  document.querySelector("#site-panel-description-input").value = data.config.panelDescription;
  document.querySelector("#site-feature-eyebrow-input").value = data.config.featureEyebrow;
  document.querySelector("#site-feature-title-input").value = data.config.featureTitle;
  document.querySelector("#site-feature-description-input").value = data.config.featureDescription;
  document.querySelector("#site-config-summary").textContent = `最近更新：${data.config.updatedAt}`;
}

async function loadAdminTags() {
  const token = getStoredToken();

  if (!token) {
    return;
  }

  const data = await fetchJson(`/api/admin/tags${createTagQuery()}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  renderAdminTags(data.items, data.total);
}

async function loadAdminCategoriesList() {
  const token = getStoredToken();

  if (!token) {
    return;
  }

  const data = await fetchJson(`/api/admin/categories${createCategoryAdminQuery()}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  renderAdminCategoriesList(data.items, data.total);
}

async function loadAdminCovers() {
  const token = getStoredToken();

  if (!token) {
    return;
  }

  const data = await fetchJson(`/api/admin/covers${createCoverQuery()}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  coverLibraryState.defaultCoverImage = data.defaultCoverImage;
  renderAdminCoverOptions(data.items, data.total);
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
      await loadAdminComments();
      await loadAdminSiteConfig();
      await loadAdminTags();
      await loadAdminCategoriesList();
      await loadAdminCovers();
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

function bindCommentFilters() {
  document.querySelector("#comment-filter-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    adminState.commentQuery = document.querySelector("#comment-search-input").value.trim();
    adminState.commentStatus = document.querySelector("#comment-status-select").value;
    await loadAdminComments();
  });
}

function bindTagFilters() {
  document.querySelector("#tag-filter-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    adminState.tagQuery = document.querySelector("#tag-search-input").value.trim();
    await loadAdminTags();
  });
}

function bindCategoryAdminFilters() {
  document.querySelector("#category-admin-filter-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    adminState.categoryAdminQuery = document.querySelector("#category-admin-search-input").value.trim();
    await loadAdminCategoriesList();
  });
}

function bindCoverFilters() {
  document.querySelector("#cover-filter-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    adminState.coverQuery = document.querySelector("#cover-search-input").value.trim();
    await loadAdminCovers();
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
      await loadAdminTags();
      await loadAdminCategoriesList();
      await loadAdminCovers();
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
      await loadAdminComments();
      await loadAdminTags();
      await loadAdminCategoriesList();
      await loadAdminCovers();
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

function bindCoverPreview() {
  document.querySelector("#create-cover-input").addEventListener("input", () => {
    renderCoverPreview();
  });

  document.querySelector("#apply-default-cover-button").addEventListener("click", () => {
    document.querySelector("#create-cover-input").value = "";
    renderCoverPreview();
  });

  document.querySelector("#open-cover-link-button").addEventListener("click", () => {
    const coverImage = getEffectiveCoverImage();

    if (!coverImage) {
      return;
    }

    window.open(coverImage, "_blank", "noopener,noreferrer");
  });
}

function bindCoverActions() {
  document.querySelector("#cover-library-list").addEventListener("click", (event) => {
    const target = event.target;

    if (!(target instanceof HTMLElement) || target.dataset.role !== "select-cover") {
      return;
    }

    const url = target.dataset.url;

    if (!url) {
      return;
    }

    document.querySelector("#create-cover-input").value = url;
    renderAdminCoverOptions(coverLibraryState.items, coverLibraryState.items.length);
    setCreatePostMessage("封面已填入表单，可以继续编辑并保存。");
  });
}

function bindCoverUploadForm() {
  document.querySelector("#cover-upload-form").addEventListener("submit", async (event) => {
    event.preventDefault();

    const token = getStoredToken();

    if (!token) {
      setCoverUploadMessage("请先登录后台。", true);
      return;
    }

    const input = document.querySelector("#cover-upload-input");
    const submitButton = document.querySelector("#upload-cover-button");
    const [file] = input.files ?? [];

    if (!file) {
      setCoverUploadMessage("请先选择一张图片。", true);
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "上传中...";

    try {
      const contentBase64 = await readFileAsBase64(file);
      const result = await fetchJson("/api/admin/uploads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type,
          contentBase64
        })
      });

      document.querySelector("#create-cover-input").value = result.asset.url;
      input.value = "";
      setCoverUploadMessage(`图片已上传：${result.asset.fileName}`);
      setCreatePostMessage("封面已上传并填入表单，可以继续保存文章。");
      await loadAdminCovers();
    } catch (error) {
      setCoverUploadMessage(error.message, true);
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "上传并使用";
    }
  });
}

function bindCommentActions() {
  document.querySelector("#comment-admin-list").addEventListener("click", async (event) => {
    const target = event.target;

    if (!(target instanceof HTMLElement)) {
      return;
    }

    const action = target.dataset.role;

    if (action !== "approve" && action !== "reject") {
      return;
    }

    const id = target.dataset.id;

    if (!id) {
      return;
    }

    const token = getStoredToken();

    if (!token) {
      setCreatePostMessage("请先登录后台。", true);
      return;
    }

    const status = action === "approve" ? "approved" : "rejected";

    try {
      const result = await fetchJson(`/api/admin/comments/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      setCreatePostMessage(`评论状态已更新为：${result.comment.status}`);
      await loadDashboard();
      await loadAdminComments();
    } catch (error) {
      setCreatePostMessage(error.message, true);
    }
  });
}

function bindSiteConfigForm() {
  document.querySelector("#site-config-form").addEventListener("submit", async (event) => {
    event.preventDefault();

    const token = getStoredToken();

    if (!token) {
      setSiteConfigMessage("请先登录后台。", true);
      return;
    }

    const payload = {
      brandName: document.querySelector("#site-brand-input").value.trim(),
      headerNote: document.querySelector("#site-header-note-input").value.trim(),
      heroEyebrow: document.querySelector("#site-hero-eyebrow-input").value.trim(),
      heroTitle: document.querySelector("#site-hero-title-input").value.trim(),
      heroDescription: document.querySelector("#site-hero-description-input").value.trim(),
      panelEyebrow: document.querySelector("#site-panel-eyebrow-input").value.trim(),
      panelTitle: document.querySelector("#site-panel-title-input").value.trim(),
      panelDescription: document.querySelector("#site-panel-description-input").value.trim(),
      featureEyebrow: document.querySelector("#site-feature-eyebrow-input").value.trim(),
      featureTitle: document.querySelector("#site-feature-title-input").value.trim(),
      featureDescription: document.querySelector("#site-feature-description-input").value.trim()
    };

    try {
      const result = await fetchJson("/api/admin/site-config", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      setSiteConfigMessage(`站点配置已更新：${result.config.brandName}`);
      document.querySelector("#site-config-summary").textContent = `最近更新：${result.config.updatedAt}`;
      await loadAdminSiteConfig();
    } catch (error) {
      setSiteConfigMessage(error.message, true);
    }
  });
}

function bindTagRenameForm() {
  document.querySelector("#tag-rename-form").addEventListener("submit", async (event) => {
    event.preventDefault();

    const token = getStoredToken();

    if (!token) {
      setTagMessage("请先登录后台。", true);
      return;
    }

    const currentName = document.querySelector("#tag-current-name-input").value.trim();
    const nextName = document.querySelector("#tag-next-name-input").value.trim();

    try {
      const result = await fetchJson("/api/admin/tags", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ currentName, nextName })
      });

      document.querySelector("#tag-current-name-input").value = result.tag.name;
      document.querySelector("#tag-next-name-input").value = "";
      setTagMessage(`标签已重命名为：${result.tag.name}`);
      await loadDashboard();
      await loadAdminTags();
    } catch (error) {
      setTagMessage(error.message, true);
    }
  });
}

function bindTagActions() {
  document.querySelector("#tag-admin-list").addEventListener("click", async (event) => {
    const target = event.target;

    if (!(target instanceof HTMLElement)) {
      return;
    }

    const action = target.dataset.role;
    const name = target.dataset.name;

    if (!name) {
      return;
    }

    if (action === "rename") {
      document.querySelector("#tag-current-name-input").value = name;
      document.querySelector("#tag-next-name-input").value = name;
      setTagMessage(`正在准备重命名标签：${name}`);
      document.querySelector("#tag-next-name-input").focus();
      document.querySelector("#tag-next-name-input").select();
      return;
    }

    if (action !== "delete") {
      return;
    }

    const token = getStoredToken();

    if (!token) {
      setTagMessage("请先登录后台。", true);
      return;
    }

    try {
      const shouldDelete = window.confirm(`确认删除标签“${name}”吗？`);

      if (!shouldDelete) {
        return;
      }

      const result = await fetchJson("/api/admin/tags", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name })
      });

      if (document.querySelector("#tag-current-name-input").value.trim() === name) {
        document.querySelector("#tag-current-name-input").value = "";
        document.querySelector("#tag-next-name-input").value = "";
      }

      setTagMessage(`标签已删除：${result.tag.name}`);
      await loadDashboard();
      await loadAdminTags();
    } catch (error) {
      setTagMessage(error.message, true);
    }
  });
}

function bindCategoryRenameForm() {
  document.querySelector("#category-rename-form").addEventListener("submit", async (event) => {
    event.preventDefault();

    const token = getStoredToken();

    if (!token) {
      setCategoryMessage("请先登录后台。", true);
      return;
    }

    const currentName = document.querySelector("#category-current-name-input").value.trim();
    const nextName = document.querySelector("#category-next-name-input").value.trim();

    try {
      const result = await fetchJson("/api/admin/categories", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ currentName, nextName })
      });

      if (adminState.category === currentName) {
        adminState.category = result.category.name;
      }

      document.querySelector("#category-current-name-input").value = result.category.name;
      document.querySelector("#category-next-name-input").value = "";
      setCategoryMessage(`分类已更新为：${result.category.name}`);
      await loadDashboard();
      await loadAdminPosts();
      await loadAdminCategoriesList();
    } catch (error) {
      setCategoryMessage(error.message, true);
    }
  });
}

function bindCategoryActions() {
  document.querySelector("#category-admin-list").addEventListener("click", async (event) => {
    const target = event.target;

    if (!(target instanceof HTMLElement)) {
      return;
    }

    const action = target.dataset.role;
    const name = target.dataset.name;

    if (!name) {
      return;
    }

    if (action === "rename") {
      document.querySelector("#category-current-name-input").value = name;
      document.querySelector("#category-next-name-input").value = name;
      setCategoryMessage(`正在准备重命名分类：${name}`);
      document.querySelector("#category-next-name-input").focus();
      document.querySelector("#category-next-name-input").select();
      return;
    }

    if (action !== "delete") {
      return;
    }

    const token = getStoredToken();

    if (!token) {
      setCategoryMessage("请先登录后台。", true);
      return;
    }

    const replacementName = window.prompt(
      `删除分类“${name}”前，需要输入迁移目标分类。相关文章会被移动到这个分类。`,
      ""
    );

    if (replacementName === null) {
      return;
    }

    try {
      const result = await fetchJson("/api/admin/categories", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name, replacementName: replacementName.trim() })
      });

      if (adminState.category === name) {
        adminState.category = result.category.replacementName;
      }

      if (document.querySelector("#category-current-name-input").value.trim() === name) {
        document.querySelector("#category-current-name-input").value = "";
        document.querySelector("#category-next-name-input").value = "";
      }

      setCategoryMessage(
        `分类已删除：${result.category.name}，并迁移到 ${result.category.replacementName}`
      );
      await loadDashboard();
      await loadAdminPosts();
      await loadAdminCategoriesList();
    } catch (error) {
      setCategoryMessage(error.message, true);
    }
  });
}

bindLoginForm();
bindLogout();
bindPostFilters();
bindCommentFilters();
bindTagFilters();
bindCategoryAdminFilters();
bindCoverFilters();
bindPostActions();
bindCreatePostForm();
bindEditorControls();
bindCoverPreview();
bindCoverActions();
bindCoverUploadForm();
bindCommentActions();
bindSiteConfigForm();
bindTagRenameForm();
bindTagActions();
bindCategoryRenameForm();
bindCategoryActions();

setEditorMode(false);

loadDashboard().then(async () => {
  await loadAdminPosts();
  await loadAdminComments();
  await loadAdminSiteConfig();
  await loadAdminTags();
  await loadAdminCategoriesList();
  await loadAdminCovers();
});
