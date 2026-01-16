// 防止在 Windows 的 release 版本中出现额外的控制台窗口
// 这个属性是必须的，请勿删除
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

/**
 * @fileoverview MindFlow 桌面端主程序
 * @description 使用 Tauri + Rust 构建的桌面应用后端
 * @module desktop-tauri-main
 * @author MindFlow Team
 * @license MIT
 */

/**
 * 应用程序入口函数
 * @description 初始化 Tauri 应用并注册命令处理器
 */
fn main() {
    tauri::Builder::default()
        // 初始化 shell 插件，允许打开外部链接等操作
        .plugin(tauri_plugin_shell::init())
        // 注册前端可以调用的 Tauri 命令
        .invoke_handler(tauri::generate_handler![
            greet,  // 示例命令：问候功能
        ])
        // 运行 Tauri 应用，从 tauri.conf.json 读取配置
        .run(tauri::generate_context!())
        // 如果运行失败，输出错误信息并 panic
        .expect("error while running tauri application");
}

/**
 * 问候命令
 * @description 一个示例 Tauri 命令，演示如何从前端调用 Rust 函数
 * @param name - 要问候的名字
 * @return 包含问候信息的字符串
 *
 * @example
 * 在前端 JavaScript 中调用：
 * ```javascript
 * import { invoke } from '@tauri-apps/api/tauri';
 * const message = await invoke('greet', { name: 'World' });
 * console.log(message); // "Hello, World! You've been greeted from Rust!"
 * ```
 */
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}
