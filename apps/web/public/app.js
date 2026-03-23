const apiOrigin = window.localStorage.getItem("my-blog-api-origin") ?? "http://localhost:3001";

function formatDate(value) {
  return new Intl.DateTimeFormat("en", {
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

function renderCategories(items) {
  const root = document.querySelector("#category-list");

  root.replaceChildren(
    ...items.map((item) => {
      const button = document.createElement("button");
      button.className = "category-pill";
      button.type = "button";
      button.textContent = `${item.name} (${item.count})`;
      button.addEventListener("click", () => {
        loadPosts(item.name);
      });
      return button;
    })
  );
}

function renderPosts(items) {
  const list = document.querySelector("#post-list");
  const template = document.querySelector("#post-card-template");

  list.replaceChildren(
    ...items.map((item) => {
      const fragment = template.content.cloneNode(true);
      const image = fragment.querySelector(".post-card-image");
      const category = fragment.querySelector('[data-role="category"]');
      const date = fragment.querySelector('[data-role="date"]');
      const title = fragment.querySelector('[data-role="title"]');
      const excerpt = fragment.querySelector('[data-role="excerpt"]');
      const link = fragment.querySelector('[data-role="link"]');

      image.src = item.coverImage;
      image.alt = item.title;
      category.textContent = item.category;
      date.textContent = formatDate(item.publishedAt);
      title.textContent = item.title;
      excerpt.textContent = item.excerpt;
      link.href = `/post?slug=${encodeURIComponent(item.slug)}`;

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

async function loadPosts(category) {
  const search = category ? `?category=${encodeURIComponent(category)}` : "";

  try {
    const data = await fetchJson(`/api/posts${search}`);
    renderPosts(data.items);
  } catch (error) {
    renderMessage("Posts could not be loaded. Start the API server and refresh the page.");
  }
}

async function bootstrap() {
  try {
    const [categories] = await Promise.all([fetchJson("/api/categories"), loadPosts()]);
    renderCategories(categories.items);
  } catch (error) {
    renderMessage("The public site is online, but it cannot reach the API yet.");
  }
}

bootstrap();
