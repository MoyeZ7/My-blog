const apiOrigin = window.localStorage.getItem("my-blog-api-origin") ?? "http://localhost:3001";

function formatDate(value) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(new Date(value));
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.message ?? `Request failed: ${response.status}`);
  }

  return response.json();
}

async function fetchPost(slug) {
  return fetchJson(`${apiOrigin}/api/posts/${encodeURIComponent(slug)}`);
}

async function fetchSiteConfig() {
  return fetchJson(`${apiOrigin}/api/site-config`);
}

async function fetchComments(slug) {
  const data = await fetchJson(`${apiOrigin}/api/posts/${encodeURIComponent(slug)}/comments`);
  return data.items ?? [];
}

async function submitComment(slug, payload) {
  return fetchJson(`${apiOrigin}/api/posts/${encodeURIComponent(slug)}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}

function createRelatedLink(post) {
  const link = document.createElement("a");
  link.className = "related-link";
  link.href = `/post?slug=${encodeURIComponent(post.slug)}`;
  link.textContent = post.title;
  return link;
}

function createCommentCard(comment) {
  const template = document.querySelector("#comment-card-template");
  const fragment = template.content.cloneNode(true);
  fragment.querySelector('[data-role="author"]').textContent = comment.author;
  fragment.querySelector('[data-role="date"]').textContent = formatDate(comment.createdAt);
  fragment.querySelector('[data-role="content"]').textContent = comment.content;
  return fragment;
}

function setCommentMessage(message, isError = false) {
  const node = document.querySelector("#comment-message");
  node.textContent = message;
  node.classList.toggle("is-error", isError);
}

function setDocumentMeta({ title, description }) {
  document.title = title;

  let descriptionMeta = document.querySelector('meta[name="description"]');

  if (!descriptionMeta) {
    descriptionMeta = document.createElement("meta");
    descriptionMeta.name = "description";
    document.head.append(descriptionMeta);
  }

  descriptionMeta.content = description;
}

function renderSiteBrand(config) {
  document.querySelector("#site-brand").textContent = config.brandName;
}

function renderPost(post, config) {
  setDocumentMeta({
    title: `${post.seoTitle} | ${config.brandName}`,
    description: post.seoDescription
  });
  document.querySelector("#post-title").textContent = post.title;
  document.querySelector("#post-category").textContent = post.category;
  document.querySelector("#post-date").textContent = formatDate(post.publishedAt);
  document.querySelector("#post-reading-time").textContent = `${post.readingTimeMinutes} 分钟阅读`;

  const cover = document.querySelector("#post-cover");
  cover.src = post.coverImage;
  cover.alt = post.title;

  const tags = document.querySelector("#post-tags");
  tags.replaceChildren(
    ...post.tags.map((tag) => {
      const node = document.createElement("span");
      node.className = "inline-tag";
      node.textContent = `# ${tag}`;
      return node;
    })
  );

  const content = document.querySelector("#post-content");
  content.replaceChildren(
    ...post.content.map((paragraph) => {
      const node = document.createElement("p");
      node.textContent = paragraph;
      return node;
    })
  );

  const related = document.querySelector("#related-posts");
  const relatedItems = post.relatedPosts.length
    ? post.relatedPosts.map(createRelatedLink)
    : [document.createTextNode("当前分类下还没有更多相关文章。")];

  related.replaceChildren(...relatedItems);

  const copyButton = document.querySelector("#copy-link-button");
  copyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      copyButton.textContent = "链接已复制";
    } catch (error) {
      copyButton.textContent = "复制失败";
    }
  });
}

function renderComments(items) {
  const summary = document.querySelector("#comment-summary");
  const list = document.querySelector("#comment-list");

  if (!items.length) {
    summary.textContent = "还没有公开评论";

    const empty = document.createElement("p");
    empty.className = "comment-empty";
    empty.textContent = "第一条评论可以从你开始，提交后会进入审核流程。";
    list.replaceChildren(empty);
    return;
  }

  summary.textContent = `已展示 ${items.length} 条公开评论`;
  list.replaceChildren(...items.map(createCommentCard));
}

function bindCommentForm(slug) {
  const form = document.querySelector("#comment-form");
  const submitButton = document.querySelector("#comment-submit-button");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    submitButton.disabled = true;
    submitButton.textContent = "提交中...";

    try {
      const result = await submitComment(slug, {
        author: formData.get("author"),
        content: formData.get("content")
      });

      form.reset();
      setCommentMessage(result.message);
      const items = await fetchComments(slug);
      renderComments(items);
    } catch (error) {
      setCommentMessage(error.message || "评论提交失败，请稍后再试。", true);
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "提交评论";
    }
  });
}

function renderError(message) {
  setDocumentMeta({
    title: "文章暂时不可用 | 我的博客",
    description: "当前文章暂时无法加载，请稍后再试。"
  });
  document.querySelector("#post-title").textContent = "文章暂时不可用";
  document.querySelector("#post-content").textContent = message;
  document.querySelector("#comment-summary").textContent = "评论暂时不可用";
  document.querySelector("#comment-list").replaceChildren();
  setCommentMessage("评论功能暂时不可用。", true);
}

async function bootstrap() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");

  if (!slug) {
    renderError("当前没有提供文章标识。");
    return;
  }

  try {
    const [post, comments, config] = await Promise.all([
      fetchPost(slug),
      fetchComments(slug),
      fetchSiteConfig()
    ]);
    renderSiteBrand(config);
    renderPost(post, config);
    renderComments(comments);
    bindCommentForm(slug);
  } catch (error) {
    renderError("文章加载失败，请确认 API 服务已经启动。");
  }
}

bootstrap();
