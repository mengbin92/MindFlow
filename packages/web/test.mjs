// 测试模块是否能正确加载
import { createEditor } from '@mindflow/core';
import React from 'react';
import { createStore } from '@reduxjs/toolkit';

console.log('✅ React loaded:', React !== undefined);
console.log('✅ Redux Toolkit loaded:', createStore !== undefined);
console.log('✅ @mindflow/core loaded:', createEditor !== undefined);

console.log('\n所有核心模块加载成功！');
