/**
 * 生成系统托盘图标
 * 使用 sharp 将 SVG 转换为不同尺寸的 PNG
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// SVG 图标路径（使用 icon-app.svg 作为应用图标）
const SVG_PATH = path.join(__dirname, '../../../../assets/icon-app.svg');
const ICONS_DIR = __dirname;

// 需要生成的尺寸
const SIZES = [16, 32, 48, 64, 128, 256, 512, 1024];

async function generateIcons() {
  console.log('开始生成图标...\n');

  // 检查源文件是否存在
  if (!fs.existsSync(SVG_PATH)) {
    console.error(`错误: 找不到源文件 ${SVG_PATH}`);
    process.exit(1);
  }

  try {
    // 读取 SVG 文件
    const svgBuffer = fs.readFileSync(SVG_PATH);

    // 生成不同尺寸的图标
    for (const size of SIZES) {
      const outputFileName = `icon_${size}x${size}.png`;
      const outputPath = path.join(ICONS_DIR, outputFileName);

      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outputPath);

      console.log(`✓ 生成 ${outputFileName}`);
    }

    // 生成标准的 icon.png (1024x1024)
    const mainIconPath = path.join(ICONS_DIR, 'icon.png');
    await sharp(svgBuffer)
      .resize(1024, 1024)
      .png()
      .toFile(mainIconPath);
    console.log(`✓ 生成 icon.png (1024x1024)\n`);

    console.log('图标生成完成！');
    console.log(`输出目录: ${ICONS_DIR}`);

  } catch (error) {
    console.error('生成图标时出错:', error.message);
    process.exit(1);
  }
}

generateIcons();
