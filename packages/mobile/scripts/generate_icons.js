const fs = require('fs');
const path = require('path');

// 使用 sharp 生成图标（如果可用）或创建简单的脚本
const { execSync } = require('child_process');

const svgContent = fs.readFileSync(
  path.join(__dirname, '../assets/icons/icon-app.svg'),
  'utf-8'
);

// Android 图标尺寸
const androidSizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

// iOS 图标尺寸
const iosSizes = [
  20, 29, 40, 50, 57, 58, 60, 72, 76, 80, 87, 100, 114, 120, 144, 152, 167, 180, 1024
];

console.log('图标生成脚本');
console.log('============');
console.log('');
console.log('Android 图标尺寸:');
Object.entries(androidSizes).forEach(([name, size]) => {
  console.log(`  ${name}: ${size}x${size}px`);
});
console.log('');
console.log('iOS 图标尺寸:');
iosSizes.forEach(size => {
  console.log(`  ${size}x${size}px`);
});
console.log('');
console.log('要使用此脚本，请安装 sharp:');
console.log('  npm install sharp');
console.log('');
console.log('或使用在线工具转换 SVG 到 PNG:');
console.log('  https://convertio.co/svg-png/');
console.log('  https://cloudconvert.com/svg-to-png');
