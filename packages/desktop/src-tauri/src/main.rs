// 防止在 Windows 的 release 版本中出现额外的控制台窗口
// 这个属性是必须的，请勿删除
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    mindflow::run()
}
