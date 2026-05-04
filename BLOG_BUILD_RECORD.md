# 博客制作记录

本文记录这次个人博客从初始化到可上线的完整制作过程，方便后续复盘、迁移和继续维护。

## 1. 项目目标

本次博客制作的目标是：

- 基于 Hexo + Butterfly 搭建个人技术博客
- 部署到 GitHub Pages
- 做出接近参考站的首页观感
- 配置首页大背景图和可旋转头像
- 接入 Giscus 评论系统
- 完成关于页、仓库 README 和首篇教程文章
- 让后续发文流程尽量简单、可复用

## 2. 技术栈

- Hexo
- Butterfly 主题
- GitHub Pages
- GitHub Actions
- Giscus 评论系统

## 3. 本次完成的内容

### 3.1 博客基础搭建

完成了 Hexo 博客基础结构搭建，并确认以下命令可正常使用：

```bash
npm install
npm run server
npm run clean
npm run build
```

本地预览地址：

```text
http://localhost:4000
```

### 3.2 首页风格调整

围绕参考站风格，完成了首页内容层和视觉层的基础调整：

- 配置首页大背景图
- 配置默认顶部背景图
- 配置头像图片
- 开启头像动效
- 注入自定义 CSS
- 调整标题区域在背景图上的显示效果

主要配置点：

- `_config.butterfly.yml`
- `source/css/custom.css`

其中：

- `index_img` 用于首页背景图
- `default_top_img` 用于默认顶部图
- `avatar.img` 指向头像资源
- `avatar.effect: true` 开启头像效果

自定义样式里补充了：

- 首页头图展示优化
- 标题文字阴影
- 头像 hover 旋转

### 3.3 评论系统接入

评论系统最终使用 Giscus，并成功打通。

完成步骤包括：

1. 在主题配置中启用 Giscus
2. 绑定 GitHub 仓库
3. 开启 GitHub Discussions
4. 获取并写入 `repo_id`
5. 获取并写入 `category_id`
6. 补全 `data-category: General`
7. 验证文章页已加载 Giscus 脚本
8. 排查并确认 GitHub App 已安装到对应仓库

最终解决的关键问题：

- 页面最初不显示评论区，不是前端没部署，而是 Giscus 配置缺少分类名
- 后续报错 `giscus is not installed on this repository`，根因是 GitHub App 没有正确安装到评论仓库

最终结果：

- 文章页底部已可正常评论
- 评论内容通过 GitHub Discussions 管理

### 3.4 About 页面重写

将 `source/about.md` 从简单占位文案，改成适合长期使用的正式博客介绍。

主要方向：

- 明确博客定位
- 强调技术实践、排障、复盘
- 保持长期可用
- 风格尽量真实、具体、可复现

### 3.5 仓库 README 编写

新增并完善根目录 `README.md`，用于 GitHub 仓库首页展示。

README 现在包含：

- 博客用途说明
- 在线地址
- 技术栈
- 本地运行方式
- 构建方式
- 发布方式
- 常用目录说明

### 3.6 首篇文章改写

将原始欢迎文章重写为 AIClient-2-API 教程文章，主题聚焦为：

**从 0 跑通 `openai-codex-oauth` 到第三方客户端可用。**

文章内容重点包括：

- Docker 检查
- 代理检查
- AIClient-2-API 容器启动
- `config.json` 最小可用配置
- OpenAI 网页授权
- `provider_pools.json` 检查
- 容器日志检查
- 本地 API 直测
- 第三方客户端接入方式

后续又按内容定位做了收束：

- 删除 Gemini 和其他非 OpenAI provider 内容
- 全文只保留面向 OpenAI 客户的教程路线

### 3.7 文章封面与站内图片整理

本次还处理了站内图片资源：

- 首页背景图
- 头像图片
- 教程文章封面图

图片最终统一放在：

```text
source/img/
```

## 4. 配置与文件层面的关键改动

这次制作过程中，关键文件主要有：

- `_config.yml`
- `_config.butterfly.yml`
- `source/css/custom.css`
- `source/about.md`
- `source/_posts/hello-world.md`
- `README.md`
- `.github/workflows/pages.yml`

其中最核心的是：

### `_config.butterfly.yml`

用于控制：

- 菜单
- 社交链接
- 头像
- 首页背景图
- 侧边栏展示
- 评论系统
- 自定义资源注入

### `source/css/custom.css`

用于补充主题默认样式之外的视觉细节：

- 首页大图显示效果
- 标题阴影
- 头像旋转动效

### `source/_posts/hello-world.md`

当前已不再是默认欢迎文章，而是首篇正式教程内容。

## 5. 部署与发布流程

当前博客发布方式为：

- 本地修改内容
- 推送到 `main`
- GitHub Actions 自动构建
- 发布到 GitHub Pages

这套流程已经跑通，可持续使用。

## 6. 本次排障里最重要的经验

### 6.1 Git 推送代理要分清宿主机和容器

在容器里，代理优先用：

```text
http://host.docker.internal:7897
```

但本机 `git push` 遇到代理问题时，不能照搬这个地址。宿主机 Git 更适合直接走本地代理地址。

### 6.2 评论系统报错时，要先区分是博客配置问题还是 GitHub 侧授权问题

本次 Giscus 问题实际分成两层：

- 博客配置里缺少 `data-category`
- GitHub App 没安装到评论仓库

如果只盯着前端页面，很容易误判。

### 6.3 教程文章要围绕真实可复现路径写

比起泛泛而谈，真正有用的是：

- 正确执行顺序
- 明确命令
- 关键配置
- 常见错误
- 哪一步失败意味着什么

## 7. 当前博客已具备的状态

截至本次记录，博客已经具备：

- 可本地启动
- 可生成静态文件
- 可自动部署到 GitHub Pages
- 有正式首页内容风格
- 有关于页
- 有仓库 README
- 有首篇正式教程文章
- 有 Giscus 评论系统

## 8. 后续维护建议

后续继续维护时，建议保持这个节奏：

1. 先完成一个真实项目或一次真实排障
2. 保留过程中产生的 Markdown、命令、配置和结论
3. 再整理成可发布文章
4. 文章优先保留真实经验，不套固定模板
5. 发布前先本地预览
6. 推送后确认线上页面和评论区都正常

## 9. 一句话总结

这次博客制作已经从“能跑”推进到了“能写、能发、能评论、能长期维护”的状态，后续重点就不再是重搭框架，而是持续沉淀内容。