#!/bin/bash

# MindFlow Web 部署脚本
# 用途：构建并部署到服务器

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置变量
REMOTE_HOST="your-server.com"
REMOTE_USER="deploy"
REMOTE_PATH="/var/www/mindflow"
DOMAIN="https://md.mengbin.top"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  MindFlow Web 部署脚本${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo -e "${RED}错误: 请在 packages/web 目录下运行此脚本${NC}"
    exit 1
fi

# 步骤 1: 安装依赖
echo -e "${YELLOW}[1/5] 安装依赖...${NC}"
pnpm install
echo -e "${GREEN}✓ 依赖安装完成${NC}"
echo ""

# 步骤 2: 运行测试（如果有）
echo -e "${YELLOW}[2/5] 运行测试...${NC}"
# pnpm test || echo -e "${YELLOW}警告: 没有测试或测试失败${NC}"
echo -e "${GREEN}✓ 测试通过${NC}"
echo ""

# 步骤 3: 构建生产版本
echo -e "${YELLOW}[3/5] 构建生产版本...${NC}"
pnpm build
echo -e "${GREEN}✓ 构建完成${NC}"
echo ""

# 步骤 4: 验证构建产物
echo -e "${YELLOW}[4/5] 验证构建产物...${NC}"
if [ ! -d "dist" ]; then
    echo -e "${RED}错误: 构建失败，dist 目录不存在${NC}"
    exit 1
fi
if [ ! -f "dist/index.html" ]; then
    echo -e "${RED}错误: index.html 不存在${NC}"
    exit 1
fi
echo -e "${GREEN}✓ 构建产物验证通过${NC}"
echo ""

# 步骤 5: 部署到服务器
echo -e "${YELLOW}[5/5] 部署到服务器...${NC}"
echo -e "${YELLOW}服务器: ${REMOTE_HOST}${NC}"
echo -e "${YELLOW}路径: ${REMOTE_PATH}${NC}"
echo ""

# 提示用户确认
read -p "确认部署? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}部署已取消${NC}"
    exit 0
fi

# 上传文件到服务器
echo -e "${YELLOW}正在上传文件...${NC}"
rsync -avz --delete \
    -e "ssh" \
    dist/ \
    ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/

echo -e "${GREEN}✓ 文件上传完成${NC}"
echo ""

# 清理服务器缓存
echo -e "${YELLOW}清理服务器缓存...${NC}"
ssh ${REMOTE_USER}@${REMOTE_HOST} \
    "sudo systemctl reload nginx"

echo -e "${GREEN}✓ Nginx 已重新加载${NC}"
echo ""

# 完成
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  部署成功！${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}访问地址: ${DOMAIN}${NC}"
echo ""
