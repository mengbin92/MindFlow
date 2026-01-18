# MindFlow 项目图标

## 图标设计说明

本项目提供了多个版本的图标，适用于不同的使用场景：

### 1. icon-simple-center.svg ⭐ **推荐**
**推荐用于：网站Logo、文档封面、项目展示**
- 项目名称和副标题完美居中
- 装饰性图标元素不干扰文字
- 极简设计，清晰易读
- 适合所有尺寸显示

### 2. icon-final.svg
**推荐用于：GitHub README、项目介绍**
- 图标在上，文字居中
- 平衡的视觉布局
- 包含完整的文档图标
- 专业的设计感

### 3. icon-centered.svg
**推荐用于：演示文稿、宣传材料**
- 文字完全居中显示
- 文档图标作为背景元素
- 突出项目名称

### 4. icon-app.svg
**推荐用于：应用图标、桌面快捷方式**
- 纯图形设计，无文字
- 蓝色渐变背景
- 白色文档图标
- 清晰易识别

### 5. icon-minimal.svg
**推荐用于：网站Logo、社交媒体头像**
- 字母"M"作为主要标识
- 项目名称在底部
- 包含流动箭头元素

### 6. icon-with-text.svg
**推荐用于：网站Header、文档封面**
- 完整的项目名称和副标题
- 文字在底部
- 详细的文档图标设计

### 7. favicon.svg
**推荐用于：网站favicon**
- 简化版本，适合小尺寸
- 16x16, 32x32, 48x48像素

## 颜色规范

### 主色调
- **Primary Blue**: #3B82F6 (RGB: 59, 130, 246)
- **Light Blue**: #60A5FA (RGB: 96, 165, 250)
- **Dark Blue**: #1E40AF (RGB: 30, 64, 175)

### 辅助色
- **Accent Yellow**: #FCD34D (RGB: 252, 211, 77)
- **Background White**: #FFFFFF
- **Text Dark**: #1A1A1A
- **Text Gray**: #64748B

## 设计元素说明

### 文档图标
- 圆角矩形代表文档
- 右上角折角表示可编辑
- 多条横线表示文本内容

### 流动箭头
- 曲线箭头代表"Flow"（流）
- 金黄色突出重点
- 体现项目的流畅体验

### Markdown标识
- 三个竖线代表Markdown的`#`符号
- 半透明效果不抢夺主体元素

## 使用指南

### 作为应用图标
推荐使用 `icon-app.svg`：
1. 转换为ICO格式（Windows）
2. 转换为ICNS格式（macOS）
3. 生成多尺寸PNG（iOS/Android）

### 作为网站Logo
推荐使用 `icon-minimal.svg`：
1. 适用于网站header
2. 适用于favicon
3. 适用于社交媒体

### 作为文档封面
推荐使用 `icon-with-text.svg`：
1. GitHub README
2. 项目官网
3. 宣传材料

## 技术实现

所有图标均使用SVG格式，具有以下优势：
- **矢量图形**：无限缩放不失真
- **文件体积小**：相比位图大幅减小
- **易于定制**：可轻松修改颜色和尺寸
- **跨平台兼容**：所有现代浏览器和设备支持

## 自定义修改

如需修改图标，可以：
1. 直接编辑SVG源码
2. 使用矢量编辑软件（Inkscape, Illustrator等）
3. 调整颜色变量以匹配品牌需求

## 文件清单

```
assets/
├── icon-simple-center.svg  # 极简居中版本（推荐）⭐
├── icon-final.svg          # 最终版本（图文平衡）
├── icon-centered.svg       # 文字居中版本
├── icon-app.svg           # 应用图标版本（无文字）
├── icon-minimal.svg       # 简约版本（字母M标识）
├── icon-with-text.svg     # 完整版本（文字在底部）
├── icon.svg              # 基础版本
├── favicon.svg          # 网站图标（简化版）
├── README.md            # 本说明文档
└── generate_icons.html   # 图标生成工具
```

## 使用建议

**最佳实践**：
- 网站Logo：使用 `icon-simple-center.svg`
- 项目介绍：使用 `icon-final.svg`
- 应用图标：使用 `icon-app.svg`
- Favicon：使用 `favicon.svg`

---

**设计理念**：极简、现代、专业
**设计工具**：纯SVG代码手写
**兼容性**：SVG 1.1标准
