# Admin 模块

`apps/admin` 是博客后台管理端的独立前端模块。

当前阶段已经实现：

- 后台登录页
- 基于 API 的管理员登录流程
- 后台仪表盘首页
- 文章、分类、标签和站点统计概览
- 后台文章列表
- 文章关键词与分类筛选

## 启动方式

在项目根目录执行：

```bash
npm run start:admin
```

默认访问地址：

```text
http://localhost:3002
```

## 当前依赖的接口

- `POST /api/admin/login`
- `GET /api/admin/summary`
- `GET /api/admin/posts`

## 当前默认账号

```text
username: admin
password: 123456
```

后续会继续补充：

- 文章创建与编辑
- 草稿与发布状态
- 评论审核
- 站点配置管理
