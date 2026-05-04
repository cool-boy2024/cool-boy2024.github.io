# Evident Blog

一个基于 Hexo + Butterfly 搭建的个人博客，用来持续记录技术实践、排障过程、工具使用经验和项目复盘。

- 在线地址：<https://cool-boy2024.github.io/>
- 主题：Butterfly
- 部署方式：GitHub Pages + GitHub Actions

## 技术栈

- Hexo
- Butterfly
- GitHub Pages
- GitHub Actions

## 本地运行

先安装依赖：

```bash
npm install
```

启动本地预览：

```bash
npm run server
```

默认访问地址：

```text
http://localhost:4000
```

## 生成静态文件

```bash
npm run clean
npm run build
```

## 发布方式

仓库推送到 `main` 后，会通过 GitHub Actions 自动构建并发布到 GitHub Pages。

## 常用目录

- `source/_posts/`：博客文章
- `source/img/`：站内图片资源
- `source/about.md`：关于页
- `_config.yml`：Hexo 主配置
- `_config.butterfly.yml`：Butterfly 主题配置
- `.github/workflows/pages.yml`：Pages 自动部署工作流

## 说明

这个仓库主要服务于博客内容发布与页面展示。文章内容会优先围绕真实项目、实操过程和复盘经验整理，而不是只保留模板化说明。