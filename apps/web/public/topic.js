const apiOrigin = window.localStorage.getItem("my-blog-api-origin") ?? "http://localhost:3001";
const state = {
  brandName: "我的博客",
  mode: window.location.pathname === "/tag" ? "tag" : "category",
  name: "",
  page: 1,
  pageSize: 3
};

function formatDate(value) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(new Date(value));
}

async function fetchJson(path) {
  const response = await fetch(`${apiOrigin}${path}`);

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
}

function createFilterChip(label, onClick, variant = "") {
  const button = document.createElement("button");
  button.className = `filter-chip${variant ? ` ${variant}` : ""}`;
  button.type = "button";
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
}

function createPagerButton(label, onClick, disabled = false) {
  const button = document.createElement("button");
  button.className = "page-button";
  button.type = "button";
  button.textContent = label;
  button.disabled = disabled;
  button.addEventListener("click", onClick);
  return button;
}

function getModeLabel() {
  return state.mode === "tag" ? "标签" : "分类";
}

function buildTopicUrl(name, page = 1) {
  const params = new URLSearchParams();

  if (name) {
    params.set("name", name);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const search = params.toString();
  return search ? `/${state.mode}?${search}` : `/${state.mode}`;
}

function updateUrl() {
  window.history.replaceState({}, "", buildTopicUrl(state.name, state.page));
}

function renderSiteBrand(config) {
  state.brandName = config.brandName;
  document.querySelector("#site-brand").textContent = config.brandName;
}

function renderTopicHero(pagination, topicExists) {
  const modeLabel = getModeLabel();
  const title = document.querySelector("#topic-title");
  const description = document.querySelector("#topic-description");
  const summary = document.querySelector("#topic-feed-summary");
  const eyebrow = document.querySelector("#topic-eyebrow");
  const sectionEyebrow = document.querySelector("#topic-section-eyebrow");
  const sectionTitle = document.querySelector("#topic-section-title");
  const filterEyebrow = document.querySelector("#topic-filter-eyebrow");
  const filterTitle = document.querySelector("#topic-filter-title");
  const noteTitle = document.querySelector("#topic-note-title");
  const note = document.querySelector("#topic-note");

  eyebrow.textContent = `${modeLabel}专题`;
  sectionEyebrow.textContent = `${modeLabel}内容`;
  sectionTitle.textContent = `该${modeLabel}下的公开文章`;
  filterEyebrow.textContent = `${modeLabel}索引`;
  filterTitle.textContent = `切换${modeLabel}`;
  noteTitle.textContent = state.mode === "tag" ? "沿着同一关键词继续阅读" : "沿着同一栏目继续阅读";
  note.textContent =
    state.mode === "tag"
      ? "标签专题页适合围绕一个更细的关键词追踪内容，比如“前端”“工作流”或“内容策略”。"
      : "分类专题页适合围绕一个更稳定的主题继续阅读，比如“设计”“架构”或“后端”。";

  if (!state.name) {
    title.textContent = `按${modeLabel}继续阅读`;
    description.textContent = `这里会围绕单个${modeLabel}集中展示相关文章，帮助你沿着一个清晰主题继续浏览。`;
    summary.textContent = "";
    document.title = `${state.brandName} | ${modeLabel}专题`;
    return;
  }

  if (!topicExists) {
    title.textContent = `未找到该${modeLabel}专题`;
    description.textContent = `当前没有名为“${state.name}”的${modeLabel}，可以切换到其他${modeLabel}继续浏览。`;
    summary.textContent = "";
    document.title = `${state.brandName} | 未找到${modeLabel}`;
    return;
  }

  title.textContent = `${state.name} · ${modeLabel}专题`;
  description.textContent =
    state.mode === "tag"
      ? "这个专题聚合同一关键词下的公开文章，适合快速形成一个更集中的阅读路径。"
      : "这个专题聚合同一分类下的公开文章，适合在一个稳定主题里连续阅读。";

  if (pagination.totalItems === 0) {
    summary.textContent = `当前${modeLabel}下还没有公开文章。`;
  } else {
    summary.textContent = `当前共 ${pagination.totalItems} 篇文章，第 ${pagination.page} / ${pagination.totalPages} 页。`;
  }

  document.title = `${state.brandName} | ${state.name}${modeLabel}专题`;
}

function renderFilters(items) {
  const root = document.querySelector("#topic-filter-list");

  root.replaceChildren(
    ...items.map((item) =>
      createFilterChip(
        `${item.name} (${item.count})`,
        () => {
          state.name = item.name;
          state.page = 1;
          updateUrl();
          void loadTopicPosts(items);
          renderFilters(items);
        },
        state.name === item.name ? "is-active" : ""
      )
    )
  );
}

function createTagLink(tagName) {
  const link = document.createElement("a");
  link.className = "filter-chip is-soft";
  link.href = `/tag?name=${encodeURIComponent(tagName)}`;
  link.textContent = `# ${tagName}`;
  return link;
}

function renderPosts(items) {
  const list = document.querySelector("#topic-post-list");
  const template = document.querySelector("#topic-post-card-template");

  if (!items.length) {
    const empty = document.createElement("article");
    empty.className = "post-card post-card-message";
    empty.textContent = `当前${getModeLabel()}下没有公开文章，可以切换到其他专题继续浏览。`;
    list.replaceChildren(empty);
    return;
  }

  list.replaceChildren(
    ...items.map((item) => {
      const fragment = template.content.cloneNode(true);
      const image = fragment.querySelector(".post-card-image");
      const pinBadge = fragment.querySelector('[data-role="pin-badge"]');
      const category = fragment.querySelector('[data-role="category"]');
      const date = fragment.querySelector('[data-role="date"]');
      const readingTime = fragment.querySelector('[data-role="reading-time"]');
      const title = fragment.querySelector('[data-role="title"]');
      const excerpt = fragment.querySelector('[data-role="excerpt"]');
      const link = fragment.querySelector('[data-role="link"]');
      const tags = fragment.querySelector('[data-role="tags"]');

      image.src = item.coverImage;
      image.alt = item.title;
      pinBadge.classList.toggle("is-hidden", item.isPinned !== true);
      category.textContent = item.category;
      category.href = `/category?name=${encodeURIComponent(item.category)}`;
      date.textContent = formatDate(item.publishedAt);
      readingTime.textContent = `${item.readingTimeMinutes} 分钟阅读`;
      title.textContent = item.title;
      excerpt.textContent = item.excerpt;
      link.href = `/post?slug=${encodeURIComponent(item.slug)}`;
      tags.replaceChildren(...item.tags.map(createTagLink));

      return fragment;
    })
  );
}

function renderPagination(pagination, items = []) {
  const root = document.querySelector("#topic-pagination");

  if (!pagination || pagination.totalItems === 0 || !items.length) {
    root.replaceChildren();
    return;
  }

  const meta = document.createElement("p");
  meta.className = "pagination-meta";
  meta.textContent = `每页 ${pagination.pageSize} 篇，本页显示第 ${pagination.page} 页。`;

  const actions = document.createElement("div");
  actions.className = "pagination-actions";
  actions.append(
    createPagerButton("上一页", () => {
      state.page = Math.max(1, pagination.page - 1);
      updateUrl();
      void loadTopicPosts(items);
    }, !pagination.hasPreviousPage),
    createPagerButton("下一页", () => {
      state.page = pagination.page + 1;
      updateUrl();
      void loadTopicPosts(items);
    }, !pagination.hasNextPage)
  );

  root.replaceChildren(meta, actions);
}

async function loadTopicPosts(items) {
  const topicExists = items.some((item) => item.name === state.name);

  if (!state.name || !topicExists) {
    renderTopicHero(
      {
        totalItems: 0,
        page: 1,
        totalPages: 1
      },
      topicExists
    );
    renderPosts([]);
    renderPagination();
    return;
  }

  const params = new URLSearchParams({
    page: String(state.page),
    pageSize: String(state.pageSize)
  });

  params.set(state.mode, state.name);
  const data = await fetchJson(`/api/posts?${params.toString()}`);
  state.page = data.pagination?.page ?? 1;
  renderTopicHero(data.pagination, true);
  renderPosts(data.items ?? []);
  renderPagination(data.pagination, items);
}

async function bootstrap() {
  const params = new URLSearchParams(window.location.search);
  state.name = params.get("name") ?? "";
  state.page = Number.parseInt(params.get("page") ?? "1", 10) || 1;

  try {
    const [config, topicData] = await Promise.all([
      fetchJson("/api/site-config"),
      fetchJson(state.mode === "tag" ? "/api/tags" : "/api/categories")
    ]);

    renderSiteBrand(config);

    const items = topicData.items ?? [];

    if (!state.name && items.length) {
      state.name = items[0].name;
      updateUrl();
    }

    renderFilters(items);
    await loadTopicPosts(items);
  } catch (error) {
    document.querySelector("#topic-title").textContent = "专题页暂时不可用";
    document.querySelector("#topic-description").textContent = "当前无法连接到博客 API，请稍后刷新再试。";
    document.querySelector("#topic-feed-summary").textContent = "";
    renderPosts([]);
    renderPagination();
  }
}

bootstrap();
