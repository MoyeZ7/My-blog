# Web 模块

`apps/web` 是博客前台阅读端的独立模块。

当前阶段已经实现：

- 中文首页与文章详情页
- 搜索、分类、标签、站点统计
- 首页文章分页与按月份归档
- 首页品牌文案与说明区配置驱动
- 文章详情阅读信息与相关文章
- 文章详情页品牌名称配置驱动
- 文章详情页公开评论展示
- 访客评论提交，提交后进入审核流程

## 启动方式

在项目根目录执行：

```bash
npm run start:web
```

默认访问地址：

```text
http://localhost:3000
```

## 当前依赖的接口

- `GET /api/posts`
- `GET /api/archives`
- `GET /api/posts/:slug`
- `GET /api/posts/:slug/comments`
- `POST /api/posts/:slug/comments`
- `GET /api/site-config`
- `GET /api/categories`
- `GET /api/tags`
- `GET /api/stats`
