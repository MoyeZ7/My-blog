export const posts = [
  {
    id: 1,
    slug: "designing-a-blog-from-first-principles",
    title: "Designing a Blog From First Principles",
    excerpt:
      "A rebuild starts by choosing what should stay from the reference project and what should be redesigned for a cleaner workflow.",
    content: [
      "A blog is more than a list of posts. It is navigation, editorial rhythm, and operational tooling.",
      "The original template proves the product shape. This rebuild keeps that shape, but it starts with thinner boundaries and smaller commits.",
      "That means an API first, a focused public site second, and an admin surface after the reading experience is stable."
    ],
    category: "Architecture",
    tags: ["planning", "workflow", "full-stack"],
    coverImage:
      "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80",
    publishedAt: "2026-03-23"
  },
  {
    id: 2,
    slug: "editorial-layouts-that-do-not-feel-generic",
    title: "Editorial Layouts That Do Not Feel Generic",
    excerpt:
      "Strong blog interfaces rely on contrast, pacing, and typography instead of default card grids and anonymous spacing.",
    content: [
      "The fastest way to make a blog feel forgettable is to let every section have the same weight.",
      "Editorial layouts need tension: a large lead story, quieter secondary entries, and a cadence that rewards scrolling.",
      "This project will keep that in mind as the public-facing pages grow past the initial scaffold."
    ],
    category: "Design",
    tags: ["ui", "editorial", "frontend"],
    coverImage:
      "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=1200&q=80",
    publishedAt: "2026-03-20"
  },
  {
    id: 3,
    slug: "what-to-build-before-an-admin-panel",
    title: "What to Build Before an Admin Panel",
    excerpt:
      "A stable content model and reading flow should exist before the dashboard becomes the main focus.",
    content: [
      "Admin tooling matters, but it should sit on top of a product that already knows what a post, category, and reading page mean.",
      "By building public flows first, we can keep the admin area honest and avoid scaffolding pages that manage unfinished concepts.",
      "That tradeoff is slower in the first hour and faster across the next ten commits."
    ],
    category: "Backend",
    tags: ["admin", "scope", "product"],
    coverImage:
      "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80",
    publishedAt: "2026-03-18"
  }
];
