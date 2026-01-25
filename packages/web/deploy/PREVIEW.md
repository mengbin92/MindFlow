# 本地预览构建产物

在部署到生产环境之前，可以先本地预览构建产物。

## 方法一：使用 Vite Preview（推荐）

```bash
cd packages/web
pnpm preview
```

然后在浏览器访问: http://localhost:4173

## 方法二：使用 Python HTTP Server

```bash
cd packages/web/dist
python3 -m http.server 8080
```

然后在浏览器访问: http://localhost:8080

## 方法三：使用 Nginx（本地）

```bash
# 启动 Nginx
nginx

# 如果需要自定义配置
nginx -c /path/to/custom/nginx.conf
```

## 方法四：使用 Docker

```bash
# 构建镜像
docker build -t mindflow-web:local -f packages/web/deploy/Dockerfile .

# 运行容器
docker run -d -p 8080:80 --name mindflow-web-local mindflow-web:local
```

然后在浏览器访问: http://localhost:8080

---

## 验证检查清单

预览时请检查：

- [ ] 页面正常加载，无404错误
- [ ] 编辑器可以正常输入
- [ ] 文件树显示正常
- [ ] 主题切换功能正常
- [ ] 导出功能（PDF、HTML、图片）正常
- [ ] 演示模式正常
- [ ] 浏览器控制台无错误
- [ ] 所有静态资源正常加载（CSS、JS、字体）

---

## 部署到生产环境

预览通过后，请参考 [README.md](./README.md) 进行实际部署。

域名: **https://md.mengbin.top**
