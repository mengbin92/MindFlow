/**
 * @fileoverview Redux store 配置
 * @description 配置Redux store和中间件
 */

import { configureStore } from '@reduxjs/toolkit';
import fileSystemReducer from './fileSystemSlice';
import configReducer from './configSlice';
import windowReducer from './windowSlice';
import updaterReducer from './updaterSlice';

/**
 * Redux store 配置
 */
export const store = configureStore({
  reducer: {
    fileSystem: fileSystemReducer,
    config: configReducer,
    window: windowReducer,
    updater: updaterReducer,
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
          'window/minimize/pending',
          'window/toggle_maximize/pending',
          'window/close/pending',
          'window/show/pending',
          'window/hide/pending',
          'window/set_title/pending',
          'window/toggle_fullscreen/pending',
          'window/save_state/pending',
          'window/restore_state/pending',
          'window/get_state/pending',
          'updater/check/pending',
          'updater/install/pending',
          'updater/remind_later/pending',
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
