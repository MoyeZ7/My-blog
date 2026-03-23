const apiOrigin = window.localStorage.getItem("my-blog-api-origin") ?? "http://localhost:3001";

function formatDate(value) {
  return new Intl.DateTimeFormat("en", {
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

  const cover = document.querySelector("#post-cover");
  cover.src = post.coverImage;
  cover.alt = post.title;

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
    : [document.createTextNode("No related posts yet for this category.")];

  related.replaceChildren(...relatedItems);
}

function renderError(message) {
  document.querySelector("#post-title").textContent = "Article unavailable";
  document.querySelector("#post-content").textContent = message;
}

async function bootstrap() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");

  if (!slug) {
    renderError("No article slug was provided.");
    return;
  }

  try {
    const post = await fetchPost(slug);
    renderPost(post);
  } catch (error) {
    renderError("The article could not be loaded. Verify that the API server is running.");
  }
}

bootstrap();
