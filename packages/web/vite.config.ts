import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // 代码分割策略
    rollupOptions: {
      output: {
        manualChunks: {
          // 将React相关库打包成单独的chunk
          'react-vendor': ['react', 'react-dom', 'react-redux'],
          // 将Redux相关库打包成单独的chunk
          'redux-vendor': ['@reduxjs/toolkit', 'react-redux'],
          // 将编辑器相关库打包成单独的chunk
          'editor-vendor': [
            '@codemirror/state',
            '@codemirror/view',
            '@codemirror/lang-markdown',
            '@codemirror/commands',
            '@codemirror/search',
            '@codemirror/autocomplete',
          ],
          // 将扩展语法相关库打包成单独的chunk（延迟加载）
          'syntax-vendor': ['marked', 'katex'],
        },
        // 为生成的chunk文件命名
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // 启用压缩
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // 生产环境移除console
        drop_debugger: true,
      },
    },
    // 设置chunk大小警告阈值
    chunkSizeWarningLimit: 1000,
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
    ],
  },
});
