# MindFlow 移动端发布：从配置到上架的完整指南

> **日期**: 2026-01-30
> **版本**: v1.0.0
> **发布平台**: iOS + Android

---

## 项目简介

**MindFlow Mobile** 是 MindFlow 的移动端版本，基于 Flutter 构建，支持 iOS 和 Android 双平台。经过 Phase 10 的密集开发，现已完成所有核心功能，准备好发布到应用商店。

### 本次发布亮点

- 🚀 **Flutter 跨平台**：一套代码，双平台运行
- 📝 **完整 Markdown 支持**：编辑、预览、实时渲染
- 📁 **本地文件管理**：SQLite 存储，离线可用
- 🎨 **Material 3 设计**：现代化 UI，支持深色模式
- ⚡ **自动保存**：2 秒延迟自动保存，数据不丢失
- 🌐 **多语言支持**：中文/英文切换

---

## 发布准备

### Phase 10 完成情况

| 任务 | 工作量 | 优先级 | 状态 |
|------|--------|--------|------|
| Flutter项目搭建 | 1天 | P0 | ✅ 完成 |
| 移动端UI设计 | 4天 | P0 | ✅ 完成 |
| 编辑器移动端适配 | 5天 | P0 | ✅ 完成 |
| 文件管理移动端 | 3天 | P0 | ✅ 完成 |
| 手势操作 | 2天 | P1 | ✅ 完成 |
| iOS打包发布 | 2天 | P1 | ✅ 配置完成 |
| Android打包发布 | 2天 | P1 | ✅ 配置完成 |

### 交付物清单

1. ✅ **完整 Flutter 项目**（lib/ 18 个文件，~1870 行代码）
2. ✅ **iOS 配置**（Info.plist, Xcode 项目, 图标配置）
3. ✅ **Android 配置**（build.gradle, ProGuard, 签名配置）
4. ✅ **发布文档**（DEPLOYMENT.md, RELEASE_NOTES.md）
5. ✅ **测试报告**（6/6 测试通过，静态分析 0 错误）

---

## 第一部分：iOS 发布配置

### 1.1 项目信息配置

**Info.plist 配置：**

```xml
<!-- 应用名称 -->
<key>CFBundleDisplayName</key>
<string>MindFlow</string>

<!-- 版本信息 -->
<key>CFBundleShortVersionString</key>
<string>$(FLUTTER_BUILD_NAME)</string>
<key>CFBundleVersion</key>
<string>$(FLUTTER_BUILD_NUMBER)</string>

<!-- 文件关联 -->
<key>CFBundleDocumentTypes</key>
<array>
  <dict>
    <key>CFBundleTypeName</key>
    <string>Markdown Document</string>
    <key>CFBundleTypeRole</key>
    <string>Editor</string>
    <key>LSItemContentTypes</key>
    <array>
      <string>net.daringfireball.markdown</string>
      <string>public.plain-text</string>
    </array>
  </dict>
</array>

<!-- 文件共享 -->
<key>UIFileSharingEnabled</key>
<true/>
<key>LSSupportsOpeningDocumentsInPlace</key>
<true/>
```

### 1.2 图标配置

**图标尺寸要求：**

| 尺寸 | 用途 | 文件名 |
|------|------|--------|
| 20x20@2x/3x | iPhone 通知 | Icon-20x20@2x.png |
| 29x29@2x/3x | iPhone 设置 | Icon-29x29@2x.png |
| 40x40@2x/3x | iPhone Spotlight | Icon-40x40@2x.png |
| 60x60@2x/3x | iPhone App | Icon-60x60@2x.png |
| 76x76@1x/2x | iPad App | Icon-76x76@1x.png |
| 83.5x83.5@2x | iPad Pro | Icon-83.5x83.5@2x.png |
| 1024x1024 | App Store | Icon-1024x1024@1x.png |

**图标配置文件：**

```json
// Assets.xcassets/AppIcon.appiconset/Contents.json
{
  "images": [
    {
      "filename": "Icon-20x20@2x.png",
      "idiom": "iphone",
      "scale": "2x",
      "size": "20x20"
    },
    // ... 更多配置
  ]
}
```

### 1.3 启动图配置

**LaunchScreen.storyboard：**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<document>
  <scenes>
    <scene>
      <viewController>
        <view>
          <imageView
            image="LaunchImage"
            contentMode="center"/>
        </view>
      </viewController>
    </scene>
  </scenes>
</document>
```

### 1.4 构建命令

```bash
# 安装依赖
cd ios && pod install && cd ..

# 构建 Release 版本
flutter build ios --release

# 构建 IPA 文件
flutter build ipa --release

# 输出位置
build/ios/archive/Runner.xcarchive
build/ios/ipa/MindFlow.ipa
```

---

## 第二部分：Android 发布配置

### 2.1 签名密钥配置

**创建密钥库：**

```bash
cd android/app

keytool -genkey -v \
  -keystore mindflow.keystore \
  -alias mindflow \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# 密码: mindflow123
# 组织信息按提示填写
```

**build.gradle 配置：**

```gradle
android {
    defaultConfig {
        applicationId "com.mindflow.app"
        minSdkVersion 21
        targetSdkVersion flutter.targetSdkVersion
        versionCode flutterVersionCode.toInteger()
        versionName flutterVersionName
        multiDexEnabled true
    }

    signingConfigs {
        release {
            keyAlias 'mindflow'
            keyPassword 'mindflow123'
            storeFile file('mindflow.keystore')
            storePassword 'mindflow123'
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile(
                'proguard-android-optimize.txt'
            ), 'proguard-rules.pro'
        }
    }
}
```

### 2.2 ProGuard 配置

**proguard-rules.pro：**

```proguard
# Flutter
-keep class io.flutter.app.** { *; }
-keep class io.flutter.plugin.** { *; }
-keep class io.flutter.util.** { *; }
-keep class io.flutter.view.** { *; }
-keep class io.flutter.** { *; }
-keep class io.flutter.plugins.** { *; }

# SQLite
-keep class org.sqlite.** { *; }

# Model classes
-keep class com.mindflow.app.** { *; }

# Native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Parcelable
-keep class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator *;
}

# R class
-keepclassmembers class **.R$* {
    public static <fields>;
}
```

### 2.3 图标配置

**图标目录结构：**

```
android/app/src/main/res/
├── mipmap-mdpi/      # 48x48
│   └── ic_launcher.png
├── mipmap-hdpi/      # 72x72
│   └── ic_launcher.png
├── mipmap-xhdpi/     # 96x96
│   └── ic_launcher.png
├── mipmap-xxhdpi/    # 144x144
│   └── ic_launcher.png
└── mipmap-xxxhdpi/   # 192x192
    └── ic_launcher.png
```

### 2.4 构建命令

```bash
# 构建 APK
flutter build apk --release

# 构建 App Bundle (推荐用于 Play Store)
flutter build appbundle --release

# 输出位置
build/app/outputs/flutter-apk/app-release.apk
build/app/outputs/bundle/release/app-release.aab
```

### 2.5 APK 分析

```bash
# 查看 APK 内容
cd build/app/outputs/flutter-apk/
unzip -l app-release.apk

# 典型内容：
# AndroidManifest.xml
# classes.dex
# lib/arm64-v8a/libflutter.so
# lib/armeabi-v7a/libflutter.so
# assets/flutter_assets/
```

---

## 第三部分：发布文档

### 3.1 发布检查清单

#### iOS App Store

- [x] 应用图标（18 个尺寸）
- [x] 启动图配置
- [x] Info.plist 配置
- [x] 签名证书配置
- [x] 隐私政策链接
- [ ] App Store Connect 创建应用
- [ ] 截图（5.5寸、6.5寸 iPhone，12.9寸 iPad）
- [ ] 应用描述
- [ ] 关键词设置
- [ ] 审核信息填写

#### Android Google Play

- [x] 应用图标（5 个尺寸）
- [x] 签名密钥创建
- [x] build.gradle 配置
- [x] ProGuard 规则
- [ ] Play Console 创建应用
- [ ] 隐私政策声明
- [ ] 应用分类
- [ ] 内容分级问卷
- [ ] 截图（手机、平板）

### 3.2 版本信息

```yaml
# pubspec.yaml
version: 1.0.0+1

# 版本号规则：
# 1.0.0 - 主版本.次版本.修订号
# +1    - 构建号（每次发布递增）
```

**版本说明：**

- **1.0.0**: 初始版本
  - 主版本 1：首个正式发布
  - 次版本 0：基础功能
  - 修订号 0：无修复
- **+1**: 构建号，每次提交到商店递增

### 3.3 隐私政策

**必需内容：**

```markdown
# MindFlow 隐私政策

## 数据收集
MindFlow 不收集任何用户数据。所有文件存储在本地设备上。

## 权限使用
- 存储权限：用于保存 Markdown 文件
- 网络权限：仅用于加载外部资源（如图片）

## 数据安全
所有数据存储在设备本地，不会上传到任何服务器。

## 联系我们
如有问题，请联系：support@mindflow.example.com
```

---

## 第四部分：商店上传指南

### 4.1 iOS App Store

**步骤 1：Xcode 归档**

```bash
# 使用 Xcode 打开项目
open ios/Runner.xcworkspace

# Product → Archive
# 等待构建完成
```

**步骤 2：上传 App**

```
Organizer 窗口 → Distribute App → App Store Connect
→ Upload → 选择签名 → 上传
```

**步骤 3：App Store Connect**

1. 访问 https://appstoreconnect.apple.com
2. 创建新应用（我的 App → +）
3. 填写应用信息
4. 选择上传的构建版本
5. 提交审核

**审核时间：** 通常 1-3 个工作日

### 4.2 Android Google Play

**步骤 1：构建 App Bundle**

```bash
flutter build appbundle --release
```

**步骤 2：Play Console**

1. 访问 https://play.google.com/console
2. 创建新应用
3. 设置 → 应用签名
4. 生产版本 → 创建新版本
5. 上传 app-release.aab

**步骤 3：发布**

1. 填写商店详情
2. 设置内容分级
3. 定价和分发范围
4. 提交审核

**审核时间：** 通常几小时到 1 天

---

## 项目结构

### 发布相关文件

```
packages/mobile/
├── android/
│   ├── app/
│   │   ├── build.gradle           # 构建配置
│   │   ├── proguard-rules.pro     # 混淆规则
│   │   └── mindflow.keystore      # 签名密钥
│   └── ...
├── ios/
│   ├── Runner/
│   │   ├── Info.plist             # 应用配置
│   │   ├── Assets.xcassets/       # 图标资源
│   │   └── Base.lproj/            # 启动图
│   └── Runner.xcodeproj/          # Xcode 项目
├── docs/
│   ├── DEPLOYMENT.md              # 部署指南
│   └── RELEASE_NOTES.md           # 发布说明
├── lib/                           # Dart 代码
└── pubspec.yaml                   # 版本配置
```

---

## 核心技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Flutter | 3.38.8 | 跨平台框架 |
| Dart | 3.10.7 | 编程语言 |
| flutter_bloc | 8.1.6 | 状态管理 |
| sqflite | 2.4.2 | SQLite 数据库 |
| flutter_markdown | 0.6.23 | Markdown 渲染 |

### 支持平台

| 平台 | 最低版本 | 状态 |
|------|----------|------|
| iOS | 13.0+ | ✅ 配置完成 |
| Android | 5.0 (API 21)+ | ✅ 配置完成 |
| Web | Chrome/Edge/Safari | ✅ 构建成功 |

---

## 性能指标

### 构建大小

| 平台 | 大小 | 说明 |
|------|------|------|
| iOS IPA | ~15 MB | 预估（需实际构建） |
| Android APK | ~20 MB | 预估（需实际构建） |
| Android AAB | ~15 MB | 预估（需实际构建） |
| Web | 3.4 MB | 已验证 |

### 运行时性能

- **启动时间**: < 2 秒（预估）
- **内存占用**: ~50 MB（预估）
- **数据库**: SQLite，支持数万条记录

---

## 快速开始

### 开发者

```bash
# 克隆项目
git clone https://github.com/your-org/mindflow.git
cd mindflow/packages/mobile

# 安装依赖
flutter pub get

# 运行开发版
flutter run

# 运行测试
flutter test
```

### 发布者

```bash
# iOS 构建
flutter build ios --release
flutter build ipa --release

# Android 构建
flutter build apk --release
flutter build appbundle --release
```

---

## 总结

MindFlow 移动端已完成所有发布准备工作：

✅ **iOS 配置**：签名、图标、启动图、Info.plist
✅ **Android 配置**：签名、ProGuard、构建配置
✅ **文档完善**：部署指南、发布说明、检查清单
✅ **测试通过**：静态分析 0 错误，单元测试 6/6 通过

**下一步**：
1. 注册 Apple Developer 账号 ($99/年)
2. 注册 Google Play 开发者账号 ($25一次性)
3. 上传应用到商店审核

---

## 相关文档

- [部署指南](./packages/mobile/docs/DEPLOYMENT.md)
- [发布说明](./packages/mobile/docs/RELEASE_NOTES.md)
- [测试报告](./packages/mobile/TEST_REPORT.md)
- [开发排期](./docs/开发排期.md)

---

**欢迎体验 MindFlow 移动端！**

💬 **讨论**: [GitHub Discussions](https://github.com/your-org/mindflow/discussions)
🐛 **问题反馈**: [GitHub Issues](https://github.com/your-org/mindflow/issues)

---

*MindFlow - 随时随地，记录灵感*

MIT License © 2026 MindFlow Team
