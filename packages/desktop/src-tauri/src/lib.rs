use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::Path;
use tauri::State;
use walkdir::WalkDir;

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
    fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read file: {}", e))
}

#[tauri::command]
async fn write_file(path: String, content: String) -> Result<(), String> {
    fs::write(&path, content)
        .map_err(|e| format!("Failed to write file: {}", e))
}

#[tauri::command]
async fn create_file(path: String) -> Result<FileInfo, String> {
    let path_obj = Path::new(&path);

    // 创建父目录（如果不存在）
    if let Some(parent) = path_obj.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create directory: {}", e))?;
    }

    // 创建文件
    fs::File::create(&path)
        .map_err(|e| format!("Failed to create file: {}", e))?;

    file_info_from_path(&path_obj, true)
}

#[tauri::command]
async fn create_dir(path: String) -> Result<FileInfo, String> {
    fs::create_dir_all(&path)
        .map_err(|e| format!("Failed to create directory: {}", e))?;

    file_info_from_path(Path::new(&path), true)
}

#[tauri::command]
async fn delete_file(path: String) -> Result<(), String> {
    let path_obj = Path::new(&path);

    if path_obj.is_dir() {
        fs::remove_dir_all(&path)
            .map_err(|e| format!("Failed to remove directory: {}", e))?;
    } else {
        fs::remove_file(&path)
            .map_err(|e| format!("Failed to remove file: {}", e))?;
    }

    Ok(())
}

#[tauri::command]
async fn rename_file(old_path: String, new_path: String) -> Result<FileInfo, String> {
    fs::rename(&old_path, &new_path)
        .map_err(|e| format!("Failed to rename: {}", e))?;

    file_info_from_path(Path::new(&new_path), true)
}

#[tauri::command]
async fn read_directory(path: String) -> Result<Vec<FileInfo>, String> {
    let path_obj = Path::new(&path);

    if !path_obj.exists() {
        return Err("Directory does not exist".to_string());
    }

    if !path_obj.is_dir() {
        return Err("Path is not a directory".to_string());
    }

    let mut files = Vec::new();

    for entry in WalkDir::new(&path)
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
    let path_obj = Path::new(&path);

    if !path_obj.exists() {
        return Err("Path does not exist".to_string());
    }

    build_file_tree(&path_obj, None)
}

#[tauri::command]
async fn search_files(
    path: String,
    query: String,
    _state: State<'_, FileSystemState>,
) -> Result<Vec<FileInfo>, String> {
    let query_lower = query.to_lowercase();
    let mut results = Vec::new();

    for entry in WalkDir::new(&path)
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

    let path_obj = Path::new(&path);

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

// Tauri命令注册
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
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
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
