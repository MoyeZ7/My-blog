const apiOrigin = window.localStorage.getItem("my-blog-api-origin") ?? "http://localhost:3001";
const state = {
  category: "",
  tag: "",
  q: ""
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

function renderSiteConfig(config) {
  document.title = config.brandName;
  document.querySelector("#site-brand").textContent = config.brandName;
  document.querySelector("#site-header-note").textContent = config.headerNote;
  document.querySelector("#hero-eyebrow").textContent = config.heroEyebrow;
  document.querySelector("#hero-title").textContent = config.heroTitle;
  document.querySelector("#hero-description").textContent = config.heroDescription;
  document.querySelector("#panel-eyebrow").textContent = config.panelEyebrow;
  document.querySelector("#panel-title").textContent = config.panelTitle;
  document.querySelector("#panel-description").textContent = config.panelDescription;
  document.querySelector("#feature-eyebrow").textContent = config.featureEyebrow;
  document.querySelector("#feature-title").textContent = config.featureTitle;
  document.querySelector("#feature-description").textContent = config.featureDescription;
}

function createFilterChip(label, onClick, variant = "") {
  const button = document.createElement("button");
  button.className = `filter-chip${variant ? ` ${variant}` : ""}`;
  button.type = "button";
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
}

function renderCategories(items) {
  const root = document.querySelector("#category-list");

  root.replaceChildren(
    createFilterChip("全部文章", () => {
      state.category = "";
      loadPosts();
      renderActiveFilters();
      renderCategories(items);
      void bootstrapSidebar();
    }, !state.category ? "is-active" : ""),
    ...items.map((item) => {
      return createFilterChip(
        `${item.name} (${item.count})`,
        () => {
          state.category = item.name;
          loadPosts();
          renderActiveFilters();
          renderCategories(items);
          void bootstrapSidebar();
        },
        state.category === item.name ? "is-active" : ""
      );
    })
  );
}

function renderTags(items) {
  const root = document.querySelector("#tag-list");

  root.replaceChildren(
    ...items.map((item) =>
      createFilterChip(
        `# ${item.name}`,
        () => {
          state.tag = state.tag === item.name ? "" : item.name;
          loadPosts();
          renderActiveFilters();
          renderTags(items);
          void bootstrapSidebar();
        },
        state.tag === item.name ? "is-active" : "is-soft"
      )
    )
  );
}

function renderStats(stats) {
  const root = document.querySelector("#stats-grid");
  const items = [
    ["文章", stats.postCount],
    ["分类", stats.categoryCount],
    ["标签", stats.tagCount]
  ];

  root.replaceChildren(
    ...items.map(([label, value]) => {
      const card = document.createElement("div");
      card.className = "stat-card";

      const number = document.createElement("strong");
      number.textContent = String(value);

      const text = document.createElement("span");
      text.textContent = label;

      card.append(number, text);
      return card;
    })
  );
}

function renderActiveFilters() {
  const root = document.querySelector("#active-filters");
  const items = [];

  if (state.q) {
    items.push(`搜索: ${state.q}`);
  }

  if (state.category) {
    items.push(`分类: ${state.category}`);
  }

  if (state.tag) {
    items.push(`标签: ${state.tag}`);
  }

  if (!items.length) {
    root.replaceChildren();
    return;
  }

  const summary = document.createElement("div");
  summary.className = "filter-summary";
  summary.textContent = items.join(" / ");

  const clearButton = createFilterChip("清空筛选", () => {
    state.q = "";
    state.category = "";
    state.tag = "";
    document.querySelector("#search-input").value = "";
    loadPosts();
    bootstrapSidebar();
    renderActiveFilters();
  });

  root.replaceChildren(summary, clearButton);
}

function renderPosts(items) {
  const list = document.querySelector("#post-list");
  const template = document.querySelector("#post-card-template");

  if (!items.length) {
    renderMessage("没有找到符合条件的文章，可以尝试切换分类、标签或搜索词。");
    return;
  }

  list.replaceChildren(
    ...items.map((item) => {
      const fragment = template.content.cloneNode(true);
      const image = fragment.querySelector(".post-card-image");
      const category = fragment.querySelector('[data-role="category"]');
      const date = fragment.querySelector('[data-role="date"]');
      const readingTime = fragment.querySelector('[data-role="reading-time"]');
      const title = fragment.querySelector('[data-role="title"]');
      const excerpt = fragment.querySelector('[data-role="excerpt"]');
      const link = fragment.querySelector('[data-role="link"]');
      const tags = fragment.querySelector('[data-role="tags"]');

      image.src = item.coverImage;
      image.alt = item.title;
      category.textContent = item.category;
      date.textContent = formatDate(item.publishedAt);
      readingTime.textContent = `${item.readingTimeMinutes} 分钟阅读`;
      title.textContent = item.title;
      excerpt.textContent = item.excerpt;
      link.href = `/post?slug=${encodeURIComponent(item.slug)}`;
      tags.replaceChildren(
        ...item.tags.map((tagName) =>
          createFilterChip(`# ${tagName}`, () => {
            state.tag = tagName;
            loadPosts();
            renderActiveFilters();
            void bootstrapSidebar();
          }, "is-soft")
        )
      );

      return fragment;
    })
  );
}

function renderMessage(message) {
  const list = document.querySelector("#post-list");
  const card = document.createElement("article");
  card.className = "post-card post-card-message";
  card.textContent = message;
  list.replaceChildren(card);
}

function createPostQuery() {
  const params = new URLSearchParams();

  if (state.category) {
    params.set("category", state.category);
  }

  if (state.tag) {
    params.set("tag", state.tag);
  }

  if (state.q) {
    params.set("q", state.q);
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}

async function loadPosts() {
  const search = createPostQuery();

  try {
    const data = await fetchJson(`/api/posts${search}`);
    renderPosts(data.items);
  } catch (error) {
    renderMessage("文章暂时无法加载，请先启动 API 服务后再刷新页面。");
  }
}

async function bootstrapSidebar() {
  const [categories, tags, stats] = await Promise.all([
    fetchJson("/api/categories"),
    fetchJson("/api/tags"),
    fetchJson("/api/stats")
  ]);

  renderCategories(categories.items);
  renderTags(tags.items);
  renderStats(stats);
}

async function loadSiteConfig() {
  const config = await fetchJson("/api/site-config");
  renderSiteConfig(config);
}

function bindSearch() {
  const form = document.querySelector("#search-form");
  const input = document.querySelector("#search-input");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    state.q = input.value.trim();
    loadPosts();
    renderActiveFilters();
  });
}

async function bootstrap() {
  bindSearch();

  try {
    await Promise.all([bootstrapSidebar(), loadPosts(), loadSiteConfig()]);
    renderActiveFilters();
  } catch (error) {
    renderMessage("页面已经加载，但当前无法连接到博客 API。");
  }
}

bootstrap();
