---
title: AIClient-2-API 保姆级教程：从 0 跑通 openai-codex-oauth 到第三方客户端可用
date: 2026-05-05 10:00:00
categories:
  - 教程
tags:
  - AIClient2API
  - Docker
  - OpenAI
  - 教程
cover: /img/post-cover.png
comments: true
---
如果你想把网页版 OpenAI 的授权能力转成一个本地可调用的标准接口，再接到第三方客户端里，这篇就是给你准备的。

这篇文章不讲虚的，直接按**小白能照着做**的顺序来：先把 Docker 和代理打通，再跑起 AIClient-2-API，再走 `openai-codex-oauth`，最后用接口测试确认自己真的成功了。

## 这篇文章能解决什么问题

很多人卡在这几步：

- 容器能不能正常启动
- 代理到底该填哪里
- OpenAI 网页授权成功后为什么还是不能用
- 第三方客户端到底该填哪个地址
- 明明能打开后台，为什么接口还是报错

这篇教程的目标，就是把这些问题按正确顺序拆开处理，尽量少走弯路。

## 最终跑通后你会得到什么

跑通之后，你会得到一组本地可用的信息：

- 本地后台地址：`http://127.0.0.1:3000`
- OpenAI 兼容接口基址：`http://127.0.0.1:3000/openai-codex-oauth/v1`
- 本地自定义 API Key：`local-abc-123`
- 推荐模型：`gpt-5`

这意味着，很多支持 OpenAI 兼容格式的客户端，都可以直接接到这个本地接口上。

## 开始前要准备什么

先准备下面这些东西：

1. 一台能正常联网的 Windows 电脑
2. 已安装并能正常运行的 Docker Desktop
3. 一个可用的代理环境，比如 Clash Verge
4. 你的 OpenAI 网页账号
5. 一个专门放配置文件的目录，比如 `C:\aiclient-configs`

先不要急着授权。**顺序不对，后面很容易越修越乱。**

## 正确的排障顺序

我建议你固定按这个顺序做：

1. 先确认 Docker 正常
2. 再确认代理正常
3. 再启动 AIClient-2-API
4. 只配置 `openai-codex-oauth`
5. 完成 OpenAI 网页授权
6. 检查 `provider_pools.json`
7. 重启容器
8. 直接测试 API
9. 最后再去接第三方客户端
核心原则只有一句话：**不要把 Docker、代理、授权、客户端配置混在一起排查。**

## 第一步：先确认 Docker 正常

先执行：

```cmd
docker --version
docker ps
```

如果这里就报错，不要继续往下折腾。先把 Docker Desktop 本身修好。

成功标志：

- `docker --version` 能正常显示版本
- `docker ps` 能正常返回结果，不报连接失败

## 第二步：确认代理设置没问题

如果你在 Windows 上用的是 Clash Verge 之类的代理，Docker Desktop 通常要能走代理，不然后面授权很容易失败。

常见设置是：

- HTTP Proxy：`http://127.0.0.1:7897`
- HTTPS Proxy：`http://127.0.0.1:7897`

但有一个很容易踩的坑：

**容器内部不要写 `127.0.0.1`。**

在容器配置里，代理地址应该优先写：

```text
http://host.docker.internal:7897
```

这是因为容器里的 `127.0.0.1` 指向的是容器自己，不是你宿主机上的代理。

## 第三步：启动 AIClient-2-API

先创建配置目录：

```cmd
mkdir C:\aiclient-configs
```

然后启动容器：

```cmd
docker run -d ^
  -p 3000:3000 ^
  -p 8085-8087:8085-8087 ^
  -p 1455:1455 ^
  -p 19876-19880:19876-19880 ^
  --restart=always ^
  -v "C:\aiclient-configs:/app/configs" ^
  --name aiclient2api ^
  justlikemaki/aiclient-2-api:latest
```

启动后检查：

```cmd
docker ps
docker logs aiclient2api --tail 80
```

成功标志：

- 容器状态是运行中
- 日志没有明显的启动崩溃
- 浏览器可以打开 `http://127.0.0.1:3000`

默认密码一般是：

```text
admin123
```

## 第四步：先把基础配置写对

新建配置文件：

```cmd
notepad C:\aiclient-configs\config.json
```

推荐先用这一份最小可用配置：

```json
{
  "REQUIRED_API_KEY": "local-abc-123",
  "SERVER_PORT": 3000,
  "HOST": "0.0.0.0",
  "MODEL_PROVIDER": "openai-codex-oauth",
  "PROVIDER_POOLS_FILE_PATH": "configs/provider_pools.json",
  "PROXY_URL": "http://host.docker.internal:7897",
  "PROXY_ENABLED_PROVIDERS": [
    "openai-codex-oauth"
  ],
  "LOG_ENABLED": true,
  "LOG_OUTPUT_MODE": "all",
  "LOG_LEVEL": "info"
}
```

这里最重要的几个点：

- `MODEL_PROVIDER` 用 `openai-codex-oauth`
- `PROVIDER_POOLS_FILE_PATH` 不能漏
- `PROXY_URL` 优先用 `http://host.docker.internal:7897`

改完后重启容器：

```cmd
docker restart aiclient2api
docker logs aiclient2api --tail 120
```

## 第五步：走 openai-codex-oauth 授权

打开后台：

```text
http://127.0.0.1:3000
```

然后按这个顺序操作：

1. 登录后台
2. 进入 `Provider Pools`
3. 找到 `openai-codex-oauth`
4. 点击 `Generate Authorization`
5. 在浏览器里登录 OpenAI
6. 完成授权

这里要注意：

**网页授权成功，不等于接口一定已经能用。**

很多人看到授权成功就直接去配客户端，结果后面又卡住。正确做法是先看配置文件和日志。

## 第六步：检查自己是不是真的授权成功了

先看配置文件和日志：

```cmd
type C:\aiclient-configs\provider_pools.json
docker logs aiclient2api --tail 120
```

你希望看到这些结果：

- `provider_pools.json` 里出现了 `openai-codex-oauth`
- 生成了对应的认证信息
- 日志里能看到授权成功相关信息

如果这里没有落盘，或者日志明显异常，不要直接跳去客户端配置。

## 第七步：重启容器，确认运行时真的加载了账号

继续执行：

```cmd
docker restart aiclient2api
docker logs aiclient2api --tail 120
```

理想状态下，你会在日志里看到类似含义的信息：

- 已加载 `configs/provider_pools.json`
- 已初始化对应账号
- provider 是 `openai-codex-oauth`

如果重启后账号没被正常加载，后面的接口测试也会失败。

## 第八步：直接测试 API，不要先测第三方客户端

这一步非常关键。

先直接打本地接口：

```cmd
powershell -Command "$body = @{ model = 'gpt-5'; messages = @(@{ role = 'user'; content = '你好，请回复连接成功' }) } | ConvertTo-Json -Depth 5; Invoke-RestMethod -Uri 'http://127.0.0.1:3000/openai-codex-oauth/v1/chat/completions' -Method Post -ContentType 'application/json' -Headers @{ Authorization = 'Bearer local-abc-123' } -Body $body"
```

如果成功，你最终应该记住这三个值：

- Base URL：`http://127.0.0.1:3000/openai-codex-oauth/v1`
- API Key：`local-abc-123`
- Model：`gpt-5`

如果 `gpt-5` 不行，也可以试：

- `gpt-5-codex`
- `gpt-5-codex-mini`
- `gpt-5.4`

**只有这一步成功了，才说明你的本地接口真的跑通了。**

## 第九步：第三方客户端怎么填

如果客户端支持 OpenAI 兼容接口，这篇文章对应的填写方式可以直接照着来：

- Base URL：`http://127.0.0.1:3000/openai-codex-oauth/v1`
- API Key：`local-abc-123`
- Model：`gpt-5`

有些客户端会让你选“OpenAI official”或“OpenAI-compatible”，这时候通常应该选：

- `OpenAI-compatible`

因为你接的是本地兼容接口，不是官方直连接口。

## 常见错误与不要再踩的坑

### 1. 容器里把代理写成 127.0.0.1

这是最常见的坑之一。

容器内部应优先写：

```text
http://host.docker.internal:7897
```

### 2. 授权成功了，就以为一定能调用

不对。

正确顺序是：

- 看 `provider_pools.json`
- 看日志
- 重启容器
- 直接测 API
- 最后才接客户端

### 3. 漏掉 `PROVIDER_POOLS_FILE_PATH`

这个值漏了，OpenAI 授权池可能根本不会按预期加载。

### 4. 一上来就去配客户端

客户端报错时，信息往往不够直观。

先直接测 API，能把问题范围缩小很多。

## 给 AI 直接复用的提示词

如果你想把排障过程直接交给 AI，可以把下面这段改一改直接用：

```text
我正在用 AIClient-2-API，通过 openai-codex-oauth 把 OpenAI 网页授权转成本地 OpenAI 兼容接口。

请严格按下面顺序帮我排查，不要跳步：
1. 检查 Docker 是否正常
2. 检查代理是否正常
3. 检查 config.json 是否正确
4. 检查 provider_pools.json 是否生成
5. 检查容器日志
6. 先直接测试 API，再决定是否配置第三方客户端

已知目标接口：
- Base URL: http://127.0.0.1:3000/openai-codex-oauth/v1
- API Key: local-abc-123
- Model: gpt-5

如果你发现问题，请先告诉我最可能原因，再给我下一步该执行的命令。
```

## 总结

如果你只记住一句话，那就是：

**先把 Docker、代理、授权和接口测试按顺序打通，再去碰第三方客户端。**

这样排查最省时间，也最不容易把问题越搞越乱。

## 延伸阅读

如果你已经把这篇里的 OpenAI 兼容接口跑通，下一步可以继续看补充篇：

- 《Claude Code 接入 AIClient-2-API：用 OpenAI 兼容接口继续帮你写和发 Hexo 博客》

那篇会继续往下讲：

- 怎么把这条接口整理成 Claude Code 可直接复用的 3 个核心值
- 怎么让 Claude Code 帮你生成、整理和检查博客文章
- 为什么推送发布前必须再次确认

