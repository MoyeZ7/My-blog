const apiOrigin = window.localStorage.getItem("my-blog-api-origin") ?? "http://localhost:3001";

function formatDate(value) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(new Date(value));
}

async function fetchPost(slug) {
  const response = await fetch(`${apiOrigin}/api/posts/${encodeURIComponent(slug)}`);

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
}

function createRelatedLink(post) {
  const link = document.createElement("a");
  link.className = "related-link";
  link.href = `/post?slug=${encodeURIComponent(post.slug)}`;
  link.textContent = post.title;
  return link;
}

function renderPost(post) {
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

function renderError(message) {
  document.querySelector("#post-title").textContent = "文章暂时不可用";
  document.querySelector("#post-content").textContent = message;
}

async function bootstrap() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");

  if (!slug) {
    renderError("当前没有提供文章标识。");
    return;
  }

  try {
    const post = await fetchPost(slug);
    renderPost(post);
  } catch (error) {
    renderError("文章加载失败，请确认 API 服务已经启动。");
  }
}

bootstrap();
