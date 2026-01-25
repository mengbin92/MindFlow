import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 生产环境配置
  base: process.env.NODE_ENV === 'production' ? '/' : '/',
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // 生产环境关闭 sourcemap 以减小体积
    // 代码分割策略
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // 只处理 node_modules
          if (id.includes('node_modules/')) {
            // React 核心库
            if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
              return 'react-vendor';
            }
            // Redux 相关库
            if (id.includes('node_modules/@reduxjs/') || id.includes('node_modules/react-redux/')) {
              return 'redux-vendor';
            }
            // CodeMirror 编辑器
            if (id.includes('node_modules/@codemirror/')) {
              return 'editor-vendor';
            }
            // Markdown 相关库
            if (id.includes('node_modules/marked/') || id.includes('node_modules/katex/')) {
              return 'markdown-vendor';
            }
            // Mermaid 图表库（单独分割以避免问题）
            if (id.includes('node_modules/mermaid/')) {
              return 'mermaid-vendor';
            }
            // d3-graphviz 和相关可视化库
            if (id.includes('node_modules/d3-') ||
                id.includes('node_modules/@dagrejs/') ||
                id.includes('node_modules/cytoscape/')) {
              return 'viz-vendor';
            }
          }
        },
        // 为生成的chunk文件命名
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || [];
          let extType = info[info.length - 1];
          // CSS 文件
          if (extType === 'css') {
            return 'assets/css/[name]-[hash].[ext]';
          }
          // 图片文件
          if (/\.(png|jpe?g|gif|svg|webp|ico)$/.test(assetInfo.name || '')) {
            return 'assets/images/[name]-[hash].[ext]';
          }
          // 字体文件
          if (/\.(woff2?|eot|ttf|otf)$/.test(assetInfo.name || '')) {
            return 'assets/fonts/[name]-[hash].[ext]';
          }
          // 其他资源
          return 'assets/[name]-[hash].[ext]';
        },
      },
    },
    // 启用压缩
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // 生产环境移除console
        drop_debugger: true,
        pure_funcs: ['console.log'], // 移除特定函数
      },
    },
    // 设置chunk大小警告阈值
    chunkSizeWarningLimit: 1000,
    // CSS 代码拆分
    cssCodeSplit: true,
  },
  // 优化依赖预构建
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-redux',
      '@reduxjs/toolkit',
      '@codemirror/state',
      '@codemirror/view',
      'marked',
      'mermaid',
    ],
  },
  // 定义全局变量替换
  define: {
    global: 'globalThis',
  },
});
