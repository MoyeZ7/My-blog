export const seedPosts = [
  {
    id: 1,
    slug: "designing-a-blog-from-first-principles",
    title: "从零开始重构博客系统的第一原则",
    excerpt:
      "真正的重构不是把旧模板原样搬过来，而是先拆清内容模型、访问路径和后续可提交的工作边界。",
    content: [
      "一个博客系统的核心并不是“文章列表”这一个页面，而是内容如何被组织、如何被阅读，以及后续如何被管理。",
      "参考模板已经证明了产品方向成立，所以新的实现不需要抄结构，而是要重新定义更适合当前工作流的分层方式。",
      "这也是为什么这次实现先落 API 和公开阅读端，再逐步进入后台与数据持久化。这样每一步都能独立提交、独立验证。"
    ],
    category: "架构",
    tags: ["重构", "工作流", "全栈"],
    coverImage:
      "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80",
    publishedAt: "2026-03-23"
  },
  {
    id: 2,
    slug: "editorial-layouts-that-do-not-feel-generic",
    title: "如何做出不普通的中文博客首页",
    excerpt:
      "博客首页不能只是卡片堆叠，真正有辨识度的页面要靠节奏、留白、层级和信息密度的控制。",
    content: [
      "很多博客页面看起来“整齐”，但读起来没有记忆点，原因通常是所有模块的视觉权重都太接近。",
      "更好的方式是让首屏承担叙事，让文章区承担信息密度，让侧栏承担导航和状态感，这样用户进入页面就能知道先看哪里。",
      "对于中文博客来说，字体、行高、段落宽度也比英文界面更重要，因为阅读疲劳会更早出现。"
    ],
    category: "设计",
    tags: ["界面", "排版", "前端"],
    coverImage:
      "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=1200&q=80",
    publishedAt: "2026-03-21"
  },
  {
    id: 3,
    slug: "what-to-build-before-an-admin-panel",
    title: "后台面板之前，应该先把什么做对",
    excerpt:
      "如果公开阅读体验和内容结构都还不稳定，过早去做后台，最后往往只是在管理一个还没定义清楚的系统。",
    content: [
      "后台不是不能先做，而是不应该先主导系统设计。系统首先要知道“文章是什么”“分类和标签如何工作”“详情页需要承载什么”。",
      "只有这些概念稳定下来，后台新增、编辑、审核这些动作才不会变成重复返工。",
      "因此这个项目当前先把公开端做好，再进入后台壳子和内容编辑流，这是更稳妥的顺序。"
    ],
    category: "后端",
    tags: ["后台", "产品", "范围控制"],
    coverImage:
      "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80",
    publishedAt: "2026-03-19"
  },
  {
    id: 4,
    slug: "building-better-reading-rhythm",
    title: "让文章列表更有阅读节奏的几个方法",
    excerpt:
      "列表页不是目录页的别名。只要文章之间有主次、有呼吸感，页面就会从“信息堆积”变成“内容编排”。",
    content: [
      "首页的任务不是把全部内容平铺给用户，而是帮助用户快速建立方向感：最新内容是什么、主题分布如何、从哪里开始读最合适。",
      "因此文章卡片除了标题和摘要，还应该给出分类、标签、阅读时长这些轻量信息，帮助读者判断是否值得点开。",
      "当这些基础元素都到位之后，博客才会更像一个有编辑意识的内容站点，而不是单纯的数据列表。"
    ],
    category: "设计",
    tags: ["阅读体验", "首页", "内容策略"],
    coverImage:
      "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80",
    publishedAt: "2026-03-17"
  }
];

export const seedComments = [
  {
    id: 1,
    postSlug: "what-to-build-before-an-admin-panel",
    author: "林远",
    content: "先把公开阅读体验做稳，再回头补后台，确实更像真实产品开发。",
    createdAt: "2026-03-20",
    status: "approved"
  },
  {
    id: 2,
    postSlug: "building-better-reading-rhythm",
    author: "周宁",
    content: "首页的节奏感这点说得很对，很多博客缺的不是内容，而是编排意识。",
    createdAt: "2026-03-22",
    status: "approved"
  },
  {
    id: 3,
    postSlug: "designing-a-blog-from-first-principles",
    author: "陈序",
    content: "希望后面能看到数据库层和后台配置这块的拆分过程。",
    createdAt: "2026-03-23",
    status: "pending"
  }
];

export const seedSiteConfig = {
  brandName: "我的博客",
  headerNote: "以中文内容为主的全栈博客重建实验。",
  heroEyebrow: "从参考模板到新实现",
  heroTitle: "把博客做成真正适合中文阅读的内容产品。",
  heroDescription:
    "这一版不再只是“能显示文章”，而是开始强调阅读节奏、中文文案、检索能力和更清晰的信息组织。",
  panelEyebrow: "当前阶段",
  panelTitle: "公开阅读端优先",
  panelDescription:
    "首页、详情页、分类和标签浏览已经可用。下一阶段会进入后台壳子与内容管理流程。",
  featureEyebrow: "站点说明",
  featureTitle: "为什么先做前台",
  featureDescription:
    "因为先把内容模型和阅读体验跑通，后台的新增、编辑和审核流程才不会建立在摇摆不定的概念之上。",
  updatedAt: "2026-03-23"
};
