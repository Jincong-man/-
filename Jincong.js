/**
 * 锦聪的小店 — 在线购物网站
 * ==========================================
 * 基于 Vue 3 的响应式单页面应用（SPA）。
 * 不依赖构建工具，通过 CDN 引入 Vue 3，
 * 数据存储在浏览器的 localStorage 中。
 *
 * 核心功能：
 *   1. 商品浏览与搜索（按名称/描述/分类过滤）
 *   2. 购物车操作（添加、增减数量、移除）
 *   3. 用户注册与登录（密码哈希存储）
 *   4. 用户反馈表单
 *   5. 响应式布局（移动端/平板/桌面端适配）
 */

/* ============================================================
   工具函数
   ============================================================ */

/**
 * 安全地从 localStorage 读取并解析 JSON 数据。
 *
 * 为什么需要 try-catch 保护？
 * localStorage 中的数据可能因以下原因损坏：
 * - 用户手动在开发者工具中修改了数据
 * - 浏览器版本升级导致数据格式不兼容
 * - 存储空间不足导致数据截断
 * 如果不捕获异常，JSON.parse 报错会导致整个 Vue 应用崩溃（白屏）。
 *
 * @param {string} key - localStorage 的键名
 * @param {*} fallback - 解析失败或数据不存在时的默认值
 * @returns {*} 解析后的数据，或 fallback 默认值
 */
function safeGetJSON(key, fallback = null) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
        // 数据损坏时清除坏数据，返回默认值，保证应用不崩溃
        console.warn('localStorage 数据损坏，已清除:', key);
        localStorage.removeItem(key);
        return fallback;
    }
}

/**
 * 将数据安全地写入 localStorage。
 * @param {string} key - localStorage 的键名
 * @param {*} value - 要存储的数据（会自动转为 JSON 字符串）
 */
function safeSetJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

/**
 * 简单的密码哈希函数（学习用途）。
 *
 * 什么是哈希（Hash）？
 * 哈希是一种单向加密算法：能把密码变成一串固定长度的"乱码"（哈希值），
 * 但无法从乱码反推出原始密码。即使数据库泄露，攻击者也看不到原始密码。
 *
 * 登录时：用户输入密码 → 再次哈希 → 比较两个哈希值是否相同。
 *
 * ⚠️ 注意：这是一个简化的教学版本。
 * 实际项目中应使用 bcrypt、argon2 或 PBKDF2 等专业密码哈希算法，
 * 它们会自动处理盐值（salt，即随机字符串）和多次迭代。
 *
 * @param {string} password - 原始密码
 * @returns {string} 密码的哈希值（十六进制字符串）
 */
function hashPassword(password) {
    // 盐值（salt）：一个固定的额外字符串，混入密码一起哈希
    // 作用：即使两个用户设置了相同密码，加入盐值后哈希结果也不同
    const salt = 'jincong-shop-2026';
    // 使用内置的简单哈希：将每个字符编码后累加变换
    let hash = 0;
    const combined = password + salt;
    for (let i = 0; i < combined.length; i++) {
        // 左移5位 + 当前字符编码，产生雪崩效应（输入微小变化 → 输出巨大变化）
        hash = ((hash << 5) - hash) + combined.charCodeAt(i);
        hash = hash & hash; // 保持 32 位整数范围
    }
    // 转成十六进制字符串，确保只有数字和字母 a-f，便于存储
    return Math.abs(hash).toString(16);
}

/**
 * 检查 localStorage 中是否已有预置的演示账号。
 * 如果没有（首次访问），自动创建一个演示账号供测试使用。
 *
 * 为什么不在代码中硬编码密码？
 * 硬编码的密码任何人查看网页源码就能看到，毫无安全性可言。
 * 改为在首次访问时动态创建账号，密码经过哈希后再存储。
 */
function ensureDemoAccount() {
    const users = safeGetJSON('users', []);
    // 检查演示账号是否已存在（通过固定的用户名标识）
    const demoExists = users.some(function (u) {
        return u.username === 'demo';
    });
    if (!demoExists) {
        // 首次访问：创建演示账号，密码经过哈希处理
        users.push({
            username: 'demo',
            email: 'demo@example.com',  // 使用示例邮箱，不暴露真实邮箱
            passwordHash: hashPassword('demo123456')  // 存储哈希值，不存明文密码
        });
        safeSetJSON('users', users);
    }
    return users;
}

/* ============================================================
   Vue 应用主入口
   ============================================================ */
const { createApp } = Vue;

createApp({
    data() {
        return {
            /* ---- 界面状态 ---- */
            menuOpen: false,              // 移动端菜单是否展开
            authModalOpen: false,          // 登录/注册弹窗是否打开
            feedbackModalOpen: false,      // 反馈弹窗是否打开
            authMode: 'login',             // 当前认证模式：'login'（登录）或 'register'（注册）
            searchKeyword: '',             // 搜索框输入的关键词
            currentUser: null,             // 当前登录的用户对象（null 表示未登录）

            /* ---- 登录安全：失败次数限制 ---- */
            // 为什么需要限制？
            // 不加限制时，攻击者可以写脚本无限尝试用户名和密码组合（暴力破解），
            // 短短几分钟就能试出弱密码。限制失败次数可以大幅增加破解难度。
            loginFailCount: 0,             // 连续登录失败次数
            loginLockUntil: null,          // 锁定截止时间（时间戳），null 表示未锁定

            /* ---- 商品数据 ---- */
            // 共 30 件商品，分三个分类：个人闲置 / 校内商品 / 线上精选
            products: [
                { id: 1, name: '二手自行车', price: 120, category: 'personal', shipping: 15, description: '九成新，适合校园代步，车况稳定。', image: '00.img/自行车.png' },
                { id: 2, name: '计算机书籍', price: 25, category: 'personal', shipping: 8, description: '专业课教材整套出售，适合复习与备考。', image: '00.img/计算机书籍.png' },
                { id: 3, name: '蓝牙耳机', price: 80, category: 'personal', shipping: 10, description: '无线连接稳定，续航充足，适合通勤。', image: '00.img/蓝牙耳机.png' },
                { id: 4, name: '电竞鼠标', price: 60, category: 'personal', shipping: 12, description: '高 DPI 鼠标，手感轻巧，适合游戏与办公。', image: '00.img/电竞鼠标.png' },
                { id: 5, name: '便携键盘', price: 45, category: 'personal', shipping: 10, description: '轻薄便携，可折叠，适合平板与手机输入。', image: '00.img/便携键盘.png' },
                { id: 6, name: '运动手环', price: 90, category: 'personal', shipping: 8, description: '支持心率监测与日常运动记录。', image: '00.img/运动手环.png' },
                { id: 7, name: '佳能相机', price: 1200, category: 'personal', shipping: 30, description: '单反相机成色好，附带镜头与电池。', image: '00.img/佳能相机.png' },
                { id: 8, name: '平板电脑', price: 450, category: 'personal', shipping: 20, description: '二手平板，屏幕清晰，适合追剧和学习。', image: '00.img/平板电脑.png' },
                { id: 9, name: '智能手表', price: 180, category: 'personal', shipping: 12, description: '支持消息提醒、健康监测与运动追踪。', image: '00.img/智能手表.png' },
                { id: 10, name: '游戏手柄', price: 75, category: 'personal', shipping: 10, description: '无线手柄，兼容多个平台。', image: '00.img/游戏手柄.png' },
                { id: 11, name: '笔记本', price: 12, category: 'campus', shipping: 3, description: '校园文具店热销款，纸张厚实，适合课堂笔记。', image: '00.img/笔记本.png' },
                { id: 12, name: '签字笔', price: 2, category: 'campus', shipping: 3, description: '黑色签字笔，10 支装，适合日常书写。', image: '00.img/签字笔.png' },
                { id: 13, name: 'A4文件夹', price: 8, category: 'campus', shipping: 3, description: 'A4 大小，收纳试卷和资料更方便。', image: '00.img/A4文件夹.png' },
                { id: 14, name: '计算器', price: 15, category: 'campus', shipping: 3, description: '科学计算器，适用于考试和课程学习。', image: '00.img/计算器.png' },
                { id: 15, name: '双肩包', price: 45, category: 'campus', shipping: 5, description: '校园通勤双肩包，容量大，背负轻松。', image: '00.img/双肩包.png' },
                { id: 16, name: '水杯', price: 20, category: 'campus', shipping: 3, description: '日常随身杯，适合教室和图书馆使用。', image: '00.img/水杯.png' },
                { id: 17, name: '雨伞', price: 25, category: 'campus', shipping: 5, description: '晴雨两用伞，抗风性能稳定。', image: '00.img/雨伞.png' },
                { id: 18, name: '便签纸', price: 3, category: 'campus', shipping: 3, description: '彩色便签，适合课程提醒与复习标记。', image: '00.img/便签纸.png' },
                { id: 19, name: '订书机', price: 12, category: 'campus', shipping: 3, description: '小型订书机，交作业整理资料都顺手。', image: '00.img/订书机.png' },
                { id: 20, name: '圆珠笔', price: 1, category: 'campus', shipping: 3, description: '单支圆珠笔，适合补充采购。', image: '00.img/圆珠笔.png' },
                { id: 21, name: '无线耳机', price: 200, category: 'online', shipping: 15, description: '降噪无线耳机，适合学习和出行。', image: '00.img/无线耳机.png' },
                { id: 22, name: 'AI音箱', price: 350, category: 'online', shipping: 20, description: '语音助手音箱，支持智能控制。', image: '00.img/AI音箱.png' },
                { id: 23, name: '运动鞋', price: 420, category: 'online', shipping: 18, description: '轻量运动鞋，透气舒适，适合日常穿着。', image: '00.img/运动鞋.png' },
                { id: 24, name: '双肩包Pro', price: 180, category: 'online', shipping: 15, description: '户外风格背包，防泼水材质，分区实用。', image: '00.img/双肩包.png' },
                { id: 25, name: '保温杯', price: 60, category: 'online', shipping: 12, description: '长效保温杯，显示温度，通勤友好。', image: '00.img/保温杯.png' },
                { id: 26, name: '手机支架', price: 15, category: 'online', shipping: 8, description: '桌面支架，多角度调节，适合追剧和上课。', image: '00.img/手机支架.png' },
                { id: 27, name: '充电宝', price: 90, category: 'online', shipping: 10, description: '10000mAh 快充移动电源。', image: '00.img/充电宝.png' },
                { id: 28, name: '蓝牙音箱', price: 120, category: 'online', shipping: 12, description: '便携式音箱，支持户外使用。', image: '00.img/蓝牙音箱.png' },
                { id: 29, name: '智能门锁', price: 899, category: 'online', shipping: 30, description: '指纹解锁与远程管理兼备。', image: '00.img/门锁.png' },
                { id: 30, name: '空气净化器', price: 1200, category: 'online', shipping: 40, description: '适合宿舍与小空间的净化设备。', image: '00.img/空气净化器.png' }
            ],

            /* ---- 购物车 ---- */
            // 购物车是一个数组，每个元素包含商品 id 和数量
            // 例如：[{ id: 1, quantity: 2 }, { id: 5, quantity: 1 }]
            cart: [],

            /* ---- 分类信息 ---- */
            categorySections: [
                { id: 'personal', title: '个人闲置', en: 'Personal Market', short: '闲置' },
                { id: 'campus', title: '校内商品', en: 'Campus Goods', short: '校内' },
                { id: 'online', title: '线上精选', en: 'Online Picks', short: '线上' }
            ],

            /* ---- 表单数据 ---- */
            loginForm: {
                username: '',
                password: ''
            },
            registerForm: {
                username: '',
                email: '',
                password: '',
                confirmPassword: ''
            },
            feedbackForm: {
                name: '',
                email: '',
                message: ''
            }
        };
    },

    /* ============================================================
       计算属性（Computed Properties）
       ============================================================

       什么是计算属性？
       Vue 中的计算属性会根据依赖的数据自动重新计算。
       比如 filteredProducts 依赖 searchKeyword 和 products，
       当搜索关键词或商品列表变化时，它会自动更新。

       和方法的区别：计算属性有缓存——依赖不变时不重新计算，性能更好。
       ============================================================ */

    computed: {
        /**
         * 根据搜索关键词过滤商品。
         * 匹配范围：商品名称、描述、分类（三个字段都会参与搜索）。
         * 空关键词时返回全部商品。
         */
        filteredProducts() {
            // 去除首尾空格并转为小写，实现不区分大小写的搜索
            const keyword = this.searchKeyword.trim().toLowerCase();
            // 无关键词：返回所有商品
            if (!keyword) {
                return this.products;
            }
            // 有关键词：在名称+描述+分类的组合字符串中查找
            return this.products.filter((product) => {
                const scope = `${product.name} ${product.description} ${product.category}`.toLowerCase();
                return scope.includes(keyword);
            });
        },

        /**
         * 购物车中所有商品的总件数。
         * 使用数组的 reduce 方法（累加器）将每个商品的数量相加。
         */
        cartCount() {
            return this.cart.reduce((total, item) => total + item.quantity, 0);
        },

        /**
         * 购物车详情列表。
         * 将购物车中的商品 ID 关联到完整商品信息，
         * 返回包含名称、价格、运费、数量等字段的数组。
         */
        cartDetails() {
            return this.cart.map((item) => {
                // 在商品列表中查找匹配的商品信息
                const product = this.products.find((entry) => entry.id === item.id);
                // 如果商品已从商品列表中删除，返回 null（下面用 filter(Boolean) 过滤掉）
                if (!product) return null;
                return {
                    ...product,
                    quantity: item.quantity
                };
            }).filter(Boolean);  // 过滤掉 null/undefined（已不存在的商品）
        },

        /**
         * 购物车订单总金额。
         * 计算方式：每件商品 (单价 + 运费) × 数量，然后全部累加。
         */
        cartTotal() {
            return this.cartDetails.reduce((total, item) => {
                return total + (item.price + item.shipping) * item.quantity;
            }, 0);  // 0 是初始值，表示从 0 元开始累加
        }
    },

    /* ============================================================
       生命周期钩子
       ============================================================ */

    /**
     * mounted() 在 Vue 实例挂载到页面后自动调用。
     * 在这里恢复用户上次的登录状态和购物车数据。
     */
    mounted() {
        // 首次访问时自动创建演示账号
        ensureDemoAccount();
        // 从 localStorage 恢复登录状态和购物车
        this.restoreSession();
    },

    /* ============================================================
       方法（Methods）
       ============================================================ */

    methods: {
        /**
         * 按分类筛选商品。
         * @param {string} category - 分类 ID：'personal'（个人闲置）、'campus'（校内）、'online'（线上）
         * @returns {Array} 该分类下的商品列表（受搜索关键词影响）
         */
        productsByCategory(category) {
            return this.filteredProducts.filter((product) => product.category === category);
        },

        /**
         * 处理顶部"登录/注册"按钮点击。
         * 已登录 → 退出登录
         * 未登录 → 打开登录弹窗
         */
        handleAuthAction() {
            if (this.currentUser) {
                this.logout();
                return;
            }
            this.authModalOpen = true;
            this.authMode = 'login';
        },

        /**
         * 从 localStorage 恢复登录状态和购物车数据。
         * 在页面加载时（mounted）调用。
         * 使用 safeGetJSON 而非直接的 JSON.parse，防止数据损坏导致崩溃。
         */
        restoreSession() {
            // 恢复当前登录用户
            this.currentUser = safeGetJSON('currentUser', null);

            // 恢复购物车
            this.cart = safeGetJSON('cart', []);
        },

        /**
         * 将当前购物车数据保存到 localStorage。
         * 每次购物车变动（添加/删减/移除）后都应调用此方法，
         * 确保刷新页面后购物车不丢失。
         */
        persistCart() {
            safeSetJSON('cart', this.cart);
        },

        /**
         * 用户登录。
         *
         * 流程：
         *   1. 检查是否处于锁定状态（连续失败 5 次后锁定 15 分钟）
         *   2. 从 localStorage 读取已注册用户列表
         *   3. 将输入的密码哈希后，与存储的哈希值比较
         *   4. 匹配成功 → 保存登录状态
         *   5. 匹配失败 → 记录失败次数，达到 5 次锁定 15 分钟
         *
         * 为什么比较哈希值而不是明文密码？
         * 因为用户注册时只存储了哈希值，我们从不存储明文密码。
         * 这样即使 localStorage 数据泄露，攻击者也看不到原始密码。
         */
        login() {
            // 检查是否被锁定（防止暴力破解）
            if (this.loginLockUntil && Date.now() < this.loginLockUntil) {
                const remainSeconds = Math.ceil((this.loginLockUntil - Date.now()) / 1000);
                alert('登录尝试次数过多，请 ' + remainSeconds + ' 秒后再试。');
                return;
            }

            const { username, password } = this.loginForm;
            // 从 localStorage 读取已注册的用户列表
            const users = safeGetJSON('users', []);
            // 计算输入密码的哈希值，用于和存储的哈希值比较
            const inputHash = hashPassword(password);
            // 查找用户名和密码哈希都匹配的用户
            const user = users.find(function (entry) {
                return entry.username === username && entry.passwordHash === inputHash;
            });

            // 登录失败处理
            if (!user) {
                this.loginFailCount++;
                if (this.loginFailCount >= 5) {
                    // 连续失败 5 次：锁定 15 分钟（90 万毫秒）
                    this.loginLockUntil = Date.now() + 900000;
                    this.loginFailCount = 0;
                    alert('登录失败次数过多，账户已锁定 15 分钟。');
                } else {
                    alert('用户名或密码错误。剩余尝试次数：' + (5 - this.loginFailCount));
                }
                return;
            }

            // 登录成功：重置失败计数和锁定状态
            this.loginFailCount = 0;
            this.loginLockUntil = null;

            // 保存登录状态到 localStorage
            this.currentUser = user;
            safeSetJSON('currentUser', user);
            // 关闭弹窗、清空表单
            this.authModalOpen = false;
            this.loginForm.username = '';
            this.loginForm.password = '';
        },

        /**
         * 用户注册。
         *
         * 校验规则：
         *   1. 两次输入的密码必须一致
         *   2. 密码至少 8 位（比之前 6 位更强的安全要求）
         *   3. 用户名不能重复
         *
         * 密码存储方式：存入 localStorage 前先经过哈希处理，
         * 绝不存储明文密码。
         */
        register() {
            const { username, email, password, confirmPassword } = this.registerForm;

            // 校验 1：两次密码是否一致
            if (password !== confirmPassword) {
                alert('密码和确认密码不一致。');
                return;
            }

            // 校验 2：密码长度至少 8 位（比之前的 6 位更强）
            // 为什么需要长度要求？
            // 密码越长，暴力破解（逐个尝试所有组合）所需的时间越长。
            // 6 位纯数字：100 万种组合，秒破
            // 8 位字母+数字：约 2.8 万亿种组合，需要数年
            if (password.length < 8) {
                alert('密码长度至少需要 8 位，建议混合使用字母和数字。');
                return;
            }

            // 校验 3：用户名是否已存在
            const users = safeGetJSON('users', []);
            if (users.some((entry) => entry.username === username)) {
                alert('用户名已存在，请换一个。');
                return;
            }

            // 创建新用户：密码存储哈希值，不存明文
            const newUser = {
                username: username,
                email: email,
                passwordHash: hashPassword(password)  // 关键：存储哈希值
            };
            users.push(newUser);
            // 保存更新后的用户列表
            safeSetJSON('users', users);
            // 自动登录
            safeSetJSON('currentUser', newUser);

            // 更新状态、关闭弹窗、清空表单
            this.currentUser = newUser;
            this.authModalOpen = false;
            this.authMode = 'login';
            this.registerForm.username = '';
            this.registerForm.email = '';
            this.registerForm.password = '';
            this.registerForm.confirmPassword = '';
        },

        /**
         * 退出登录。
         * 清除当前用户信息，但保留购物车数据。
         */
        logout() {
            this.currentUser = null;
            localStorage.removeItem('currentUser');
        },

        /**
         * 添加商品到购物车。
         * 未登录时自动弹出登录窗口。
         * 如果商品已在购物车中，数量 +1（不会重复添加）。
         *
         * @param {number} id - 要添加的商品 ID
         */
        addToCart(id) {
            // 未登录：弹出登录窗口，引导用户先登录
            if (!this.currentUser) {
                this.authModalOpen = true;
                return;
            }
            // 查找购物车中是否已有此商品
            const existingItem = this.cart.find((item) => item.id === id);
            if (existingItem) {
                // 已有 → 数量 +1
                existingItem.quantity += 1;
            } else {
                // 没有 → 新增，数量从 1 开始
                this.cart.push({ id, quantity: 1 });
            }
            // 每次变动后立即持久化到 localStorage
            this.persistCart();
        },

        /**
         * 购物车中某商品数量 +1。
         * @param {number} id - 商品 ID
         */
        increaseQuantity(id) {
            const item = this.cart.find((entry) => entry.id === id);
            if (!item) return;
            item.quantity += 1;
            this.persistCart();
        },

        /**
         * 购物车中某商品数量 -1。
         * 减少到 0 时自动从购物车中移除。
         * @param {number} id - 商品 ID
         */
        decreaseQuantity(id) {
            const item = this.cart.find((entry) => entry.id === id);
            if (!item) return;
            // 数量为 1 时再减就没了，直接移除
            if (item.quantity <= 1) {
                this.removeFromCart(id);
                return;
            }
            item.quantity -= 1;
            this.persistCart();
        },

        /**
         * 从购物车中移除指定商品。
         * 使用数组的 filter 方法（过滤），保留所有 ID 不匹配的商品。
         * @param {number} id - 要移除的商品 ID
         */
        removeFromCart(id) {
            this.cart = this.cart.filter((item) => item.id !== id);
            this.persistCart();
        },

        /**
         * 提交订单（结算）。
         * 前置条件：已登录 + 购物车非空。
         * 结算后清空购物车。
         */
        checkout() {
            // 校验：必须已登录
            if (!this.currentUser) {
                this.authModalOpen = true;
                return;
            }
            // 校验：购物车不能为空
            if (!this.cartCount) {
                alert('购物车为空，请先添加商品。');
                return;
            }
            // 提交订单
            alert('订单已提交，感谢你的购买。');
            this.cart = [];
            this.persistCart();
        },

        /**
         * 提交用户反馈。
         * 三项必填：姓名、邮箱、留言内容。
         * 任何一项为空时提示用户完整填写。
         */
        submitFeedback() {
            const { name, email, message } = this.feedbackForm;
            // 检查所有必填字段是否已填写
            if (!name || !email || !message) {
                alert('请完整填写反馈信息（姓名、邮箱、留言均为必填）。');
                return;
            }
            // 提交成功
            alert('反馈已收到，感谢你的建议。');
            // 清空表单、关闭弹窗
            this.feedbackForm.name = '';
            this.feedbackForm.email = '';
            this.feedbackForm.message = '';
            this.feedbackModalOpen = false;
        }
    }
}).mount('#app');
