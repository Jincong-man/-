# 🛍️ 锦聪的小店 — 在线购物网站

基于 **Vue 3** 的响应式单页面（SPA）在线购物网站，纯静态页面，无需构建工具。支持商品浏览与搜索、购物车管理、用户注册登录（含防暴力破解）、用户反馈表单，全面适配桌面端、平板和手机端。

---

## 📸 项目预览

![商品展示界面](00.img/笔记本.png)

> 网站包含 **30 种商品**，分为个人闲置、校内商品、线上精选三大类别。

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

### 演示账号

| 用户名 | 密码 |
|--------|------|
| `demo` | `demo123456` |

> 首次访问时会自动创建演示账号，刷新页面后点击"登录 / 注册"即可登录体验全部功能。

### 运行测试

```bash
# 安装依赖（仅首次）
npm install

# 运行所有测试（共 30+ 条用例）
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
├── Jincong.html          # 主页面（Vue 3 模板 + HTML 结构，236 行）
├── Jincong.js            # 应用逻辑（Vue 组件、数据、方法，569 行）
├── Jincong.css           # 样式表（CSS 变量 + 响应式布局，698 行）
├── package.json          # 项目元数据 & 测试脚本
├── vitest.config.js      # Vitest 测试配置
├── .gitignore            # Git 忽略规则
├── tests/
│   └── Jincong.test.js   # 单元测试（Vitest + happy-dom，494 行）
├── 00.img/               # 商品图片资源（30 张）
└── node_modules/         # 测试依赖（不入版本控制）
```

---

## ✨ 功能特性

| 模块 | 功能说明 |
|------|---------|
| 🔍 **商品浏览与搜索** | 按商品**名称**、**描述**、**分类**三个维度实时过滤，结果即时更新 |
| 🗂️ **三大商品分类** | 个人闲置（10 件）、校内商品（10 件）、线上精选（10 件），每件含名称、价格、运费、描述 |
| 🛒 **购物车** | 添加商品、增减数量（减到 0 自动移除）、移除商品，自动计算订单总价（含运费） |
| 👤 **用户注册与登录** | 密码哈希存储，支持多账号，注册即自动登录 |
| 🔒 **防暴力破解** | 连续 5 次登录失败 → 锁定 15 分钟 |
| 📝 **用户反馈表单** | 收集用户姓名、邮箱和留言内容 |
| 📱 **响应式布局** | 移动端折叠菜单、平板侧栏、桌面端多栏布局自适应 |
| 💾 **数据持久化** | 购物车、用户数据通过 `localStorage` 持久化，刷新不丢失 |
| 📊 **实时统计面板** | 在售商品数、购物车件数、当前搜索结果数 |

---

## 🛠️ 技术栈

| 技术 | 用途 | 说明 |
|------|------|------|
| **Vue 3** | 前端框架 | 通过 CDN（`unpkg.com`）引入，无需 Webpack/Vite |
| **原生 CSS** | 样式 | CSS 自定义属性（变量）+ Flexbox + Grid + 响应式 |
| **localStorage** | 数据持久化 | 浏览器本地存储，无需后端和数据库 |
| **Vitest** | 测试框架 | 运行速度快，与 Vite 生态兼容 |
| **happy-dom** | DOM 模拟 | 在 Node.js 环境中模拟浏览器 DOM |

### 为什么选择这些技术？

- **Vue 3 CDN**：零构建配置，适合初学者快速上手，同时支持响应式数据绑定、计算属性、条件渲染等现代前端特性。
- **localStorage**：数据保存在用户浏览器中，无需搭建后端服务器和数据库，适合学习和中小型项目。
- **Vitest + happy-dom**：配置简单，比 Jest 更快，原生支持 ES Module，适合无构建工具的项目测试。

---

## 📖 代码亮点

### 1. 安全的 localStorage 读写

`localStorage` 中的数据可能因手动修改、浏览器升级或存储空间不足而损坏。用 `try-catch` 包裹 `JSON.parse`，即使数据损坏也不会导致整个应用崩溃（白屏）：

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

### 2. 密码哈希

密码**绝不**以明文存储。用户注册时，密码经过带盐值（salt）的哈希算法转换后才存入 `localStorage`。登录时比较的是两个哈希值——即使数据泄露，攻击者也看不到原始密码。

```js
function hashPassword(password) {
    const salt = 'jincong-shop-2026';
    let hash = 0;
    const combined = password + salt;
    for (let i = 0; i < combined.length; i++) {
        hash = ((hash << 5) - hash) + combined.charCodeAt(i);
        hash = hash & hash;  // 保持 32 位整数
    }
    return Math.abs(hash).toString(16);
}
```

> ⚠️ 这是教学版实现。实际项目中应使用 bcrypt、argon2 或 PBKDF2 等专业密码哈希库。

### 3. 登录锁定机制（防暴力破解）

连续 5 次输错密码后，账户锁定 **15 分钟**，阻止攻击者用脚本无限尝试密码组合：

```js
if (this.loginFailCount >= 5) {
    this.loginLockUntil = Date.now() + 900000;  // 15 分钟 = 90 万毫秒
    alert('登录失败次数过多，账户已锁定 15 分钟。');
}
```

### 4. CSS 设计令牌（Design Tokens）

所有颜色、阴影、圆角等样式值通过 CSS 自定义属性统一管理，改一个变量即可全局生效，便于后续更换主题：

```css
:root {
    --primary: #146c63;
    --primary-dark: #0d4d47;
    --accent: #d96c3d;
    --accent-soft: #f4d9c9;
    --shadow: 0 18px 45px rgba(65, 45, 20, 0.12);
    --radius-xl: 28px;
    --radius-lg: 20px;
    --radius-md: 14px;
}
```

### 5. 多层渐变背景

页面背景使用三层 `radial-gradient` + `linear-gradient` 叠加，营造温暖柔和的视觉氛围：

```css
body {
    background:
        radial-gradient(circle at top left, rgba(217, 108, 61, 0.15), transparent 28%),
        radial-gradient(circle at right 20%, rgba(20, 108, 99, 0.14), transparent 26%),
        linear-gradient(180deg, #f7f1e8 0%, #f4ede1 100%);
}
```

### 6. 演示账号自动创建

首次访问时，`ensureDemoAccount()` 自动创建演示账号（用户名 `demo`，密码`demo123456`），密码经过哈希后再存储。比在代码中硬编码密码更安全。

---

## 🧪 测试

项目使用 **Vitest** + **happy-dom** 进行单元测试（共 494 行测试代码），覆盖以下核心功能：

| 测试模块 | 内容 |
|---------|------|
| 🔐 **工具函数** | `safeGetJSON` / `safeSetJSON` 正常读写与异常保护、`hashPassword` 哈希稳定性 |
| 📦 **商品数据** | 数据结构完整性、30 件商品 ID 唯一性、分类数量正确 |
| 🔍 **搜索过滤** | 按名称/描述/分类匹配、空关键词返回全部、不区分大小写、零匹配 |
| 🛒 **购物车操作** | 添加商品、增加数量、减少数量（0 → 自动移除）、移除商品、去重 |
| 💰 **购物车计算** | `cartCount` 总数、`cartTotal` 含运费总价 |
| 👤 **用户认证** | 注册（密码长度 ≥ 8、确认密码一致、用户名重复检测）、登录（正确/错误/锁定后拒绝） |
| 📝 **反馈表单** | 必填字段校验（姓名/邮箱/留言） |

```bash
npm test              # 运行所有测试
npm run test:coverage # 查看覆盖率报告
```

---

## 📱 响应式适配

| 屏幕宽度 | 布局 |
|---------|------|
| **≤ 640px**（手机） | 单栏排列，菜单折叠为汉堡按钮，商品卡片全宽 |
| **641px – 1024px**（平板） | 两栏布局，购物车与商品区并排显示 |
| **≥ 1025px**（桌面） | 最大宽度 1320px，超大圆角卡片，悬停动效 |

---

## 📝 后续优化方向

- [ ] 接入真实后端 API（如 Node.js / Express）
- [ ] 使用数据库替代 localStorage（如 SQLite / MongoDB）
- [ ] 商品详情页（独立页面或弹窗）
- [ ] 订单结算完整流程（收货地址、支付方式）
- [ ] 接入支付接口（支付宝 / 微信支付）
- [ ] 图片懒加载优化性能
- [ ] 使用 bcrypt / argon2 替代自定义哈希

---

## 📄 开源协议

本项目基于 [MIT License](https://opensource.org/licenses/MIT) 开源，欢迎学习和交流。

---

## 👨‍💻 作者

**Jincong Yuan（锦聪）**

---

*Happy coding! 🎉*
