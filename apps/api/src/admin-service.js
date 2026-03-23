import { randomUUID } from "node:crypto";
import { comments } from "../../../packages/content/src/comments.js";
import { posts } from "../../../packages/content/src/posts.js";
import { siteConfig } from "../../../packages/content/src/site-config.js";
import { listPosts } from "./blog-service.js";

const sessions = new Map();
const adminCredentials = {
  username: process.env.ADMIN_USERNAME ?? "admin",
  password: process.env.ADMIN_PASSWORD ?? "123456",
  displayName: process.env.ADMIN_DISPLAY_NAME ?? "站点管理员"
};
const defaultCoverImage =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80";

function normalize(value) {
  return value?.trim() ?? "";
}

function normalizeStatus(status) {
  return status === "draft" ? "draft" : "published";
}

function formatAdminSiteConfig() {
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

function getReadingTime(content) {
  const totalLength = content.join("").replace(/\s+/g, "").length;
  return Math.max(1, Math.ceil(totalLength / 320));
}

function slugify(value) {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (normalized) {
    return normalized;
  }

  return `post-${Date.now()}`;
}

function parseTags(value) {
  return [...new Set(
    String(value ?? "")
      .split(/[,\n，]/)
      .map((item) => item.trim())
      .filter(Boolean)
  )];
}

function parseContent(value) {
  return String(value ?? "")
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatAdminPost(post) {
  const status = normalizeStatus(post.status);
  const activityDate = post.updatedAt ?? post.publishedAt ?? new Date().toISOString().slice(0, 10);

  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    category: post.category,
    tags: post.tags,
    coverImage: post.coverImage,
    publishedAt: post.publishedAt,
    readingTimeMinutes: getReadingTime(post.content),
    status: status === "draft" ? "草稿" : "已发布",
    updatedAt: activityDate
  };
}

function formatAdminEditorPost(post) {
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    category: post.category,
    tags: post.tags.join(", "),
    coverImage: post.coverImage,
    content: post.content.join("\n"),
    status: normalizeStatus(post.status)
  };
}

function formatAdminComment(comment) {
  const relatedPost = posts.find((post) => post.slug === comment.postSlug);
  const statusMap = {
    approved: "已通过",
    pending: "待审核",
    rejected: "已拒绝"
  };

  return {
    id: comment.id,
    postSlug: comment.postSlug,
    postTitle: relatedPost?.title ?? "未知文章",
    author: comment.author,
    content: comment.content,
    createdAt: comment.createdAt,
    status: statusMap[comment.status] ?? "待审核"
  };
}

function formatAdminTag(name, count) {
  const relatedPosts = posts
    .filter((post) => post.tags.includes(name))
    .map((post) => post.title)
    .slice(0, 3);

  return {
    name,
    count,
    postCount: count,
    relatedPosts
  };
}

function listAdminCategories() {
  const categoryMap = new Map();

  for (const post of posts) {
    const current = categoryMap.get(post.category) ?? 0;
    categoryMap.set(post.category, current + 1);
  }

  return [...categoryMap.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name, "zh-Hans-CN"));
}

function collectAdminTags() {
  const tagMap = new Map();

  for (const post of posts) {
    for (const tag of post.tags) {
      const current = tagMap.get(tag) ?? 0;
      tagMap.set(tag, current + 1);
    }
  }

  return [...tagMap.entries()]
    .map(([name, count]) => formatAdminTag(name, count))
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name, "zh-Hans-CN"));
}

function getAdminStats() {
  return {
    postCount: posts.length,
    categoryCount: listAdminCategories().length,
    tagCount: collectAdminTags().length
  };
}

export function loginAdmin({ username, password }) {
  if (username !== adminCredentials.username || password !== adminCredentials.password) {
    return null;
  }

  const token = randomUUID();
  const session = {
    token,
    username: adminCredentials.username,
    displayName: adminCredentials.displayName,
    createdAt: new Date().toISOString()
  };

  sessions.set(token, session);
  return session;
}

export function getAdminSession(token) {
  if (!token) {
    return null;
  }

  return sessions.get(token) ?? null;
}

export function getAdminDashboardSummary() {
  return {
    stats: getAdminStats(),
    recentPosts: listAdminPosts().items.slice(0, 4),
    categories: listAdminCategories().slice(0, 5),
    tags: collectAdminTags().slice(0, 8),
    commentStats: {
      total: comments.length,
      pending: comments.filter((comment) => comment.status === "pending").length
    }
  };
}

export function getAdminSiteConfig() {
  return {
    config: formatAdminSiteConfig()
  };
}

export function listAdminTags(filters = {}) {
  const keyword = normalize(filters.q).toLowerCase();
  const items = collectAdminTags().filter((tag) => {
    if (!keyword) {
      return true;
    }

    const searchTarget = [tag.name, ...tag.relatedPosts].join(" ").toLowerCase();
    return searchTarget.includes(keyword);
  });

  return {
    items,
    total: items.length
  };
}

export function listAdminPosts(filters = {}) {
  const keyword = normalize(filters.q).toLowerCase();
  const category = normalize(filters.category).toLowerCase();

  const items = [...posts]
    .filter((post) => {
      if (category && post.category.toLowerCase() !== category) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      const searchTarget = [post.title, post.excerpt, post.category, ...post.tags, ...post.content]
        .join(" ")
        .toLowerCase();

      return searchTarget.includes(keyword);
    })
    .sort((left, right) => {
      const leftDate = new Date(left.updatedAt ?? left.publishedAt ?? 0);
      const rightDate = new Date(right.updatedAt ?? right.publishedAt ?? 0);
      return rightDate - leftDate;
    })
    .map(formatAdminPost);

  return {
    items,
    total: items.length
  };
}

export function getAdminPostBySlug(slug) {
  const post = posts.find((item) => item.slug === slug);

  if (!post) {
    return null;
  }

  return {
    post: formatAdminEditorPost(post)
  };
}

export function createAdminPost(input) {
  const title = normalize(input.title);
  const excerpt = normalize(input.excerpt);
  const category = normalize(input.category);
  const coverImage = normalize(input.coverImage) || defaultCoverImage;
  const tags = parseTags(input.tags);
  const content = parseContent(input.content);
  const status = normalizeStatus(input.status);

  if (!title) {
    return {
      error: "标题不能为空"
    };
  }

  if (!excerpt) {
    return {
      error: "摘要不能为空"
    };
  }

  if (!category) {
    return {
      error: "分类不能为空"
    };
  }

  if (!tags.length) {
    return {
      error: "至少需要一个标签"
    };
  }

  if (!content.length) {
    return {
      error: "正文不能为空"
    };
  }

  const slug = normalize(input.slug) || slugify(title);

  if (posts.some((post) => post.slug === slug)) {
    return {
      error: "Slug 已存在，请更换标题或自定义 slug"
    };
  }

  const today = new Date().toISOString().slice(0, 10);
  const nextId = posts.reduce((currentMax, post) => Math.max(currentMax, post.id), 0) + 1;

  const post = {
    id: nextId,
    slug,
    title,
    excerpt,
    content,
    category,
    tags,
    coverImage,
    publishedAt: status === "published" ? today : null,
    updatedAt: today,
    status
  };

  posts.unshift(post);

  return {
    post: formatAdminPost(post)
  };
}

export function updateAdminPost(slug, input) {
  const post = posts.find((item) => item.slug === slug);

  if (!post) {
    return {
      error: "文章不存在"
    };
  }

  const title = normalize(input.title);
  const excerpt = normalize(input.excerpt);
  const category = normalize(input.category);
  const coverImage = normalize(input.coverImage) || defaultCoverImage;
  const tags = parseTags(input.tags);
  const content = parseContent(input.content);
  const status = normalizeStatus(input.status);

  if (!title) {
    return {
      error: "标题不能为空"
    };
  }

  if (!excerpt) {
    return {
      error: "摘要不能为空"
    };
  }

  if (!category) {
    return {
      error: "分类不能为空"
    };
  }

  if (!tags.length) {
    return {
      error: "至少需要一个标签"
    };
  }

  if (!content.length) {
    return {
      error: "正文不能为空"
    };
  }

  const today = new Date().toISOString().slice(0, 10);
  post.title = title;
  post.excerpt = excerpt;
  post.category = category;
  post.coverImage = coverImage;
  post.tags = tags;
  post.content = content;
  post.status = status;
  post.updatedAt = today;

  if (status === "published" && !post.publishedAt) {
    post.publishedAt = today;
  }

  if (status === "draft") {
    post.publishedAt = null;
  }

  return {
    post: formatAdminPost(post)
  };
}

export function deleteAdminPost(slug) {
  const index = posts.findIndex((item) => item.slug === slug);

  if (index === -1) {
    return {
      error: "文章不存在"
    };
  }

  const [removedPost] = posts.splice(index, 1);

  return {
    post: formatAdminPost(removedPost)
  };
}

export function listAdminComments(filters = {}) {
  const keyword = normalize(filters.q).toLowerCase();
  const status = normalize(filters.status).toLowerCase();

  const items = comments
    .filter((comment) => {
      if (status && comment.status !== status) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      const relatedPost = posts.find((post) => post.slug === comment.postSlug);
      const searchTarget = [
        comment.author,
        comment.content,
        relatedPost?.title ?? "",
        relatedPost?.category ?? ""
      ]
        .join(" ")
        .toLowerCase();

      return searchTarget.includes(keyword);
    })
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    .map(formatAdminComment);

  return {
    items,
    total: items.length
  };
}

export function updateAdminCommentStatus(id, status) {
  const normalizedStatus = normalizeStatusForComment(status);
  const comment = comments.find((item) => item.id === Number(id));

  if (!comment) {
    return {
      error: "评论不存在"
    };
  }

  comment.status = normalizedStatus;

  return {
    comment: formatAdminComment(comment)
  };
}

export function updateAdminSiteConfig(input) {
  const brandName = normalize(input.brandName);
  const heroTitle = normalize(input.heroTitle);
  const heroDescription = normalize(input.heroDescription);

  if (!brandName) {
    return {
      error: "站点名称不能为空"
    };
  }

  if (!heroTitle) {
    return {
      error: "首页主标题不能为空"
    };
  }

  if (!heroDescription) {
    return {
      error: "首页说明不能为空"
    };
  }

  siteConfig.brandName = brandName;
  siteConfig.headerNote = normalize(input.headerNote);
  siteConfig.heroEyebrow = normalize(input.heroEyebrow);
  siteConfig.heroTitle = heroTitle;
  siteConfig.heroDescription = heroDescription;
  siteConfig.panelEyebrow = normalize(input.panelEyebrow);
  siteConfig.panelTitle = normalize(input.panelTitle);
  siteConfig.panelDescription = normalize(input.panelDescription);
  siteConfig.featureEyebrow = normalize(input.featureEyebrow);
  siteConfig.featureTitle = normalize(input.featureTitle);
  siteConfig.featureDescription = normalize(input.featureDescription);
  siteConfig.updatedAt = new Date().toISOString().slice(0, 10);

  return {
    config: formatAdminSiteConfig()
  };
}

export function renameAdminTag(currentName, nextName) {
  const sourceName = normalize(currentName);
  const targetName = normalize(nextName);

  if (!sourceName) {
    return {
      error: "当前标签不能为空"
    };
  }

  if (!targetName) {
    return {
      error: "新标签名称不能为空"
    };
  }

  const relatedPosts = posts.filter((post) => post.tags.includes(sourceName));

  if (!relatedPosts.length) {
    return {
      error: "标签不存在"
    };
  }

  for (const post of relatedPosts) {
    post.tags = [...new Set(post.tags.map((tag) => (tag === sourceName ? targetName : tag)))];
    post.updatedAt = new Date().toISOString().slice(0, 10);
  }

  return {
    tag: collectAdminTags().find((item) => item.name === targetName) ?? formatAdminTag(targetName, 0)
  };
}

export function deleteAdminTag(name) {
  const targetName = normalize(name);

  if (!targetName) {
    return {
      error: "标签名称不能为空"
    };
  }

  const relatedPosts = posts.filter((post) => post.tags.includes(targetName));

  if (!relatedPosts.length) {
    return {
      error: "标签不存在"
    };
  }

  if (relatedPosts.some((post) => post.tags.length === 1)) {
    return {
      error: "无法删除唯一标签，请先为相关文章补充其他标签"
    };
  }

  for (const post of relatedPosts) {
    post.tags = post.tags.filter((tag) => tag !== targetName);
    post.updatedAt = new Date().toISOString().slice(0, 10);
  }

  return {
    tag: {
      name: targetName
    }
  };
}

function normalizeStatusForComment(status) {
  if (status === "approved" || status === "rejected") {
    return status;
  }

  return "pending";
}
