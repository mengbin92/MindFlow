import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright 配置
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',

  /* 并行运行测试 */
  fullyParallel: true,

  /* 如果有失败的测试，禁止在 CI 中并行运行 */
  forbidOnly: !!process.env.CI,

  /* 重试次数 */
  retries: process.env.CI ? 2 : 0,

  /* 并行 workers 数量 */
  workers: process.env.CI ? 1 : undefined,

  /* 报告器配置 */
  reporter: 'html',

  /* 所有测试共享的配置 */
  use: {
    /* 基础 URL */
    baseURL: 'http://localhost:4173',

    /* 收集所有测试的追踪信息 */
    trace: 'on-first-retry',
  },

  /* 针对不同浏览器的项目配置 */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    /* 如果需要测试其他浏览器，可以取消注释 */
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    /* 移动端视图测试 */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },
  ],

  /* 开发服务器配置 - 使用 preview 模式 */
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 180 * 1000,
  },
});
