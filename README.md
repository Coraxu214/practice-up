# 练起来 💪

把小红书收藏的健身笔记,变成跟着练的训练计划。

Vite + React + Tailwind,后端用 EdgeOne Pages Functions 代理 DeepSeek。国内可直接访问。

---

## 本地开发

```bash
npm install
cp .env.example .env       # 编辑 .env 填入 VITE_DEEPSEEK_API_KEY
npm run dev                 # http://localhost:5173
```

本地模式下,前端**直接**调 DeepSeek,key 来自 `.env`。没配 key 也能跑(走 mock 数据)。

> 想在手机访问:`npm run dev` 已加 `--host`,看终端打印的 Network 地址,确保手机和电脑同 WiFi。

---

## 部署到腾讯 EdgeOne Pages(国内可访问)

> 不用 Vercel 的原因:`*.vercel.app` 在国内被墙,普通用户不挂代理打不开。
> EdgeOne Pages 是腾讯云出的类 Vercel 产品,有免备案的 `.edgeone.app` 二级域名,国内 CDN 速度快。

### 1. 准备

- 已经推到 GitHub 的仓库(本项目)
- 腾讯云账号 + 实名认证(身份证号 + 人脸,几分钟)
- DeepSeek API key

### 2. 在 EdgeOne 控制台创建项目

1. 打开 https://console.cloud.tencent.com/edgeone/pages
2. 第一次会让你「开通服务」,免费,点确认
3. **创建项目** → 选 **从 Git 仓库导入** → 授权 GitHub → 选你的 `practice-up` 仓库
4. 构建配置:
   - **框架预设**:`Vite`(选了之后下面自动填好)
   - **构建命令**:`npm run build`
   - **输出目录**:`dist`
   - **根目录**:留空
5. 展开 **环境变量**,加这几条(**没有 VITE_ 前缀!**):

| 变量名 | 值 | 必填 | 说明 |
|---|---|---|---|
| `DEEPSEEK_API_KEY` | `sk-xxx` | ✅ | 你的 DeepSeek key |
| `DEEPSEEK_MODEL` | `deepseek-chat` | 可选 | 留空默认 deepseek-chat |
| `DAILY_LIMIT` | `10` | 可选 | 每 IP 每天上限,默认 10 |
| `INVITE_CODE` | 自定义 | 可选 | 设了就要求邀请码,留空就不要 |

6. 点 **开始部署** → 等 1-2 分钟
7. 拿到 `https://xxxxx.edgeone.app` 这种地址,发给朋友就行

### 3. 改环境变量后

EdgeOne 改完环境变量后,要去 **部署管理** → 点最新部署右边 → **重新部署** 才会生效。

### 4. 自定义域名(可选)

EdgeOne → 项目 → **设置 → 域名管理** → 加你买的域名。**注意 `.cn` 域名要先备案**,`.com` 不强制备案但建议有备案号否则部分运营商可能拦。

### 5. 防滥用

- **IP 限频**:每个 IP 每天 10 次(可调 `DAILY_LIMIT` 环境变量)
- **邀请码(可选)**:设 `INVITE_CODE`,访客首次解析时会被前端提示输入
- **限频是 best-effort**:函数内存存的,冷启动会重置。流量大想要真限频,把 `functions/api/parse.js` 里的 `ipBuckets` 换成腾讯云 [Redis 内存数据库](https://cloud.tencent.com/product/crs) 或 EdgeOne KV 存储

---

## 项目结构

```
practice-up/
├── functions/
│   └── api/
│       └── parse.js      # EdgeOne Pages Function → /api/parse
├── public/
│   └── _redirects        # SPA 路由 fallback
├── src/
│   ├── App.jsx           # 路由
│   ├── components/       # TabBar, Header
│   ├── pages/            # Home, Import, Today, Share
│   └── lib/
│       ├── api.js        # 前端:dev 直连 / prod 调 /api/parse
│       ├── store.jsx     # Context + localStorage
│       ├── scheduler.js  # AI 排期算法
│       └── date.js
├── .env.example          # 本地开发用(VITE_ 前缀)
└── .env                  # 你自己的(已 gitignore)
```

---

## ⚠️ 安全须知

- **不要**把 `.env` 提交到 git(`.gitignore` 已挡)
- **不要**在前端代码里硬编码 key,生产部署一律走 `/api/parse`
- DeepSeek key 如果在聊天 / 截图 / 公开仓库里泄露过,**立刻去 console 吊销**

---

## 常见问题

**Q: 部署后路由 404?**
A: `public/_redirects` 已经写了 SPA fallback。如果还 404,去 EdgeOne 项目设置看看是否需要开「单页应用模式」。

**Q: 调用很慢 / 超时?**
A: EdgeOne Function 默认超时 10s,DeepSeek 通常 3-5s 没问题。如果 timeout,换更快的模型或精简 prompt。

**Q: 想换成 OpenAI / Claude / Kimi?**
A: 改 `functions/api/parse.js` 里的 endpoint、headers、body 格式即可(大多兼容 OpenAI 协议),前端不用动。

**Q: 国外访客打不开?**
A: EdgeOne 的边缘节点国内最快,海外可能略慢。要全球加速可以在 EdgeOne 控制台开「全球加速」。或者部署一份到 Vercel 给海外用。
