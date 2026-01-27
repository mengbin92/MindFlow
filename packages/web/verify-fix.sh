#!/bin/bash

# 快速验证脚本：检查Redux序列化修复

echo "========================================="
echo "🔍 Redux序列化修复验证"
echo "========================================="
echo ""

# 检查类型定义
echo "1. 检查类型定义..."
if grep -q "lastOperation: number | null" shared/types/src/index.ts; then
    echo "   ✅ 类型定义已更新 (number)"
else
    echo "   ❌ 类型定义未更新"
    echo "   请检查: shared/types/src/index.ts"
fi

# 检查fileSystemSlice
echo ""
echo "2. 检查fileSystemSlice..."
COUNT=$(grep -c "lastOperation = Date.now()" packages/web/src/store/fileSystemSlice.ts)
if [ "$COUNT" -eq 3 ]; then
    echo "   ✅ 所有3处都已更新 (Date.now())"
else
    echo "   ❌ 只找到 $COUNT 处更新 (应该是3处)"
    echo "   请检查: packages/web/src/store/fileSystemSlice.ts"
fi

# 检查是否还有new Date()
echo ""
echo "3. 检查是否还有旧的new Date()..."
if grep -q "lastOperation = new Date()" packages/web/src/store/fileSystemSlice.ts; then
    echo "   ❌ 仍有旧的 new Date() 代码！"
    grep -n "lastOperation = new Date()" packages/web/src/store/fileSystemSlice.ts
else
    echo "   ✅ 没有旧的 new Date() 代码"
fi

# 检查服务器状态
echo ""
echo "4. 检查开发服务器..."
if curl -s http://localhost:3000/ > /dev/null; then
    echo "   ✅ 服务器运行中 (http://localhost:3000/)"
else
    echo "   ❌ 服务器未运行"
    echo "   请运行: cd packages/web && npm run dev"
fi

echo ""
echo "========================================="
echo "✅ 代码修复验证完成！"
echo "========================================="
echo ""
echo "下一步："
echo "1. 清除浏览器缓存（见清除缓存指南.md）"
echo "   推荐: 使用硬刷新 (Cmd/Ctrl+Shift+R)"
echo "   或使用无痕模式测试"
echo ""
echo "2. 打开 http://localhost:3000/"
echo ""
echo "3. 点击 'Open Directory' 按钮"
echo ""
echo "4. 检查控制台应该没有警告"
echo ""
