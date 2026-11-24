use tauri::menu::{MenuBuilder, MenuItemBuilder};
use tauri::tray::{MouseButton, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Manager, Runtime};

pub fn install<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
    let open_main = MenuItemBuilder::with_id("open-main", "打开主窗口").build(app)?;
    let quit = MenuItemBuilder::with_id("quit", "退出 dcc-mcp").build(app)?;
    let menu = MenuBuilder::new(app)
        .items(&[&open_main, &quit])
        .build()?;

    let _tray = TrayIconBuilder::new()
        .icon(app.default_window_icon().expect("default window icon is configured").clone())
        .menu(&menu)
        .on_menu_event(|app, event| match event.id().as_ref() {
            "open-main" => show_main_window(app),
            "quit" => app.exit(0),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if matches!(event, TrayIconEvent::Click { button: MouseButton::Left, .. }) {
                if let Some(window) = tray.app_handle().get_webview_window("tray") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        })
        .build(app)?;

    Ok(())
}

pub fn show_main_window<R: Runtime>(app: &AppHandle<R>) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.set_focus();
    }
}
