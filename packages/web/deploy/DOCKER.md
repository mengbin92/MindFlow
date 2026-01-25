# Docker 部署快速参考

## 开发环境（HTTP）

### 快速开始
```bash
# 方式 1: 使用脚本
cd packages/web/deploy
./docker-build.sh dev

# 方式 2: 手动构建
cd packages/web && pnpm build && cd ../..
docker build -t mindflow-web:dev -f packages/web/deploy/Dockerfile .
docker run -d -p 8080:80 --name mindflow-web-dev mindflow-web:dev
```

访问: http://localhost:8080

## 生产环境（HTTPS）

### 准备工作
1. 获取 SSL 证书（Let's Encrypt 或自签名）
2. 修改 Dockerfile 使用 `nginx.conf`
3. 挂载证书到容器

### 部署步骤
```bash
# 1. 构建项目
cd packages/web && pnpm build && cd ../..

# 2. 构建镜像
docker build -t mindflow-web:prod -f packages/web/deploy/Dockerfile .

# 3. 运行容器（挂载证书）
docker run -d \
  --name mindflow-web-prod \
  -p 80:80 \
  -p 443:443 \
  -v /etc/nginx/ssl:/etc/nginx/ssl:ro \
  --restart unless-stopped \
  mindflow-web:prod
```

## Docker Compose

```bash
# 构建
cd packages/web && pnpm build && cd ../..
docker build -t mindflow-web:latest -f packages/web/deploy/Dockerfile .

# 启动
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止
docker-compose down
```

## 常用命令

```bash
# 查看运行中的容器
docker ps

# 查看容器日志
docker logs -f <container-name>

# 进入容器
docker exec -it <container-name> sh

# 停止容器
docker stop <container-name>

# 删除容器
docker rm <container-name>

# 删除镜像
docker rmi <image-name>

# 清理所有未使用的资源
docker system prune -a
```

## 故障排查

### 容器无法启动
```bash
# 查看日志
docker logs <container-name>

# 检查配置
docker run --rm -it mindflow-web:dev cat /etc/nginx/conf.d/default.conf
```

### 端口被占用
```bash
# 查看端口占用
lsof -i :8080

# 使用其他端口
docker run -d -p 9090:80 --name mindflow-web mindflow-web:dev
```

### SSL 证书问题
```bash
# 检查证书文件
ls -la /etc/nginx/ssl/

# 测试 Nginx 配置
docker run --rm -it mindflow-web:prod nginx -t
```

## 配置文件

| 文件 | 用途 |
|------|------|
| `nginx.dev.conf` | 开发环境（HTTP only） |
| `nginx.conf` | 生产环境（HTTPS + SSL） |
| `Dockerfile` | Docker 镜像构建配置 |
| `docker-compose.yml` | Docker Compose 配置 |

## 环境变量

无需要环境变量。如需自定义配置，请修改 `nginx.conf`。

## 数据持久化

当前配置为静态站点，无需数据持久化。如需保存用户数据，请挂载卷：

```bash
docker run -d \
  -v /path/to/data:/data \
  mindflow-web:dev
```

## 更新部署

```bash
# 1. 构建新版本
cd packages/web && pnpm build && cd ../..

# 2. 构建新镜像
docker build -t mindflow-web:dev -f packages/web/deploy/Dockerfile .

# 3. 停止并删除旧容器
docker stop mindflow-web-dev && docker rm mindflow-web-dev

# 4. 运行新容器
docker run -d -p 8080:80 --name mindflow-web-dev mindflow-web:dev
```

## 性能优化

### 使用多阶段构建减少镜像大小
当前 Dockerfile 已使用 Alpine 基础镜像，镜像大小约 40MB。

### 启用 Nginx 缓存
已在 `nginx.conf` 中配置静态资源缓存。

### 使用 CDN
将静态资源上传到 CDN，修改 `index.html` 中的资源路径。

## 安全建议

1. **使用非 root 用户运行**（已配置）
2. **启用 HTTPS**（生产环境）
3. **限制容器资源**:
   ```bash
   docker run -d \
     --memory="512m" \
     --cpus="1.0" \
     mindflow-web:dev
   ```
4. **定期更新基础镜像**:
   ```bash
   docker pull nginx:alpine
   docker build -t mindflow-web:dev -f packages/web/deploy/Dockerfile .
   ```

## 监控和日志

### 查看访问日志
```bash
docker logs -f mindflow-web-dev
```

### 集成日志系统
修改 `nginx.conf`，配置日志输出到标准输出/错误流。

### 健康检查
容器已配置 `/health` 端点：

```bash
curl http://localhost:8080/health
```

## 支持的平台

- Linux ✅
- macOS ✅
- Windows ✅（使用 Docker Desktop）
