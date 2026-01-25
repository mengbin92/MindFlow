#!/bin/bash

# MindFlow Web Docker 构建和运行脚本

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 默认环境
ENV=${1:-dev}

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  MindFlow Web Docker 构建脚本${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "环境: ${ENV}"
echo ""

# 检查是否在项目根目录
if [ ! -f "package.json" ] || [ ! -d "packages/web" ]; then
    echo -e "${RED}错误: 请在项目根目录下运行此脚本${NC}"
    exit 1
fi

# 步骤 1: 构建项目
echo -e "${YELLOW}[1/3] 构建 Web 项目...${NC}"
cd packages/web
pnpm install
pnpm build
cd ../..

echo -e "${GREEN}✓ 构建完成${NC}"
echo ""

# 步骤 2: 构建 Docker 镜像
echo -e "${YELLOW}[2/3] 构建 Docker 镜像 (${ENV})...${NC}"
docker build -t mindflow-web:${ENV} -f packages/web/deploy/Dockerfile .

echo -e "${GREEN}✓ Docker 镜像构建完成${NC}"
echo ""

# 步骤 3: 询问是否运行容器
echo -e "${YELLOW}[3/3] 运行容器?${NC}"
read -p "是否立即运行容器? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    CONTAINER_NAME="mindflow-web-${ENV}"

    # 停止并删除旧容器
    if [ "$(docker ps -aq -f name=${CONTAINER_NAME})" ]; then
        echo -e "${YELLOW}停止旧容器...${NC}"
        docker stop ${CONTAINER_NAME} 2>/dev/null || true
        docker rm ${CONTAINER_NAME} 2>/dev/null || true
    fi

    # 运行新容器
    echo -e "${YELLOW}启动新容器...${NC}"
    docker run -d \
        --name ${CONTAINER_NAME} \
        -p 8080:80 \
        mindflow-web:${ENV}

    echo -e "${GREEN}✓ 容器已启动${NC}"
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  访问地址: http://localhost:8080${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "查看日志: docker logs -f ${CONTAINER_NAME}"
    echo -e "停止容器: docker stop ${CONTAINER_NAME}"
    echo -e "删除容器: docker rm ${CONTAINER_NAME}"
else
    echo -e "${YELLOW}跳过运行容器${NC}"
    echo ""
    echo -e "手动运行命令:"
    echo -e "${GREEN}docker run -d -p 8080:80 --name mindflow-web-${ENV} mindflow-web:${ENV}${NC}"
fi
