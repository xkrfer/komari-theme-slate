# Slate

石板克制、表优先的 [Komari](https://github.com/komari-monitor/komari) 主题。需要 **Komari >= 1.0.7**（RPC2）。

## 安装

1. 下载 Release 里的 `komari-theme-slate.zip`，或本地执行 `pnpm package`。
2. 在 Komari 后台上传 ZIP 并启用 **Slate**。
3. 主题设置里只有两项：默认外观、访客默认视图（仅约束桌面首次访问；手机仍默认卡片）。

## 开发

包管理只用 pnpm。

```bash
pnpm install
cp .env.example .env
# 按需修改 VITE_API_TARGET，默认 http://127.0.0.1:25774
pnpm dev
```

构建与打包：

```bash
pnpm build
pnpm package
```

提交前 husky + lint-staged 会跑 Biome。
