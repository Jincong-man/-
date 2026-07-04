# 🛍️ 锦聪的小店 — 在线购物网站

基于 **Vue 3** 的响应式单页面在线购物网站，支持商品浏览、搜索、购物车、用户注册登录和反馈表单，适配桌面端、平板和手机端。

---

## 📸 项目预览

![商品展示界面](00.img/笔记本.png)

> 网站包含 **30 种商品**，涵盖电子产品、文具办公、生活用品等多个类别。

---

## 🚀 快速开始

### 环境要求

- 现代浏览器（Chrome / Edge / Firefox 最新版）
- 无需安装 Node.js 即可运行网站
- 运行测试需要 Node.js ≥ 18

### 运行项目

本项目是**纯静态页面**，直接双击 `Jincong.html` 即可在浏览器中打开。

或者用命令行：

```bash
# Windows
start Jincong.html

# macOS
open Jincong.html

# Linux
xdg-open Jincong.html
```

### 运行测试

```bash
# 安装依赖
npm install

# 运行测试
npm test

# 持续监听模式（边改代码边测试）
npm run test:watch

# 生成测试覆盖率报告
npm run test:coverage
```

---

## 🧱 项目结构

```
在线购物网站/
├── Jincong.html          # 主页面（Vue 3 模板 + HTML 结构）
├── Jincong.js            # 应用逻辑（Vue 组件、数据、方法）
├── Jincong.css           # 样式表（CSS 变量 + 响应式布局）
├── package.json          # 项目元数据 & 测试脚本
├── vitest.config.js      # Vitest 测试配置
├── tests/
│   └── Jincong.test.js   # 单元测试（Vitest + happy-dom）
└── 00.img/               # 商品图片资源（30 张）
```

---

## ✨ 功能特性

| 模块 | 功能说明 |
|------|---------|
| 🔍 **商品浏览与搜索** | 按商品名称、描述、分类实时过滤，结果即时更新 |
| 🛒 **购物车** | 添加商品、增减数量、移除商品，自动计算总价 |
| 👤 **用户注册与登录** | 密码哈希存储，支持多账号切换 |
| 📝 **用户反馈表单** | 收集用户意见和建议 |
| 📱 **响应式布局** | 自适应桌面端、平板和手机屏幕 |
| 💾 **本地存储** | 购物车、用户数据持久化存储在 `localStorage` 中 |

---

## 🛠️ 技术栈

| 技术 | 用途 | 说明 |
|------|------|------|
| **Vue 3** | 前端框架 | 通过 CDN 引入，无需构建工具 |
| **原生 CSS** | 样式 | CSS 自定义属性（变量）+ 响应式布局 |
| **localStorage** | 数据持久化 | 浏览器本地存储，无需后端服务器 |
| **Vitest** | 测试框架 | 单元测试，运行速度快 |
| **happy-dom** | DOM 模拟 | 在 Node.js 环境中模拟浏览器 DOM |

### 为什么选择这些技术？

- **Vue 3 CDN**：不需要 Webpack/Vite 等构建工具，适合初学者快速上手，同时也支持响应式数据绑定、条件渲染等现代前端特性。
- **localStorage**：数据保存在用户浏览器中，无需搭建后端服务器和数据库，适合学习和小型项目。
- **Vitest**：与 Vite 生态兼容，配置简单，比 Jest 更快，适合 Vue 项目测试。

---

## 📖 代码亮点

### 1. 安全的 localStorage 读写

```js
function safeGetJSON(key, fallback = null) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
        console.warn('localStorage 数据损坏，已清除:', key);
        localStorage.removeItem(key);
        return fallback;
    }
}
```

> 用 `try-catch` 包裹 `JSON.parse`，即使浏览器存储数据损坏也不会导致整个应用崩溃（白屏）。

### 2. 密码哈希

密码不以明文存储，使用哈希算法将密码转换为不可逆的哈希值，保护用户隐私。

### 3. CSS 设计令牌（Design Tokens）

所有颜色、阴影、圆角等样式值定义为 CSS 变量，统一管理，便于后续更换主题。

```css
:root {
    --primary: #146c63;
    --accent: #d96c3d;
    --shadow: 0 18px 45px rgba(65, 45, 20, 0.12);
    --radius-xl: 28px;
    /* ... */
}
```

---

## 🧪 测试

项目使用 **Vitest** + **happy-dom** 进行单元测试，覆盖核心功能：

- ✅ 工具函数（`safeGetJSON`、`safeSetJSON`、`hashPassword`）
- ✅ 商品数据完整性
- ✅ 购物车操作（添加、增减、移除）
- ✅ 用户注册与登录逻辑
- ✅ 搜索与过滤功能

```bash
npm test          # 运行所有测试
npm run test:coverage  # 查看覆盖率
```

---

## 📝 后续可以优化的方向

- [ ] 接入真实后端 API（如 Node.js / Express）
- [ ] 使用数据库替代 localStorage（如 SQLite / MongoDB）
- [ ] 商品详情页（独立页面或弹窗）
- [ ] 订单结算流程
- [ ] 接入支付接口（支付宝 / 微信支付）
- [ ] 图片懒加载优化性能

---

## 📄 开源协议

本项目基于 [MIT License](https://opensource.org/licenses/MIT) 开源，欢迎学习和交流。

---

## 👨‍💻 作者

**Jincong Yuan（锦聪）**

---

*Happy coding! 🎉*
