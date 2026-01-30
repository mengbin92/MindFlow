#!/usr/bin/env node

/**
 * 生成Web图标脚本
 * 将assets/icon-app.svg转换为各种尺寸的PNG图标
 */

const fs = require('fs');
const path = require('path');

// 检查是否安装了sharp
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.log('正在安装 sharp...');
  const { execSync } = require('child_process');
  execSync('npm install sharp --save-dev', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  sharp = require('sharp');
}

const SIZES = [
  { size: 192, name: 'Icon-192.png' },
  { size: 512, name: 'Icon-512.png' },
  { size: 192, name: 'Icon-maskable-192.png', maskable: true },
  { size: 512, name: 'Icon-maskable-512.png', maskable: true },
];

const FAVICON_SIZES = [16, 32, 48];

async function generateIcons() {
  const svgPath = path.join(__dirname, '..', 'assets', 'icon-app.svg');
  const outputDir = path.join(__dirname, '..', 'packages', 'mobile', 'web', 'icons');
  const webDir = path.join(__dirname, '..', 'packages', 'mobile', 'web');

  // 确保输出目录存在
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 读取SVG文件
  const svgBuffer = fs.readFileSync(svgPath);

  console.log('🎨 生成Web图标...\n');

  // 生成各种尺寸的图标
  for (const { size, name, maskable } of SIZES) {
    const outputPath = path.join(outputDir, name);

    try {
      let pipeline = sharp(svgBuffer)
        .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } });

      // 对于maskable图标，添加安全区域背景
      if (maskable) {
        pipeline = pipeline.flatten({ background: { r: 59, g: 130, b: 246 } }); // #3B82F6
      }

      await pipeline.png().toFile(outputPath);

      const stats = fs.statSync(outputPath);
      console.log(`✅ ${name} (${size}x${size}) - ${(stats.size / 1024).toFixed(1)}KB`);
    } catch (error) {
      console.error(`❌ 生成 ${name} 失败:`, error.message);
    }
  }

  // 生成favicon
  console.log('\n🎯 生成favicon...');
  for (const size of FAVICON_SIZES) {
    const outputPath = path.join(webDir, `favicon-${size}.png`);
    try {
      await sharp(svgBuffer)
        .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toFile(outputPath);
      console.log(`✅ favicon-${size}.png`);
    } catch (error) {
      console.error(`❌ 生成 favicon-${size}.png 失败:`, error.message);
    }
  }

  // 复制一个favicon.png作为默认
  const faviconSource = path.join(webDir, 'favicon-32.png');
  const faviconDest = path.join(webDir, 'favicon.png');
  if (fs.existsSync(faviconSource)) {
    fs.copyFileSync(faviconSource, faviconDest);
    console.log('✅ favicon.png (复制自 32px)');
  }

  console.log('\n🎉 图标生成完成！');
  console.log(`\n输出目录: ${outputDir}`);
}

generateIcons().catch(console.error);
