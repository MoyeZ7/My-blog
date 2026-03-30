import { comments, saveComments, siteConfig } from "../../../packages/content/src/content-store.js";
import { posts } from "../../../packages/content/src/posts.js";

function normalize(value) {
  return value?.trim().toLowerCase() ?? "";
}

function normalizePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ""), 10);

  if (Number.isNaN(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}

function getPostStatus(post) {
  return post.status ?? "published";
}

function getPublishedPosts() {
  return posts.filter((post) => getPostStatus(post) === "published");
}

function sortByPublishedDate(items) {
  return [...items].sort((left, right) => {
    return new Date(right.publishedAt) - new Date(left.publishedAt);
  });
}

function getArchiveKey(post) {
  return String(post.publishedAt).slice(0, 7);
}

function estimateReadingTime(content) {
  const totalLength = content.join("").replace(/\s+/g, "").length;
  return Math.max(1, Math.ceil(totalLength / 320));
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
    publishedAt: post.publishedAt,
    readingTimeMinutes: estimateReadingTime(post.content)
  };
}

function formatPublicComment(comment) {
  return {
    id: comment.id,
    author: comment.author,
    content: comment.content,
    createdAt: comment.createdAt
  };
}

function formatPublicSiteConfig() {
  return {
    brandName: siteConfig.brandName,
    headerNote: siteConfig.headerNote,
    heroEyebrow: siteConfig.heroEyebrow,
    heroTitle: siteConfig.heroTitle,
    heroDescription: siteConfig.heroDescription,
    panelEyebrow: siteConfig.panelEyebrow,
    panelTitle: siteConfig.panelTitle,
    panelDescription: siteConfig.panelDescription,
    featureEyebrow: siteConfig.featureEyebrow,
    featureTitle: siteConfig.featureTitle,
    featureDescription: siteConfig.featureDescription,
    updatedAt: siteConfig.updatedAt
  };
}

function getFilteredPublishedPosts(filters = {}) {
  const category = normalize(filters.category);
  const keyword = normalize(filters.q);
  const tag = normalize(filters.tag);
  const archive = String(filters.archive ?? "").trim();

  return getPublishedPosts().filter((post) => {
    if (category && normalize(post.category) !== category) {
      return false;
    }

    if (tag && !post.tags.some((item) => normalize(item) === tag)) {
      return false;
    }

    if (archive && getArchiveKey(post) !== archive) {
      return false;
    }

    if (!keyword) {
      return true;
    }

    const searchTarget = [post.title, post.excerpt, post.category, ...post.tags, ...post.content]
      .join(" ")
      .toLowerCase();

    return searchTarget.includes(keyword);
  });
}

export function listPosts(filters = {}) {
  const filteredPosts = getFilteredPublishedPosts(filters);

  return sortByPublishedDate(filteredPosts).map(toPostPreview);
}

export function listPaginatedPosts(filters = {}) {
  const pageSize = Math.min(12, normalizePositiveInteger(filters.pageSize, 3));
  const requestedPage = normalizePositiveInteger(filters.page, 1);
  const items = listPosts(filters);
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const startIndex = (page - 1) * pageSize;

  return {
    items: items.slice(startIndex, startIndex + pageSize),
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages,
      hasPreviousPage: page > 1,
      hasNextPage: page < totalPages
    }
  };
}

export function listArchives() {
  const archiveMap = new Map();

  for (const post of getPublishedPosts()) {
    const key = getArchiveKey(post);
    const current = archiveMap.get(key) ?? {
      key,
      year: Number.parseInt(key.slice(0, 4), 10),
      month: Number.parseInt(key.slice(5, 7), 10),
      count: 0
    };

    current.count += 1;
    archiveMap.set(key, current);
  }

  return [...archiveMap.values()]
    .sort((left, right) => right.key.localeCompare(left.key))
    .map((item) => ({
      ...item,
      label: `${item.year} 年 ${item.month} 月`
    }));
}

export function getPostBySlug(slug) {
  const post = getPublishedPosts().find((item) => item.slug === slug);

  if (!post) {
    return null;
  }

  return {
    ...post,
    seoTitle: post.seoTitle ?? post.title,
    seoDescription: post.seoDescription ?? post.excerpt,
    readingTimeMinutes: estimateReadingTime(post.content),
    relatedPosts: listPosts({ category: post.category })
      .filter((item) => item.slug !== post.slug)
      .slice(0, 2)
  };
}

export function listCategories() {
  const categoryMap = new Map();

  for (const post of getPublishedPosts()) {
    const current = categoryMap.get(post.category) ?? 0;
    categoryMap.set(post.category, current + 1);
  }

  return [...categoryMap.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name));
}

export function listTags() {
  const tagMap = new Map();

  for (const post of getPublishedPosts()) {
    for (const tag of post.tags) {
      const current = tagMap.get(tag) ?? 0;
      tagMap.set(tag, current + 1);
    }
  }

  return [...tagMap.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name, "zh-Hans-CN"));
}

export function getSiteStats() {
  const publishedPosts = getPublishedPosts();

  return {
    postCount: publishedPosts.length,
    categoryCount: listCategories().length,
    tagCount: listTags().length
  };
}

export function listApprovedCommentsByPostSlug(slug) {
  return comments
    .filter((comment) => comment.postSlug === slug && comment.status === "approved")
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    .map(formatPublicComment);
}

export function createPublicComment(slug, input) {
  const post = getPublishedPosts().find((item) => item.slug === slug);

  if (!post) {
    return {
      error: "文章不存在"
    };
  }

  const author = String(input.author ?? "").trim();
  const content = String(input.content ?? "").trim();

  if (!author) {
    return {
      error: "请填写称呼"
    };
  }

  if (!content) {
    return {
      error: "请填写评论内容"
    };
  }

  const nextId = comments.reduce((currentMax, comment) => Math.max(currentMax, comment.id), 0) + 1;
  const createdAt = new Date().toISOString().slice(0, 10);
  const comment = {
    id: nextId,
    postSlug: slug,
    author,
    content,
    createdAt,
    status: "pending"
  };

  comments.unshift(comment);
  saveComments();

  return {
    message: "评论已提交，审核通过后展示。",
    comment: {
      ...formatPublicComment(comment),
      status: "待审核"
    }
  };
}

export function getPublicSiteConfig() {
  return formatPublicSiteConfig();
}
