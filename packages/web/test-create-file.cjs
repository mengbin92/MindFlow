// 自动化测试：新建文件功能

const http = require('http');

const TEST_URL = 'http://localhost:3000';

// 颜色输出
const log = (msg, color = '\x1b[0m') => console.log(`${color}${msg}\x1b[0m`);

async function testPageLoad() {
  return new Promise((resolve) => {
    http.get(TEST_URL, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          log('✅ 页面加载成功', '\x1b[32m');

          // 检查关键组件
          const hasFileTreeCSS = data.includes('file-tree-toolbar');
          const hasDialogCSS = data.includes('file-tree-dialog');

          log(`CSS检查:`, '\x1b[36m');
          log(`  - file-tree-toolbar: ${hasFileTreeCSS ? '✅' : '❌'}`, hasFileTreeCSS ? '\x1b[32m' : '\x1b[31m');
          log(`  - file-tree-dialog: ${hasDialogCSS ? '✅' : '❌'}`, hasDialogCSS ? '\x1b[32m' : '\x1b[31m');

          resolve({
            success: true,
            hasFileTreeCSS,
            hasDialogCSS
          });
        } else {
          log(`❌ 页面加载失败: ${res.statusCode}`, '\x1b[31m');
          resolve({ success: false });
        }
      });
    }).on('error', (err) => {
      log(`❌ 请求失败: ${err.message}`, '\x1b[31m');
      resolve({ success: false });
    });
  });
}

async function testComponentLoad() {
  return new Promise((resolve) => {
    http.get(`${TEST_URL}/src/components/FileTree.tsx`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          const hasCreateFile = data.includes('createFile');
          const hasCreateDir = data.includes('createDir');
          const hasNewFileDialog = data.includes('showNewFileDialog');
          const hasNewDirDialog = data.includes('showNewDirDialog');

          log(`\n组件功能检查:`, '\x1b[36m');
          log(`  - 导入 createFile: ${hasCreateFile ? '✅' : '❌'}`, hasCreateFile ? '\x1b[32m' : '\x1b[31m');
          log(`  - 导入 createDir: ${hasCreateDir ? '✅' : '❌'}`, hasCreateDir ? '\x1b[32m' : '\x1b[31m');
          log(`  - 新建文件对话框: ${hasNewFileDialog ? '✅' : '❌'}`, hasNewFileDialog ? '\x1b[32m' : '\x1b[31m');
          log(`  - 新建文件夹对话框: ${hasNewDirDialog ? '✅' : '❌'}`, hasNewDirDialog ? '\x1b[32m' : '\x1b[31m');

          resolve({
            success: true,
            hasCreateFile,
            hasCreateDir,
            hasNewFileDialog,
            hasNewDirDialog
          });
        } else {
          resolve({ success: false });
        }
      });
    });
  });
}

async function testAdapterLoad() {
  return new Promise((resolve) => {
    http.get(`${TEST_URL}/src/store/webFileSystemAdapter.ts`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          const hasCreateFileImpl = data.includes('export async function createFile');
          const hasCreateDirImpl = data.includes('export async function createDir');
          const hasLocalStorageSet = data.includes('localStorage.setItem');
          const hasDuplicateCheck = data.includes('already exists');

          log(`\nAdapter功能检查:`, '\x1b[36m');
          log(`  - createFile 实现: ${hasCreateFileImpl ? '✅' : '❌'}`, hasCreateFileImpl ? '\x1b[32m' : '\x1b[31m');
          log(`  - createDir 实现: ${hasCreateDirImpl ? '✅' : '❌'}`, hasCreateDirImpl ? '\x1b[32m' : '\x1b[31m');
          log(`  - localStorage 存储: ${hasLocalStorageSet ? '✅' : '❌'}`, hasLocalStorageSet ? '\x1b[32m' : '\x1b[31m');
          log(`  - 重复检查: ${hasDuplicateCheck ? '✅' : '❌'}`, hasDuplicateCheck ? '\x1b[32m' : '\x1b[31m');

          resolve({
            success: true,
            hasCreateFileImpl,
            hasCreateDirImpl,
            hasLocalStorageSet,
            hasDuplicateCheck
          });
        } else {
          resolve({ success: false });
        }
      });
    });
  });
}

async function runTests() {
  log('\n========================================', '\x1b[36m');
  log('🧪 新建文件功能自动化测试', '\x1b[36m');
  log('========================================\n', '\x1b[36m');

  const pageResult = await testPageLoad();
  if (!pageResult.success) {
    log('\n❌ 测试失败：页面无法访问', '\x1b[31m');
    log('请确保开发服务器正在运行: npm run dev', '\x1b[33m');
    process.exit(1);
  }

  const componentResult = await testComponentLoad();
  const adapterResult = await testAdapterLoad();

  log('\n========================================', '\x1b[36m');
  log('📊 测试结果汇总', '\x1b[36m');
  log('========================================\n', '\x1b[36m');

  const allPassed =
    pageResult.success &&
    componentResult.success &&
    adapterResult.success &&
    pageResult.hasFileTreeCSS &&
    pageResult.hasDialogCSS &&
    componentResult.hasCreateFile &&
    componentResult.hasCreateDir &&
    componentResult.hasNewFileDialog &&
    componentResult.hasNewDirDialog &&
    adapterResult.hasCreateFileImpl &&
    adapterResult.hasCreateDirImpl &&
    adapterResult.hasLocalStorageSet &&
    adapterResult.hasDuplicateCheck;

  if (allPassed) {
    log('✅ 所有自动化测试通过！', '\x1b[32m');
    log('\n下一步：', '\x1b[33m');
    log('1. 在浏览器中打开 http://localhost:3000/', '\x1b[33m');
    log('2. 手动测试UI交互和功能', '\x1b[33m');
    log('3. 参考测试计划: packages/web/测试计划-新建文件.md', '\x1b[33m');
  } else {
    log('❌ 部分测试失败', '\x1b[31m');
    log('\n请检查：', '\x1b[33m');
    log('1. 开发服务器是否正在运行', '\x1b[33m');
    log('2. 代码是否正确编译', '\x1b[33m');
    log('3. 浏览器控制台是否有错误', '\x1b[33m');
  }
}

runTests().catch(err => {
  log(`\n❌ 测试运行失败: ${err.message}`, '\x1b[31m');
  process.exit(1);
});
