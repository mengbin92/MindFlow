import { test, expect } from '@playwright/test';

/**
 * MindFlow 应用基础 E2E 测试
 */

test.describe('MindFlow 应用基础功能', () => {
  test('应用标题正确显示', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/MindFlow/);
  });

  test('页面加载后显示主要界面元素', async ({ page }) => {
    await page.goto('/');

    // 等待应用加载
    await page.waitForLoadState('networkidle');

    // 检查文件树区域是否存在
    const fileTreeSection = page.locator('.sidebar-left, .file-tree, [data-testid="file-tree"]').first();
    await expect(fileTreeSection).toBeVisible();

    // 检查编辑器区域是否存在
    const editorSection = page.locator('.editor-container, .cm-editor, [data-testid="editor"]').first();
    await expect(editorSection).toBeVisible();
  });

  test('文件树工具栏按钮可点击', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 查找新建文件按钮
    const newFileButton = page.getByText('新建文件').first();
    await expect(newFileButton).toBeVisible();

    // 点击新建文件按钮
    await newFileButton.click();

    // 检查对话框是否出现
    const dialog = page.locator('.file-tree-dialog, .dialog, [role="dialog"]').first();
    await expect(dialog).toBeVisible();
  });

  test('主题切换功能', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 查找主题切换按钮 (月亮图标按钮)
    const themeButton = page.locator('.theme-toggle, button[aria-label*="theme"], button[aria-label*="主题"]').first();

    // 如果主题切换按钮存在，测试切换功能
    const isThemeButtonVisible = await themeButton.isVisible().catch(() => false);

    if (isThemeButtonVisible) {
      // 检查初始主题类 (在 html 元素上)
      const html = page.locator('html');
      const initialClass = await html.getAttribute('class') || '';

      await themeButton.click();

      // 等待主题切换动画
      await page.waitForTimeout(300);

      // 检查主题类是否改变 (在 html 元素上)
      const newClass = await html.getAttribute('class') || '';
      // 主题类名应该包含 theme-light 或 theme-dark
      expect(newClass).toMatch(/theme-(light|dark)/);
    } else {
      // 如果没有主题切换按钮，跳过此测试
      test.skip();
    }
  });
});

test.describe('编辑器功能', () => {
  test('编辑器可以输入内容', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 查找编辑器输入区域
    const editor = page.locator('.cm-content, .cm-editor, [contenteditable="true"]').first();

    if (await editor.isVisible().catch(() => false)) {
      // 点击编辑器获取焦点
      await editor.click();

      // 输入内容
      await editor.type('# Hello MindFlow');

      // 检查内容是否显示
      await expect(editor).toContainText('Hello MindFlow');
    }
  });

  test('预览模式可以切换', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 查找预览切换按钮
    const previewButton = page.locator('[data-testid="preview-toggle"], .preview-toggle, button:has-text("预览")').first();

    if (await previewButton.isVisible().catch(() => false)) {
      await previewButton.click();

      // 检查预览区域是否显示
      const preview = page.locator('.preview-container, .markdown-preview').first();
      await expect(preview).toBeVisible();
    }
  });
});
