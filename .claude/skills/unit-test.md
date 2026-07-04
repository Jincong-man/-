---
name: unit-test
description: 项目单元测试技能。支持运行测试、编写新测试、查看测试覆盖率。
skill_type: project
---

# unit-test

> 锦聪的小店 — 单元测试技能

## 功能概述

这个技能支持以下操作：

| 操作 | 说明 | 触发词 |
|------|------|--------|
| **运行所有测试** | 执行全部测试用例并展示结果 | "跑测试"、"运行测试"、"npm test" |
| **监视模式** | 文件改动后自动重新运行测试 | "监视测试"、"边改边测" |
| **编写新测试** | 为指定功能新增测试用例 | "写测试"、"加测试"、"补充测试" |
| **查看覆盖率** | 生成并展示代码覆盖率报告 | "覆盖率"、"测试覆盖" |
| **更新测试** | 修改代码后同步更新已有测试 | "更新测试" |

## 项目测试架构

```
在线购物网站/
├── tests/
│   ├── Jincong.test.js       ← 主测试文件（核心业务逻辑）
│   └── coverage/              ← 覆盖率报告目录（自动生成）
├── vitest.config.js           ← 测试框架配置
└── package.json               ← 依赖 & npm scripts
```

- **测试框架**：[Vitest](https://vitest.dev/)（兼容 Jest 语法，速度快）
- **浏览器模拟**：[happy-dom](https://github.com/capricorn86/happy-dom)（在 Node.js 中模拟 DOM & localStorage）
- **测试语言**：JavaScript（与项目保持一致）

## 测试覆盖的功能模块

[测试文件](tests/Jincong.test.js)覆盖了以下 6 个模块：

1. **🔍 搜索过滤** — 关键词搜索、空输入、大小写、无匹配
2. **🛒 购物车操作** — 添加、重复添加、增减数量、移除
3. **💰 购物车计算** — 总数量、总金额（含运费）
4. **👤 用户注册** — 密码校验、用户名重复、多错误
5. **🔑 用户登录** — 默认账号、密码错误、用户不存在
6. **📝 反馈表单** — 必填字段校验
7. **💾 localStorage** — 读写购物车和用户数据

## 如何写测试？

### 模仿现有测试

在 [tests/Jincong.test.js](tests/Jincong.test.js) 中，每个模块的结构如下：

```javascript
describe('模块名', () => {
  it('应该做某事', () => {
    // 1. 准备数据
    // 2. 调用被测试的函数
    // 3. 断言结果
    expect(结果).toBe(期望值);
  });
});
```

### 常用断言

```javascript
expect(x).toBe(y)           // 严格等于
expect(x).toEqual(obj)      // 对象深度相等
expect(arr).toHaveLength(n) // 数组长度
expect(arr).toContain(v)    // 数组包含
expect(x).toBeTruthy()      // 真值
expect(x).toBeNull()        // null
expect(x).toBeGreaterThan(n)// 大于
```

### 写测试的步骤

1. **提取纯函数** — 从 Vue 组件中把要测的逻辑抽成独立函数（放在测试文件顶部）
2. **写 `describe` 块** — 给这个功能取个分组名
3. **写 `it` 用例** — 每条用例描述一个具体场景
4. **写 `expect` 断言** — 检查结果是否符合预期

## 命令参考

项目 `package.json` 中定义了三个脚本：

```bash
# 运行所有测试（一次）
npm test

# 监视模式（改代码自动重跑）
npm run test:watch

# 生成覆盖率报告
npm run test:coverage
```
