# MindFlow Mobile 发布指南

## 前置要求

- Flutter SDK 3.0+
- Dart SDK 3.0+

## iOS 发布

### 1. 环境准备

```bash
# 安装 Xcode（App Store）
# 安装 CocoaPods
sudo gem install cocoapods

# 验证环境
flutter doctor
```

### 2. 配置签名

1. 打开 `ios/Runner.xcworkspace` 用 Xcode
2. 选择 Runner 项目
3. 在 Signing & Capabilities 中:
   - 选择你的 Apple Developer Team
   - 修改 Bundle Identifier (如: com.yourcompany.mindflow)

### 3. 配置图标

```bash
# 生成 iOS 图标
cd ios/Runner/Assets.xcassets/AppIcon.appiconset
# 将 SVG 转换为各尺寸的 PNG 放入此目录
```

图标尺寸:
- 20x20@2x, 20x20@3x (iPhone)
- 29x29@2x, 29x29@3x (iPhone)
- 40x40@2x, 40x40@3x (iPhone)
- 60x60@2x, 60x60@3x (iPhone)
- 20x20@1x, 20x20@2x (iPad)
- 29x29@1x, 29x29@2x (iPad)
- 40x40@1x, 40x40@2x (iPad)
- 76x76@1x, 76x76@2x (iPad)
- 83.5x83.5@2x (iPad Pro)
- 1024x1024@1x (App Store)

### 4. 构建和上传

```bash
# 清理
flutter clean

# 安装依赖
flutter pub get
cd ios && pod install && cd ..

# 构建 Release 版本
flutter build ios --release

# 或构建 IPA
flutter build ipa --release
```

### 5. 上传到 App Store

1. 打开 Xcode
2. Product → Archive
3. Distribute App → App Store Connect
4. 按照提示上传

---

## Android 发布

### 1. 创建签名密钥

```bash
cd android/app

# 创建密钥库
keytool -genkey -v -keystore mindflow.keystore -alias mindflow -keyalg RSA -keysize 2048 -validity 10000

# 输入密码: mindflow123
# 填写其他信息
```

### 2. 配置签名

`android/app/build.gradle` 已配置，检查:

```gradle
signingConfigs {
    release {
        keyAlias 'mindflow'
        keyPassword 'mindflow123'
        storeFile file('mindflow.keystore')
        storePassword 'mindflow123'
    }
}
```

### 3. 配置图标

```bash
# 生成 Android 图标
flutter pub run flutter_launcher_icons:main
```

或手动放入:
- `android/app/src/main/res/mipmap-mdpi/` (48x48)
- `android/app/src/main/res/mipmap-hdpi/` (72x72)
- `android/app/src/main/res/mipmap-xhdpi/` (96x96)
- `android/app/src/main/res/mipmap-xxhdpi/` (144x144)
- `android/app/src/main/res/mipmap-xxxhdpi/` (192x192)

### 4. 构建 APK/AAB

```bash
# 清理
flutter clean

# 安装依赖
flutter pub get

# 构建 APK
flutter build apk --release

# 构建 App Bundle (推荐用于 Play Store)
flutter build appbundle --release
```

### 5. 上传到 Google Play

1. 访问 [Google Play Console](https://play.google.com/console)
2. 创建应用
3. 上传 `build/app/outputs/bundle/release/app-release.aab`

---

## Web 发布

```bash
# 构建 Web 版本
flutter build web --release

# 部署到服务器
rsync -avz build/web/ user@server:/var/www/html/
```

---

## 版本号管理

### iOS
- `ios/Runner/Info.plist`: `CFBundleShortVersionString` (版本号), `CFBundleVersion` (构建号)

### Android
- `android/app/build.gradle`: `versionName` (版本号), `versionCode` (构建号)
- `pubspec.yaml`: `version: 1.0.0+1` (版本号+构建号)

---

## 发布检查清单

- [ ] 版本号已更新
- [ ] 图标已配置
- [ ] 启动图已配置
- [ ] 应用名称正确
- [ ] 签名密钥已创建（Android）
- [ ] 签名配置正确
- [ ] Release 模式测试通过
- [ ] 隐私政策链接
- [ ] 应用截图
- [ ] 应用描述
- [ ] 关键词

---

## 常见问题

### iOS 构建失败
```bash
# 清理
flutter clean
rm -rf ios/Pods ios/Podfile.lock
flutter pub get
cd ios && pod install --repo-update
```

### Android 构建失败
```bash
# 清理
flutter clean
rm -rf android/.gradle
flutter pub get
```

### 签名错误
```bash
# 验证密钥
keytool -list -v -keystore android/app/mindflow.keystore
```

---

## 联系方式

如有问题，请联系开发团队。
