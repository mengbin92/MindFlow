# MindFlow Web 部署指南

本文档说明如何将 MindFlow Web 应用部署到生产环境。

## 前置要求

- 服务器: Linux 服务器（推荐 Ubuntu 20.04+ 或 CentOS 7+）
- 域名: `md.mengbin.top`
- SSL 证书: Let's Encrypt 或自签名证书
- 软件: Nginx 1.18+, Node.js 20+, Docker（可选）

## 部署方式

### 方式一：传统部署（推荐）

#### 1. 安装 Nginx

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx -y

# CentOS/RHEL
sudo yum install nginx -y
```

#### 2. 配置 SSL 证书

使用 Let's Encrypt 免费证书：

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx -y

# 获取证书
sudo certbot --nginx -d md.mengbin.top

# 证书会自动配置到 Nginx
```

#### 3. 配置 Nginx

将项目中的 `nginx.conf` 复制到 Nginx 配置目录：

```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/mindflow
sudo ln -s /etc/nginx/sites-available/mindflow /etc/nginx/sites-enabled/
```

修改 SSL 证书路径（如果使用自签名证书）：

```bash
sudo nano /etc/nginx/sites-available/mindflow
```

#### 4. 构建应用

```bash
# 在 packages/web 目录下
pnpm install
pnpm build
```

#### 5. 部署到服务器

使用部署脚本：

```bash
# 1. 设置脚本执行权限
chmod +x deploy/deploy.sh

# 2. 配置环境变量
cp deploy/.env.example deploy/.env
nano deploy/.env  # 填写服务器信息

# 3. 运行部署脚本
./deploy/deploy.sh
```

或手动部署：

```bash
# 使用 rsync 同步文件
rsync -avz --delete dist/ user@md.mengbin.top:/var/www/mindflow/

# 重新加载 Nginx
ssh user@md.mengbin.top "sudo systemctl reload nginx"
```

#### 6. 验证部署

访问 `https://md.mengbin.top` 检查是否正常工作。

---

### 方式二：Docker 部署

#### 注意事项

项目提供两个 Nginx 配置文件：
- `nginx.dev.conf` - 开发环境（HTTP only）
- `nginx.conf` - 生产环境（HTTPS + SSL）

默认 Dockerfile 使用开发环境配置。

#### 方法 1：使用自动化脚本（推荐）

从项目根目录运行：

```bash
# 构建并运行（默认使用 dev 环境）
cd packages/web/deploy
./docker-build.sh

# 或指定环境
./docker-build.sh dev  # 开发环境
./docker-build.sh prod # 生产环境
```

脚本会自动：
1. 安装依赖并构建项目
2. 构建 Docker 镜像
3. 询问是否立即运行容器

#### 方法 2：手动构建

**开发环境（HTTP）**:
```bash
# 1. 从项目根目录构建项目
cd packages/web
pnpm install
pnpm build

# 2. 返回项目根目录并构建 Docker 镜像
cd ../..
docker build -t mindflow-web:dev -f packages/web/deploy/Dockerfile .

# 3. 运行容器
docker run -d \
  --name mindflow-web-dev \
  -p 8080:80 \
  mindflow-web:dev
```

访问: http://localhost:8080

**生产环境（HTTPS）**:
```bash
# 需要修改 Dockerfile 使用 nginx.prod.conf
# 或手动挂载 SSL 证书

docker run -d \
  --name mindflow-web-prod \
  -p 80:80 \
  -p 443:443 \
  -v /path/to/ssl:/etc/nginx/ssl:ro \
  mindflow-web:prod
```

#### 容器管理命令

```bash
# 查看日志
docker logs -f mindflow-web-dev

# 停止容器
docker stop mindflow-web-dev

# 删除容器
docker rm mindflow-web-dev

# 删除镜像
docker rmi mindflow-web:dev
```

#### 方法 3：使用 Docker Compose

项目根目录已包含 `docker-compose.yml` 配置文件。

**步骤**:

```bash
# 1. 构建项目
cd packages/web
pnpm install
pnpm build

# 2. 返回项目根目录
cd ../..

# 3. 构建镜像
docker build -t mindflow-web:latest -f packages/web/deploy/Dockerfile .

# 4. 启动服务
docker-compose up -d
```

**访问**: http://localhost:8080

**其他命令**:
```bash
# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 重启服务
docker-compose restart
```

---

## CI/CD 自动化部署

### GitHub Actions

创建 `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install pnpm
        run: npm install -g pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile
        working-directory: ./packages/web

      - name: Build
        run: pnpm build
        working-directory: ./packages/web

      - name: Deploy to server
        uses: easingthemes/ssh-deploy@main
        env:
          SSH_PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
          REMOTE_HOST: ${{ secrets.REMOTE_HOST }}
          REMOTE_USER: ${{ secrets.REMOTE_USER }}
          TARGET: /var/www/mindflow
          SOURCE: packages/web/dist/
```

配置 GitHub Secrets:
- `SSH_PRIVATE_KEY`: SSH 私钥
- `REMOTE_HOST`: 服务器地址
- `REMOTE_USER`: SSH 用户名

---

## 性能优化

### 1. 启用 HTTP/2

Nginx 配置已包含 HTTP/2 支持。

### 2. 配置 CDN

将静态资源上传到 CDN（如阿里云 OSS、腾讯云 COS）：

```javascript
// vite.config.ts
export default defineConfig({
  base: 'https://cdn.mengbin.top/mindflow/',
})
```

### 3. 启用 Brotli 压缩

安装 Nginx Brotli 模块：

```bash
sudo apt install nginx-module-brotli
```

在 `nginx.conf` 中添加：

```nginx
brotli on;
brotli_comp_level 6;
brotli_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;
```

---

## 监控和日志

### 查看访问日志

```bash
tail -f /var/log/nginx/mindflow_access.log
```

### 查看错误日志

```bash
tail -f /var/log/nginx/mindflow_error.log
```

### 配置日志分析（可选）

使用 GoAccess 实时分析日志：

```bash
sudo apt install goaccess
goaccess /var/log/nginx/mindflow_access.log -c
```

---

## 故障排查

### 问题：页面 404

- 检查 Nginx 配置中的 `root` 路径是否正确
- 确认 `dist` 目录已正确上传

### 问题：API 请求失败

- 检查 CORS 配置
- 确认后端服务正常运行

### 问题：SSL 证书错误

- 使用 `sudo certbot renew` 更新证书
- 检查证书路径配置

---

## 回滚

如果部署出现问题，快速回滚：

```bash
# 备份当前版本
ssh user@server "sudo cp -r /var/www/mindflow /var/www/mindflow.backup"

# 回滚到旧版本
ssh user@server "sudo rm -rf /var/www/mindflow && sudo mv /var/www/mindflow.backup /var/www/mindflow"
```

---

## 更新日志

- 2026-01-25: 初始版本，支持传统部署和 Docker 部署
