# MindFlow Web - Docker 镜像
# 使用方法：先在 packages/web 目录执行 pnpm build，然后从项目根目录构建

# ARG 用于设置环境变量（dev 或 prod）
ARG ENV=dev

# 生产阶段 - 使用 Nginx
FROM nginx:alpine

# 根据环境变量复制对应的配置文件
ARG ENV=dev
RUN if [ "$ENV" = "prod" ]; then \
        echo "Using production configuration"; \
    else \
        echo "Using development configuration"; \
    fi

# 复制开发环境配置（默认）
COPY packages/web/deploy/nginx.dev.conf /etc/nginx/conf.d/default.conf

# 复制构建产物（需要先执行 pnpm build）
COPY packages/web/dist /usr/share/nginx/html

# 暴露端口
EXPOSE 80

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]
