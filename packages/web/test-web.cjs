#!/usr/bin/env node

/**
 * Web端自动化测试脚本
 * 使用Node.js内置的HTTP客户端测试页面加载
 */

const http = require('http');

const TEST_URL = 'http://localhost:3000';
const TEST_TIMEOUT = 5000;

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function testPageLoad() {
  return new Promise((resolve, reject) => {
    log(`\n📡 测试页面加载: ${TEST_URL}`, 'blue');

    const req = http.get(TEST_URL, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          log('✅ 页面加载成功', 'green');

          // 检查关键元素
          const hasRootDiv = data.includes('<div id="root"></div>');
          const hasMainScript = data.includes('<script type="module" src="/src/main.tsx">');
          const hasTitle = data.includes('<title>MindFlow - Web</title>');

          if (hasRootDiv) {
            log('  ✅ 找到root元素', 'green');
          } else {
            log('  ❌ 未找到root元素', 'red');
          }

          if (hasMainScript) {
            log('  ✅ 找到主脚本', 'green');
          } else {
            log('  ❌ 未找到主脚本', 'red');
          }

          if (hasTitle) {
            log('  ✅ 页面标题正确', 'green');
          } else {
            log('  ❌ 页面标题错误', 'red');
          }

          resolve({
            success: true,
            hasRootDiv,
            hasMainScript,
            hasTitle
          });
        } else {
          log(`❌ 页面加载失败，状态码: ${res.statusCode}`, 'red');
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      log(`❌ 请求失败: ${error.message}`, 'red');
      log('提示: 请确保开发服务器正在运行 (npm run dev)', 'yellow');
      reject(error);
    });

    req.setTimeout(TEST_TIMEOUT, () => {
      req.destroy();
      log('❌ 请求超时', 'red');
      reject(new Error('Request timeout'));
    });
  });
}

function testMainScript() {
  return new Promise((resolve, reject) => {
    log(`\n📜 测试主脚本: ${TEST_URL}/src/main.tsx`, 'blue');

    const req = http.get(`${TEST_URL}/src/main.tsx`, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          log('✅ 主脚本加载成功', 'green');

          // 检查关键导入
          const hasReactImport = data.includes('react');
          const hasReactDOMImport = data.includes('react-dom');
          const hasAppImport = data.includes('App');

          if (hasReactImport) {
            log('  ✅ React已导入', 'green');
          } else {
            log('  ❌ React未导入', 'red');
          }

          if (hasReactDOMImport) {
            log('  ✅ ReactDOM已导入', 'green');
          } else {
            log('  ❌ ReactDOM未导入', 'red');
          }

          if (hasAppImport) {
            log('  ✅ App组件已导入', 'green');
          } else {
            log('  ❌ App组件未导入', 'red');
          }

          resolve({
            success: true,
            hasReactImport,
            hasReactDOMImport,
            hasAppImport
          });
        } else {
          log(`❌ 主脚本加载失败，状态码: ${res.statusCode}`, 'red');
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(TEST_TIMEOUT, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function runTests() {
  log('\n🧪 MindFlow Web端自动化测试', 'blue');
  log('='.repeat(50), 'blue');

  const results = {
    pageLoad: null,
    mainScript: null
  };

  try {
    results.pageLoad = await testPageLoad();
  } catch (error) {
    log(`\n页面加载测试失败: ${error.message}`, 'red');
    results.pageLoad = { success: false };
  }

  try {
    results.mainScript = await testMainScript();
  } catch (error) {
    log(`\n主脚本测试失败: ${error.message}`, 'red');
    results.mainScript = { success: false };
  }

  // 汇总结果
  log('\n' + '='.repeat(50), 'blue');
  log('📊 测试结果汇总', 'blue');

  if (results.pageLoad?.success && results.mainScript?.success) {
    log('✅ 所有测试通过！', 'green');
    log('\n下一步：', 'yellow');
    log('1. 在浏览器中打开 http://localhost:3000/', 'yellow');
    log('2. 检查页面是否正常显示', 'yellow');
    log('3. 打开开发者工具检查控制台是否有错误', 'yellow');
    log('4. 测试各项功能（编辑、预览、导出等）', 'yellow');
    process.exit(0);
  } else {
    log('❌ 部分测试失败', 'red');
    log('\n请检查：', 'yellow');
    log('1. 开发服务器是否正在运行', 'yellow');
    log('2. 依赖是否正确安装 (npm install)', 'yellow');
    log('3. 端口3000是否被占用', 'yellow');
    process.exit(1);
  }
}

// 运行测试
runTests().catch(error => {
  log(`\n❌ 测试运行失败: ${error.message}`, 'red');
  process.exit(1);
});
