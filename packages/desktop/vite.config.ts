import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [react()],

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ['**/src-tauri/**'],
    },
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
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // 启用压缩
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
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
}));
