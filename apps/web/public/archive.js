const apiOrigin = window.localStorage.getItem("my-blog-api-origin") ?? "http://localhost:3001";
const state = {
  archive: "",
  archiveLabel: "",
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

function updateUrl() {
  const params = new URLSearchParams();

  if (state.archive) {
    params.set("archive", state.archive);
  }

  if (state.page > 1) {
    params.set("page", String(state.page));
  }

  const search = params.toString();
  const nextUrl = search ? `/archive?${search}` : "/archive";
  window.history.replaceState({}, "", nextUrl);
}

function renderSiteBrand(config) {
  document.querySelector("#site-brand").textContent = config.brandName;
}

function renderArchiveHero(pagination) {
  const title = document.querySelector("#archive-title");
  const description = document.querySelector("#archive-description");
  const summary = document.querySelector("#archive-feed-summary");

  if (!state.archive) {
    title.textContent = "按月份回看内容更新";
    description.textContent = "这里会按月份整理公开文章，方便从时间维度回看这个博客是如何一步步构建出来的。";
    summary.textContent = "";
    document.title = "我的博客 | 归档";
    return;
  }

  title.textContent = `${state.archiveLabel} 归档`;
  description.textContent = "同一个月份里的公开文章会集中出现在这里，适合按时间线回看内容更新。";

  if (pagination.totalItems === 0) {
    summary.textContent = "这个月份暂时还没有公开文章。";
  } else {
    summary.textContent = `当前共 ${pagination.totalItems} 篇文章，第 ${pagination.page} / ${pagination.totalPages} 页。`;
  }

  document.title = `我的博客 | ${state.archiveLabel} 归档`;
}

function renderArchives(items) {
  const root = document.querySelector("#archive-filter-list");

  root.replaceChildren(
    ...items.map((item) =>
      createFilterChip(
        `${item.label} (${item.count})`,
        () => {
          state.archive = item.key;
          state.archiveLabel = item.label;
          state.page = 1;
          updateUrl();
          void loadArchivePosts();
          renderArchives(items);
        },
        state.archive === item.key ? "is-active" : ""
      )
    )
  );
}

function renderPosts(items) {
  const list = document.querySelector("#archive-post-list");
  const template = document.querySelector("#archive-post-card-template");

  if (!items.length) {
    const empty = document.createElement("article");
    empty.className = "post-card post-card-message";
    empty.textContent = "当前月份没有公开文章，可以切换到其他月份继续浏览。";
    list.replaceChildren(empty);
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
        ...item.tags.map((tagName) => {
          const node = document.createElement("span");
          node.className = "inline-tag";
          node.textContent = `# ${tagName}`;
          return node;
        })
      );

      return fragment;
    })
  );
}

function renderPagination(pagination) {
  const root = document.querySelector("#archive-pagination");

  if (!pagination || pagination.totalItems === 0) {
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
      void loadArchivePosts();
    }, !pagination.hasPreviousPage),
    createPagerButton("下一页", () => {
      state.page = pagination.page + 1;
      updateUrl();
      void loadArchivePosts();
    }, !pagination.hasNextPage)
  );

  root.replaceChildren(meta, actions);
}

async function loadArchivePosts() {
  if (!state.archive) {
    renderArchiveHero({
      totalItems: 0,
      page: 1,
      totalPages: 1
    });
    renderPosts([]);
    renderPagination();
    return;
  }

  const params = new URLSearchParams({
    archive: state.archive,
    page: String(state.page),
    pageSize: String(state.pageSize)
  });
  const data = await fetchJson(`/api/posts?${params.toString()}`);
  state.page = data.pagination?.page ?? 1;
  renderArchiveHero(data.pagination);
  renderPosts(data.items ?? []);
  renderPagination(data.pagination);
}

async function bootstrap() {
  const params = new URLSearchParams(window.location.search);
  state.archive = params.get("archive") ?? "";
  state.page = Number.parseInt(params.get("page") ?? "1", 10) || 1;

  try {
    const [config, archives] = await Promise.all([
      fetchJson("/api/site-config"),
      fetchJson("/api/archives")
    ]);

    renderSiteBrand(config);

    const archiveItems = archives.items ?? [];

    if (!state.archive && archiveItems.length) {
      state.archive = archiveItems[0].key;
      state.archiveLabel = archiveItems[0].label;
      updateUrl();
    } else {
      const activeArchive = archiveItems.find((item) => item.key === state.archive);
      state.archiveLabel = activeArchive?.label ?? state.archive;
    }

    renderArchives(archiveItems);
    await loadArchivePosts();
  } catch (error) {
    document.querySelector("#archive-title").textContent = "归档页暂时不可用";
    document.querySelector("#archive-description").textContent = "当前无法连接到博客 API，请稍后刷新再试。";
    document.querySelector("#archive-feed-summary").textContent = "";
    renderPosts([]);
    renderPagination();
  }
}

bootstrap();
