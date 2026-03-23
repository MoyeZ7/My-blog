import { posts } from "../../../packages/content/src/posts.js";

function sortByPublishedDate(items) {
  return [...items].sort((left, right) => {
    return new Date(right.publishedAt) - new Date(left.publishedAt);
  });
}

function toPostPreview(post) {
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    category: post.category,
    tags: post.tags,
    coverImage: post.coverImage,
    publishedAt: post.publishedAt
  };
}

export function listPosts(filters = {}) {
  const category = filters.category?.trim().toLowerCase();

  const filteredPosts = posts.filter((post) => {
    if (!category) {
      return true;
    }

    return post.category.toLowerCase() === category;
  });

  return sortByPublishedDate(filteredPosts).map(toPostPreview);
}

export function getPostBySlug(slug) {
  const post = posts.find((item) => item.slug === slug);

  if (!post) {
    return null;
  }

  return {
    ...post,
    relatedPosts: listPosts({ category: post.category })
      .filter((item) => item.slug !== post.slug)
      .slice(0, 2)
  };
}

export function listCategories() {
  const categoryMap = new Map();

  for (const post of posts) {
    const current = categoryMap.get(post.category) ?? 0;
    categoryMap.set(post.category, current + 1);
  }

  return [...categoryMap.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name));
}
