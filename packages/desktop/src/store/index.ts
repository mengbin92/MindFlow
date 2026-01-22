/**
 * @fileoverview Redux store 配置
 * @description 配置Redux store和中间件
 */

import { configureStore } from '@reduxjs/toolkit';
import fileSystemReducer from './fileSystemSlice';
import configReducer from './configSlice';

/**
 * Redux store 配置
 */
export const store = configureStore({
  reducer: {
    fileSystem: fileSystemReducer,
    config: configReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // 忽略Tauri invoke调用的序列化检查
        ignoredActions: [
          'fileSystem/readFile/pending',
          'fileSystem/writeFile/pending',
          'config/saveConfig/pending',
          'config/loadConfig/pending',
        ],
      },
    }),
});

/**
 * RootState 类型
 */
export type RootState = ReturnType<typeof store.getState>;

/**
 * AppDispatch 类型
 */
export type AppDispatch = typeof store.dispatch;
