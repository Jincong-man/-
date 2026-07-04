import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // 测试环境（happy-dom 模拟浏览器 DOM）
    environment: 'happy-dom',

    // 全局变量（可选，开启后不需要在每个测试文件里 import describe/it/expect）
    globals: true,

    // 测试文件匹配模式
    include: ['tests/**/*.test.js'],

    // 覆盖率配置
    coverage: {
      provider: 'v8',
      include: ['Jincong.js'],
      reportsDirectory: 'tests/coverage',
    },
  },
});
