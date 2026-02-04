use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::env;
use std::fs;
use std::path::Path;
use tauri::State;
use walkdir::WalkDir;

// ==================== 配置相关结构 ====================

/// 应用配置结构
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AppConfig {
    pub theme: String,
    pub font_size: u32,
    pub font_family: String,
    pub tab_size: u32,
    pub word_wrap: bool,
    pub line_numbers: bool,
    pub auto_save: bool,
    pub auto_save_delay: u32,
}

/// 默认配置
impl Default for AppConfig {
    fn default() -> Self {
        Self {
            theme: "light".to_string(),
            font_size: 14,
            font_family: "Fira Code".to_string(),
            tab_size: 4,
            word_wrap: true,
            line_numbers: true,
            auto_save: true,
            auto_save_delay: 1000,
        }
    }
}

// ==================== 窗口状态相关结构 ====================

/// 窗口状态
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct WindowState {
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
    pub is_maximized: bool,
    pub is_fullscreen: bool,
}

impl Default for WindowState {
    fn default() -> Self {
        Self {
            x: 100,
            y: 100,
            width: 1280,
            height: 800,
            is_maximized: false,
            is_fullscreen: false,
        }
    }
}

/// 获取窗口状态文件路径
fn get_window_state_path() -> Result<std::path::PathBuf, String> {
    let config_dir = if let Ok(home) = env::var("HOME") {
        format!("{}/.config/mindflow", home)
    } else if let Ok(appdata) = env::var("APPDATA") {
        format!("{}\\MindFlow", appdata)
    } else {
        return Err("无法确定配置目录".to_string());
    };

    let config_path = std::path::PathBuf::from(config_dir);

    // 确保配置目录存在
    fs::create_dir_all(&config_path)
        .map_err(|e| format!("Failed to create config directory: {}", e))?;

    Ok(config_path.join("window_state.json"))
}

/// 保存窗口状态
fn save_window_state(state: &WindowState) -> Result<(), String> {
    let state_path = get_window_state_path()?;
    let state_json = serde_json::to_string_pretty(&state)
        .map_err(|e| format!("Failed to serialize window state: {}", e))?;

    fs::write(&state_path, state_json)
        .map_err(|e| format!("Failed to write window state file: {}", e))?;

    Ok(())
}

/// 加载窗口状态
fn load_window_state() -> Result<WindowState, String> {
    let state_path = get_window_state_path()?;

    if !state_path.exists() {
        return Ok(WindowState::default());
    }

    let state_content = fs::read_to_string(&state_path)
        .map_err(|e| format!("Failed to read window state file: {}", e))?;

    let state: WindowState = serde_json::from_str(&state_content)
        .map_err(|e| format!("Failed to parse window state file: {}", e))?;

    Ok(state)
}

/// 获取配置文件路径
fn get_config_path() -> Result<std::path::PathBuf, String> {
    let config_dir = if let Ok(home) = env::var("HOME") {
        format!("{}/.config/mindflow", home)
    } else if let Ok(appdata) = env::var("APPDATA") {
        format!("{}\\MindFlow", appdata)
    } else {
        return Err("无法确定配置目录".to_string());
    };

    let config_path = std::path::PathBuf::from(config_dir);

    // 确保配置目录存在
    fs::create_dir_all(&config_path)
        .map_err(|e| format!("Failed to create config directory: {}", e))?;

    Ok(config_path.join("config.json"))
}

/// 展开路径中的 ~ 符号为用户主目录
fn expand_home(path: &str) -> String {
    if path.starts_with("~/") || path == "~" {
        if let Some(home) = env::var("HOME").ok().or_else(|| env::var("USERPROFILE").ok()) {
            return if path == "~" {
                home
            } else {
                format!("{}{}", home, &path[1..])
            };
        }
    }
    path.to_string()
}

// 文件信息结构
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct FileInfo {
    pub id: String,
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub children: Option<Vec<FileInfo>>,
    pub content: Option<String>,
    pub modified_time: u64,
    pub size: u64,
}

// 文件系统状态
pub struct FileSystemState {
    pub open_files: HashMap<String, String>,
}

#[tauri::command]
async fn read_file(path: String) -> Result<String, String> {
    let expanded = expand_home(&path);
    fs::read_to_string(&expanded)
        .map_err(|e| format!("Failed to read file: {}", e))
}

#[tauri::command]
async fn write_file(path: String, content: String) -> Result<(), String> {
    let expanded = expand_home(&path);
    fs::write(&expanded, content)
        .map_err(|e| format!("Failed to write file: {}", e))
}

#[tauri::command]
async fn create_file(path: String) -> Result<FileInfo, String> {
    let expanded = expand_home(&path);
    let path_obj = Path::new(&expanded);

    // 创建父目录（如果不存在）
    if let Some(parent) = path_obj.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create directory: {}", e))?;
    }

    // 创建文件
    fs::File::create(&path_obj)
        .map_err(|e| format!("Failed to create file: {}", e))?;

    file_info_from_path(&path_obj, true)
}

#[tauri::command]
async fn create_dir(path: String) -> Result<FileInfo, String> {
    let expanded = expand_home(&path);
    let path_obj = Path::new(&expanded);
    fs::create_dir_all(&path_obj)
        .map_err(|e| format!("Failed to create directory: {}", e))?;

    file_info_from_path(&path_obj, true)
}

#[tauri::command]
async fn delete_file(path: String) -> Result<(), String> {
    let expanded = expand_home(&path);
    let path_obj = Path::new(&expanded);

    if path_obj.is_dir() {
        fs::remove_dir_all(&path_obj)
            .map_err(|e| format!("Failed to remove directory: {}", e))?;
    } else {
        fs::remove_file(&path_obj)
            .map_err(|e| format!("Failed to remove file: {}", e))?;
    }

    Ok(())
}

#[tauri::command]
async fn rename_file(old_path: String, new_path: String) -> Result<FileInfo, String> {
    let expanded_old = expand_home(&old_path);
    let expanded_new = expand_home(&new_path);
    fs::rename(&expanded_old, &expanded_new)
        .map_err(|e| format!("Failed to rename: {}", e))?;

    file_info_from_path(Path::new(&expanded_new), true)
}

#[tauri::command]
async fn read_directory(path: String) -> Result<Vec<FileInfo>, String> {
    let expanded = expand_home(&path);
    let path_obj = Path::new(&expanded);

    if !path_obj.exists() {
        return Err("Directory does not exist".to_string());
    }

    if !path_obj.is_dir() {
        return Err("Path is not a directory".to_string());
    }

    let mut files = Vec::new();

    for entry in WalkDir::new(&path_obj)
        .min_depth(1)
        .max_depth(1)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        let file_info = file_info_from_path(entry.path(), false)?;
        files.push(file_info);
    }

    // 排序：目录在前，文件在后
    files.sort_by(|a, b| {
        match (a.is_dir, b.is_dir) {
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
            _ => a.name.cmp(&b.name),
        }
    });

    Ok(files)
}

#[tauri::command]
async fn get_file_tree(path: String) -> Result<FileInfo, String> {
    let expanded = expand_home(&path);
    let path_obj = Path::new(&expanded);

    // 如果目录不存在，自动创建
    if !path_obj.exists() {
        fs::create_dir_all(&path_obj)
            .map_err(|e| format!("Failed to create directory: {}", e))?;
    }

    build_file_tree(&path_obj, None)
}

#[tauri::command]
async fn search_files(
    path: String,
    query: String,
    _state: State<'_, FileSystemState>,
) -> Result<Vec<FileInfo>, String> {
    let expanded = expand_home(&path);
    let query_lower = query.to_lowercase();
    let mut results = Vec::new();

    for entry in WalkDir::new(&expanded)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        let file_name = entry.file_name().to_string_lossy();
        if file_name.to_lowercase().contains(&query_lower) {
            let file_info = file_info_from_path(entry.path(), false)?;
            results.push(file_info);
        }
    }

    Ok(results)
}

#[tauri::command]
async fn get_recent_files(
    state: State<'_, FileSystemState>,
) -> Result<Vec<FileInfo>, String> {
    let mut files: Vec<FileInfo> = state
        .open_files
        .iter()
        .map(|(path, _)| {
            file_info_from_path(Path::new(path), false)
        })
        .filter_map(|r| r.ok())
        .collect();

    // 按修改时间排序
    files.sort_by(|a, b| b.modified_time.cmp(&a.modified_time));

    Ok(files)
}

#[tauri::command]
async fn watch_directory(
    path: String,
    window: tauri::Window,
) -> Result<(), String> {
    use notify::{EventKind, RecursiveMode, Watcher};

    let expanded = expand_home(&path);
    let path_obj = Path::new(&expanded);

    let mut watcher = notify::recommended_watcher(move |res| {
        match res {
            Ok(event) => {
                if let notify::Event {
                    kind: EventKind::Create(_),
                    ..
                } = event
                {
                    let _ = window.emit("file-created", event.paths);
                } else if let notify::Event {
                    kind: EventKind::Modify(_),
                    ..
                } = event
                {
                    let _ = window.emit("file-modified", event.paths);
                } else if let notify::Event {
                    kind: EventKind::Remove(_),
                    ..
                } = event
                {
                    let _ = window.emit("file-deleted", event.paths);
                }
            }
            Err(e) => eprintln!("watch error: {:?}", e),
        }
    })
    .map_err(|e| format!("Failed to create watcher: {}", e))?;

    watcher
        .watch(path_obj, RecursiveMode::Recursive)
        .map_err(|e| format!("Failed to watch directory: {}", e))?;

    // 保持watcher活跃
    std::mem::forget(watcher);

    Ok(())
}

// 辅助函数：从路径创建FileInfo
fn file_info_from_path(path: &Path, with_content: bool) -> Result<FileInfo, String> {
    let metadata = fs::metadata(path)
        .map_err(|e| format!("Failed to get metadata: {}", e))?;

    let modified_time = metadata
        .modified()
        .map_err(|e| format!("Failed to get modified time: {}", e))?
        .duration_since(std::time::UNIX_EPOCH)
        .map_err(|e| format!("Failed to convert time: {}", e))?
        .as_secs();

    let name = path
        .file_name()
        .ok_or("Invalid file name")?
        .to_string_lossy()
        .to_string();

    let content = if with_content && !path.is_dir() {
        fs::read_to_string(path).ok()
    } else {
        None
    };

    Ok(FileInfo {
        id: generate_id(path),
        name,
        path: path.to_string_lossy().to_string(),
        is_dir: path.is_dir(),
        children: None,
        content,
        modified_time,
        size: metadata.len(),
    })
}

// 辅助函数：构建文件树
fn build_file_tree(path: &Path, max_depth: Option<usize>) -> Result<FileInfo, String> {
    let mut file_info = file_info_from_path(path, false)?;

    if path.is_dir() {
        let current_depth = max_depth.unwrap_or(10);

        if current_depth > 0 {
            let mut children = Vec::new();

            for entry in WalkDir::new(path)
                .min_depth(1)
                .max_depth(1)
                .into_iter()
                .filter_map(|e| e.ok())
            {
                let child_info = build_file_tree(entry.path(), Some(current_depth - 1))?;
                children.push(child_info);
            }

            // 排序：目录在前，文件在后
            children.sort_by(|a, b| {
                match (a.is_dir, b.is_dir) {
                    (true, false) => std::cmp::Ordering::Less,
                    (false, true) => std::cmp::Ordering::Greater,
                    _ => a.name.cmp(&b.name),
                }
            });

            file_info.children = Some(children);
        }
    }

    Ok(file_info)
}

// 辅助函数：生成唯一ID
fn generate_id(path: &Path) -> String {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};

    let mut hasher = DefaultHasher::new();
    path.hash(&mut hasher);
    format!("{:x}", hasher.finish())
}

// ==================== 配置管理命令 ====================

/// 保存配置到文件
#[tauri::command]
async fn save_config(config: AppConfig) -> Result<AppConfig, String> {
    let config_path = get_config_path()?;
    let config_json = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;

    fs::write(&config_path, config_json)
        .map_err(|e| format!("Failed to write config file: {}", e))?;

    Ok(config)
}

/// 从文件加载配置
#[tauri::command]
async fn load_config() -> Result<AppConfig, String> {
    let config_path = get_config_path()?;

    if !config_path.exists() {
        // 如果配置文件不存在，返回默认配置
        return Ok(AppConfig::default());
    }

    let config_content = fs::read_to_string(&config_path)
        .map_err(|e| format!("Failed to read config file: {}", e))?;

    let config: AppConfig = serde_json::from_str(&config_content)
        .map_err(|e| format!("Failed to parse config file: {}", e))?;

    Ok(config)
}

/// 导出配置到指定文件
#[tauri::command]
async fn export_config(config: AppConfig, file_path: String) -> Result<(), String> {
    let expanded = expand_home(&file_path);
    let path_obj = Path::new(&expanded);

    // 确保父目录存在
    if let Some(parent) = path_obj.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create directory: {}", e))?;
    }

    let config_json = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;

    fs::write(&path_obj, config_json)
        .map_err(|e| format!("Failed to write export file: {}", e))?;

    Ok(())
}

/// 从指定文件导入配置
#[tauri::command]
async fn import_config(file_path: String) -> Result<AppConfig, String> {
    let expanded = expand_home(&file_path);
    let config_content = fs::read_to_string(&expanded)
        .map_err(|e| format!("Failed to read import file: {}", e))?;

    let config: AppConfig = serde_json::from_str(&config_content)
        .map_err(|e| format!("Failed to parse config file: {}", e))?;

    // 同时保存到默认配置文件
    let config_path = get_config_path()?;
    let config_json = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;

    fs::write(&config_path, config_json)
        .map_err(|e| format!("Failed to write config file: {}", e))?;

    Ok(config)
}

// ==================== 窗口管理命令 ====================

/// 最小化窗口
#[tauri::command]
async fn minimize_window(window: tauri::Window) -> Result<(), String> {
    window.minimize()
        .map_err(|e| format!("Failed to minimize window: {}", e))
}

/// 最大化/还原窗口
#[tauri::command]
async fn toggle_maximize_window(window: tauri::Window) -> Result<bool, String> {
    let is_maximized = window.is_maximized()
        .map_err(|e| format!("Failed to get maximized state: {}", e))?;

    if is_maximized {
        window.unmaximize()
            .map_err(|e| format!("Failed to unmaximize window: {}", e))?;
        Ok(false)
    } else {
        window.maximize()
            .map_err(|e| format!("Failed to maximize window: {}", e))?;
        Ok(true)
    }
}

/// 关闭窗口
#[tauri::command]
async fn close_window(window: tauri::Window) -> Result<(), String> {
    window.close()
        .map_err(|e| format!("Failed to close window: {}", e))
}

/// 显示窗口
#[tauri::command]
async fn show_window(window: tauri::Window) -> Result<(), String> {
    window.show()
        .map_err(|e| format!("Failed to show window: {}", e))?;
    window.set_focus()
        .map_err(|e| format!("Failed to set focus: {}", e))
}

/// 隐藏窗口
#[tauri::command]
async fn hide_window(window: tauri::Window) -> Result<(), String> {
    window.hide()
        .map_err(|e| format!("Failed to hide window: {}", e))
}

/// 设置窗口标题
#[tauri::command]
async fn set_window_title(window: tauri::Window, title: String) -> Result<(), String> {
    window.set_title(&title)
        .map_err(|e| format!("Failed to set window title: {}", e))
}

/// 全屏/还原窗口
#[tauri::command]
async fn toggle_fullscreen(window: tauri::Window) -> Result<bool, String> {
    let is_fullscreen = window.is_fullscreen()
        .map_err(|e| format!("Failed to get fullscreen state: {}", e))?;

    if is_fullscreen {
        window.set_fullscreen(false)
            .map_err(|e| format!("Failed to exit fullscreen: {}", e))?;
        Ok(false)
    } else {
        window.set_fullscreen(true)
            .map_err(|e| format!("Failed to enter fullscreen: {}", e))?;
        Ok(true)
    }
}

/// 保存当前窗口状态
#[tauri::command]
async fn save_current_window_state(window: tauri::Window) -> Result<WindowState, String> {
    let current_monitor = window.current_monitor()
        .map_err(|e| format!("Failed to get current monitor: {}", e))?
        .ok_or("No current monitor")?;

    let monitor_position = current_monitor.position();
    let _monitor_size = current_monitor.size();

    // 获取窗口位置和大小
    let window_position = window.outer_position()
        .map_err(|e| format!("Failed to get window position: {}", e))?;
    let window_size = window.outer_size()
        .map_err(|e| format!("Failed to get window size: {}", e))?;

    // 计算相对于显示器的位置
    let x = window_position.x - monitor_position.x;
    let y = window_position.y - monitor_position.y;

    let state = WindowState {
        x,
        y,
        width: window_size.width,
        height: window_size.height,
        is_maximized: window.is_maximized()
            .map_err(|e| format!("Failed to get maximized state: {}", e))?,
        is_fullscreen: window.is_fullscreen()
            .map_err(|e| format!("Failed to get fullscreen state: {}", e))?,
    };

    save_window_state(&state)?;

    Ok(state)
}

/// 恢复窗口状态
#[tauri::command]
async fn restore_window_state(window: tauri::Window) -> Result<WindowState, String> {
    let state = load_window_state()?;

    // 获取当前显示器信息
    let current_monitor = window.current_monitor()
        .map_err(|e| format!("Failed to get current monitor: {}", e))?
        .ok_or("No current monitor")?;

    let monitor_position = current_monitor.position();
    let _monitor_size = current_monitor.size();

    // 计算绝对位置
    let _x = monitor_position.x + state.x;
    let _y = monitor_position.y + state.y;

    // 设置窗口位置和大小
    window.set_position(tauri::Position::Logical(tauri::LogicalPosition::new(
        state.x as f64,
        state.y as f64,
    )))
        .map_err(|e| format!("Failed to set window position: {}", e))?;

    window.set_size(tauri::Size::Logical(tauri::LogicalSize::new(
        state.width as f64,
        state.height as f64,
    )))
        .map_err(|e| format!("Failed to set window size: {}", e))?;

    // 恢复最大化/全屏状态
    if state.is_maximized {
        window.maximize()
            .map_err(|e| format!("Failed to maximize window: {}", e))?;
    } else if state.is_fullscreen {
        window.set_fullscreen(true)
            .map_err(|e| format!("Failed to set fullscreen: {}", e))?;
    }

    Ok(state)
}

/// 获取窗口状态
#[tauri::command]
async fn get_window_state() -> Result<WindowState, String> {
    load_window_state()
}

// ==================== Tauri命令注册 ====================
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    use tauri::{CustomMenuItem, GlobalShortcutManager, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem};

    // 创建系统托盘菜单
    let tray_menu = SystemTrayMenu::new()
        .add_item(CustomMenuItem::new("show".to_string(), "显示窗口"))
        .add_item(CustomMenuItem::new("hide".to_string(), "隐藏窗口"))
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(CustomMenuItem::new("quit".to_string(), "退出"));

    let system_tray = SystemTray::new().with_menu(tray_menu);

    tauri::Builder::default()
        .system_tray(system_tray)
        .on_system_tray_event(|app, event| match event {
            SystemTrayEvent::LeftClick {
                position: _,
                size: _,
                ..
            } => {
                // 左键点击托盘图标：显示/隐藏窗口
                if let Some(window) = app.get_window("main") {
                    if window.is_visible().unwrap_or(false) {
                        let _ = window.hide();
                    } else {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
            }
            SystemTrayEvent::MenuItemClick { id, .. } => {
                match id.as_str() {
                    "show" => {
                        if let Some(window) = app.get_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "hide" => {
                        if let Some(window) = app.get_window("main") {
                            let _ = window.hide();
                        }
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                }
            }
            _ => {}
        })
        .setup(|app| {
            // 注册全局快捷键：Ctrl/Cmd + Shift + M 显示/隐藏窗口
            let mut shortcuts = app.global_shortcut_manager();

            // 尝试注册全局快捷键
            if let Err(e) = shortcuts.register("CmdOrCtrl+Shift+M", move || {
                // 快捷键触发时的处理逻辑
                println!("Global shortcut triggered: Show/Hide MindFlow");
            }) {
                eprintln!("Failed to register global shortcut: {}", e);
            }

            Ok(())
        })
        .manage(FileSystemState {
            open_files: HashMap::new(),
        })
        .invoke_handler(tauri::generate_handler![
            read_file,
            write_file,
            create_file,
            create_dir,
            delete_file,
            rename_file,
            read_directory,
            get_file_tree,
            search_files,
            get_recent_files,
            watch_directory,
            save_config,
            load_config,
            export_config,
            import_config,
            minimize_window,
            toggle_maximize_window,
            close_window,
            show_window,
            hide_window,
            set_window_title,
            toggle_fullscreen,
            save_current_window_state,
            restore_window_state,
            get_window_state,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
