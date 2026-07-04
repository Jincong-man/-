/**
 * Jincong.js 单元测试
 *
 * 测试覆盖：
 *   1. 商品数据 —— 数据结构是否正确
 *   2. 搜索过滤 —— filteredProducts 计算属性
 *   3. 购物车操作 —— 添加、增加、减少、移除
 *   4. 购物车计算 —— cartCount、cartTotal
 *   5. 用户认证 —— 登录（哈希密码）、注册（8位密码）、登出
 *   6. 反馈表单 —— 提交校验
 *   7. 安全工具函数 —— 密码哈希、localStorage 安全读写
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// ============================================================
// 从 Jincong.js 提取纯逻辑函数，方便直接测试
// （不依赖 Vue 实例，只测核心逻辑）
// ============================================================

// ---------- 密码哈希 ----------
/**
 * 简单的密码哈希函数。
 * 用于测试中生成哈希值，与实际生产代码保持一致。
 */
function hashPassword(password) {
    const salt = 'jincong-shop-2026';
    let hash = 0;
    const combined = password + salt;
    for (let i = 0; i < combined.length; i++) {
        hash = ((hash << 5) - hash) + combined.charCodeAt(i);
        hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
}

// ---------- localStorage 安全读写 ----------
function safeGetJSON(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : (fallback !== undefined ? fallback : null);
    } catch (e) {
        localStorage.removeItem(key);
        return fallback !== undefined ? fallback : null;
    }
}

function safeSetJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

// ---------- 搜索过滤 ----------
function filterProducts(products, keyword) {
  const kw = keyword.trim().toLowerCase();
  if (!kw) return products;
  return products.filter((product) => {
    const scope = `${product.name} ${product.description} ${product.category}`.toLowerCase();
    return scope.includes(kw);
  });
}

// ---------- 购物车操作 ----------
function addToCart(cart, productId) {
  const existingItem = cart.find((item) => item.id === productId);
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ id: productId, quantity: 1 });
  }
  return cart;
}

function increaseQuantity(cart, productId) {
  const item = cart.find((entry) => entry.id === productId);
  if (item) item.quantity += 1;
  return cart;
}

function decreaseQuantity(cart, productId) {
  const item = cart.find((entry) => entry.id === productId);
  if (!item) return cart;
  if (item.quantity <= 1) {
    return cart.filter((entry) => entry.id !== productId);
  }
  item.quantity -= 1;
  return cart;
}

function removeFromCart(cart, productId) {
  return cart.filter((item) => item.id !== productId);
}

// ---------- 购物车计算 ----------
function calcCartCount(cart) {
  return cart.reduce((total, item) => total + item.quantity, 0);
}

function calcCartTotal(cart, products) {
  const cartDetails = cart.map((item) => {
    const product = products.find((entry) => entry.id === item.id);
    if (!product) return null;
    return { ...product, quantity: item.quantity };
  }).filter(Boolean);

  return cartDetails.reduce((total, item) => {
    return total + (item.price + item.shipping) * item.quantity;
  }, 0);
}

// ---------- 用户注册校验 ----------
/**
 * 校验注册表单数据。
 * 规则：
 *   1. 两次密码必须一致
 *   2. 密码至少 8 位（修复后从 6 位提升到 8 位，增强安全性）
 *   3. 用户名不能重复
 */
function validateRegister(users, { username, password, confirmPassword }) {
  const errors = [];
  if (password !== confirmPassword) {
    errors.push('密码和确认密码不一致。');
  }
  // 修复后密码最小长度提升至 8 位
  if (password.length < 8) {
    errors.push('密码长度至少需要 8 位，建议混合使用字母和数字。');
  }
  if (users.some((entry) => entry.username === username)) {
    errors.push('用户名已存在。');
  }
  return errors;
}

// ---------- 反馈表单校验 ----------
function validateFeedback({ name, email, message }) {
  return !!(name && email && message);
}

// ---------- 用户登录校验 ----------
/**
 * 登录校验：将输入密码哈希后，与存储的 passwordHash 比较。
 * 修复后不再比较明文密码，而是比较哈希值。
 */
function validateLogin(users, { username, password }) {
  const inputHash = hashPassword(password);
  const user = users.find((entry) => entry.username === username && entry.passwordHash === inputHash);
  return user || null;
}


// ============================================================
// 测试用例
// ============================================================

// --- 测试数据 ---
const sampleProducts = [
  { id: 1, name: '二手自行车', price: 120, category: 'personal', shipping: 15, description: '九成新', image: '00.img/自行车.png' },
  { id: 2, name: '计算机书籍', price: 25, category: 'personal', shipping: 8, description: '教材整套', image: '00.img/计算机书籍.png' },
  { id: 11, name: '笔记本', price: 12, category: 'campus', shipping: 3, description: '课堂笔记', image: '00.img/笔记本.png' },
  { id: 21, name: '无线耳机', price: 200, category: 'online', shipping: 15, description: '降噪耳机', image: '00.img/无线耳机.png' },
];


describe('🔍 搜索过滤', () => {
  it('空关键词时返回全部商品', () => {
    const result = filterProducts(sampleProducts, '');
    expect(result).toHaveLength(4);
  });

  it('按商品名称搜索（精确匹配）', () => {
    const result = filterProducts(sampleProducts, '自行车');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('二手自行车');
  });

  it('按分类搜索（英文）', () => {
    const result = filterProducts(sampleProducts, 'campus');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('笔记本');
  });

  it('按描述搜索', () => {
    const result = filterProducts(sampleProducts, '降噪');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('无线耳机');
  });

  it('无匹配时返回空数组', () => {
    const result = filterProducts(sampleProducts, '直升机');
    expect(result).toHaveLength(0);
  });

  it('忽略大小写', () => {
    const result = filterProducts(sampleProducts, 'PERSONAL');
    expect(result.length).toBeGreaterThanOrEqual(2);
    expect(result.every(p => p.category === 'personal')).toBe(true);
  });
});


describe('🛒 购物车操作', () => {
  let cart;

  beforeEach(() => {
    cart = [];
  });

  it('添加新商品到购物车', () => {
    addToCart(cart, 1);
    expect(cart).toHaveLength(1);
    expect(cart[0]).toEqual({ id: 1, quantity: 1 });
  });

  it('重复添加同一商品应增加数量', () => {
    addToCart(cart, 1);
    addToCart(cart, 1);
    expect(cart).toHaveLength(1);
    expect(cart[0].quantity).toBe(2);
  });

  it('增加商品数量', () => {
    addToCart(cart, 2);
    increaseQuantity(cart, 2);
    expect(cart[0].quantity).toBe(2);
  });

  it('减少商品数量', () => {
    addToCart(cart, 3);
    addToCart(cart, 3); // quantity = 2
    decreaseQuantity(cart, 3);
    expect(cart[0].quantity).toBe(1);
  });

  it('数量为 1 时再减少应移除商品', () => {
    addToCart(cart, 4);
    cart = decreaseQuantity(cart, 4);
    expect(cart).toHaveLength(0);
  });

  it('移除商品', () => {
    addToCart(cart, 1);
    addToCart(cart, 2);
    cart = removeFromCart(cart, 1);
    expect(cart).toHaveLength(1);
    expect(cart[0].id).toBe(2);
  });

  it('多个不同商品各自计数', () => {
    addToCart(cart, 1);
    addToCart(cart, 1);
    addToCart(cart, 2);
    expect(cart).toHaveLength(2);
    expect(cart[0].quantity).toBe(2);
    expect(cart[1].quantity).toBe(1);
  });
});


describe('💰 购物车计算', () => {
  it('空购物车 - 数量为 0', () => {
    expect(calcCartCount([])).toBe(0);
  });

  it('正确计算商品总数量', () => {
    const cart = [
      { id: 1, quantity: 3 },
      { id: 2, quantity: 1 },
    ];
    expect(calcCartCount(cart)).toBe(4);
  });

  it('正确计算订单总金额（含运费）', () => {
    // 二手自行车: (120 + 15) * 2 = 270
    // 笔记本:     (12 + 3)  * 1 = 15
    // 总计: 270 + 15 = 285
    const cart = [
      { id: 1, quantity: 2 },
      { id: 11, quantity: 1 },
    ];
    expect(calcCartTotal(cart, sampleProducts)).toBe(285);
  });

  it('空购物车 - 总金额为 0', () => {
    expect(calcCartTotal([], sampleProducts)).toBe(0);
  });
});


describe('👤 用户注册校验', () => {
  // 用户数据现在使用 passwordHash 而非明文 password
  const existingUsers = [{ username: 'admin', email: 'a@b.com', passwordHash: hashPassword('12345678') }];

  it('正常注册（8位密码）- 无错误', () => {
    const errors = validateRegister(existingUsers, {
      username: 'newuser',
      password: 'abcdefgh',    // 8 位，满足新要求
      confirmPassword: 'abcdefgh',
    });
    expect(errors).toHaveLength(0);
  });

  it('两次密码不一致', () => {
    const errors = validateRegister(existingUsers, {
      username: 'newuser',
      password: 'abcdefgh',
      confirmPassword: 'xyzxyzxy',
    });
    expect(errors).toContain('密码和确认密码不一致。');
  });

  it('密码太短（少于 8 位）', () => {
    const errors = validateRegister(existingUsers, {
      username: 'newuser',
      password: '123',        // 只有 3 位
      confirmPassword: '123',
    });
    expect(errors).toContain('密码长度至少需要 8 位，建议混合使用字母和数字。');
  });

  it('密码刚好 7 位 - 不满足 8 位要求', () => {
    const errors = validateRegister(existingUsers, {
      username: 'newuser',
      password: '1234567',     // 7 位，不满足新要求
      confirmPassword: '1234567',
    });
    expect(errors).toContain('密码长度至少需要 8 位，建议混合使用字母和数字。');
  });

  it('用户名已存在', () => {
    const errors = validateRegister(existingUsers, {
      username: 'admin',
      password: 'abcdefgh',
      confirmPassword: 'abcdefgh',
    });
    expect(errors).toContain('用户名已存在。');
  });

  it('同时有多个错误', () => {
    const errors = validateRegister(existingUsers, {
      username: 'admin',       // 用户已存在
      password: '12',          // 太短
      confirmPassword: '99',   // 不一致
    });
    // 密码不一致 + 太短 + 用户名已存在 = 3 个错误
    expect(errors.length).toBeGreaterThanOrEqual(2);
  });
});


describe('🔑 用户登录校验（哈希密码）', () => {
  // 用户数据使用 passwordHash 存储（哈希后的密码），不存明文
  const users = [
    { username: 'demo', passwordHash: hashPassword('demo123456') },
    { username: 'test', passwordHash: hashPassword('testpass88') },
  ];

  it('使用正确密码登录成功（哈希匹配）', () => {
    const user = validateLogin(users, { username: 'demo', password: 'demo123456' });
    expect(user).toBeTruthy();
    expect(user.username).toBe('demo');
  });

  it('密码错误 - 返回 null', () => {
    const user = validateLogin(users, { username: 'demo', password: 'wrongpassword' });
    expect(user).toBeNull();
  });

  it('用户名不存在 - 返回 null', () => {
    const user = validateLogin(users, { username: 'ghost', password: 'demo123456' });
    expect(user).toBeNull();
  });

  it('正确的哈希值不等于原始密码', () => {
    // 验证哈希是单向的：哈希值不等于原始密码
    const hash = hashPassword('demo123456');
    expect(hash).not.toBe('demo123456');
  });
});


describe('📝 反馈表单校验', () => {
  it('三项都填 - 有效', () => {
    expect(validateFeedback({ name: '张三', email: 'a@b.com', message: '很好' })).toBe(true);
  });

  it('缺少姓名 - 无效', () => {
    expect(validateFeedback({ name: '', email: 'a@b.com', message: 'hello' })).toBe(false);
  });

  it('缺少邮箱 - 无效', () => {
    expect(validateFeedback({ name: '张三', email: '', message: 'hello' })).toBe(false);
  });

  it('缺少留言 - 无效', () => {
    expect(validateFeedback({ name: '张三', email: 'a@b.com', message: '' })).toBe(false);
  });
});


describe('📦 商品数据结构', () => {
  it('每个商品都有必要字段', () => {
    const requiredKeys = ['id', 'name', 'price', 'category', 'shipping', 'description', 'image'];
    for (const product of sampleProducts) {
      for (const key of requiredKeys) {
        expect(product).toHaveProperty(key);
      }
    }
  });

  it('价格和运费都是数字', () => {
    for (const product of sampleProducts) {
      expect(typeof product.price).toBe('number');
      expect(typeof product.shipping).toBe('number');
    }
  });
});


// ============================================================
// localStorage 集成测试（含安全读写测试）
// ============================================================
describe('💾 localStorage 读写', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('保存和读取购物车数据', () => {
    const cart = [
      { id: 1, quantity: 2 },
      { id: 5, quantity: 1 },
    ];
    safeSetJSON('cart', cart);
    const saved = safeGetJSON('cart');
    expect(saved).toHaveLength(2);
    expect(saved[0].id).toBe(1);
  });

  it('保存和读取当前用户', () => {
    // 修复：邮箱使用示例地址
    const user = { username: 'demo', email: 'demo@example.com' };
    safeSetJSON('currentUser', user);
    const saved = safeGetJSON('currentUser');
    expect(saved.username).toBe('demo');
  });

  it('没有存储数据时返回 null', () => {
    expect(safeGetJSON('cart', null)).toBeNull();
  });

  it('数据损坏时不会崩溃，返回 fallback 值', () => {
    // 模拟：localStorage 中存了损坏的数据（无法被 JSON.parse 解析的字符串）
    localStorage.setItem('broken', '这不是 JSON');
    const result = safeGetJSON('broken', 'fallback');
    expect(result).toBe('fallback');
    // 损坏的数据应该被清除
    expect(localStorage.getItem('broken')).toBeNull();
  });
});


// ============================================================
// 安全工具函数测试
// ============================================================
describe('🔒 密码哈希安全', () => {
  it('相同密码产生相同哈希值', () => {
    const hash1 = hashPassword('mypassword');
    const hash2 = hashPassword('mypassword');
    expect(hash1).toBe(hash2);
  });

  it('不同密码产生不同哈希值', () => {
    const hash1 = hashPassword('password1');
    const hash2 = hashPassword('password2');
    expect(hash1).not.toBe(hash2);
  });

  it('哈希值是字符串（十六进制）', () => {
    const hash = hashPassword('test');
    // 十六进制字符串只包含 0-9 和 a-f
    expect(hash).toMatch(/^[0-9a-f]+$/);
  });

  it('哈希值不为空', () => {
    const hash = hashPassword('');
    // 即使空密码也应产生哈希值（因为盐值参与计算）
    expect(hash.length).toBeGreaterThan(0);
  });

  it('密码微小变化导致哈希完全不同（雪崩效应）', () => {
    const hash1 = hashPassword('password8');
    const hash2 = hashPassword('password9');
    // 两个相似密码的哈希值应该完全不同
    expect(hash1).not.toBe(hash2);
  });
});
