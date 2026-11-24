use tauri::menu::{MenuBuilder, MenuItemBuilder};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Manager, PhysicalPosition, Position, Rect, Runtime, Size};

pub fn install<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
    let open_main = MenuItemBuilder::with_id("open-main", "打开主窗口").build(app)?;
    let quit = MenuItemBuilder::with_id("quit", "退出 dcc-mcp").build(app)?;
    let menu = MenuBuilder::new(app).items(&[&open_main, &quit]).build()?;

    let _tray = TrayIconBuilder::new()
        .icon(
            app.default_window_icon()
                .expect("default window icon is configured")
                .clone(),
        )
        .menu(&menu)
        .on_menu_event(|app, event| match event.id().as_ref() {
            "open-main" => show_main_window(app),
            "quit" => app.exit(0),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| match event {
            TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                position,
                rect,
                ..
            } => toggle_quick_panel(tray.app_handle(), position, rect),
            TrayIconEvent::DoubleClick {
                button: MouseButton::Left,
                ..
            } => {
                if let Some(window) = tray.app_handle().get_webview_window("tray") {
                    let _ = window.hide();
                }
                show_main_window(tray.app_handle());
            }
            _ => {}
        })
        .build(app)?;

    Ok(())
}

fn toggle_quick_panel<R: Runtime>(
    app: &AppHandle<R>,
    tray_position: PhysicalPosition<f64>,
    tray_rect: Rect,
) {
    let Some(window) = app.get_webview_window("tray") else {
        return;
    };

    if window.is_visible().unwrap_or(false) {
        let _ = window.hide();
        return;
    }

    const PANEL_WIDTH: i32 = 380;
    const PANEL_HEIGHT: i32 = 540;
    const PANEL_GAP: i32 = 8;

    let tray_width = match tray_rect.size {
        Size::Physical(size) => size.width as i32,
        Size::Logical(size) => size.width as i32,
    };
    let tray_height = match tray_rect.size {
        Size::Physical(size) => size.height as i32,
        Size::Logical(size) => size.height as i32,
    };
    let mut x = tray_position.x as i32 + (tray_width / 2) - PANEL_WIDTH / 2;
    let mut y = tray_position.y as i32 - PANEL_HEIGHT - PANEL_GAP;

    if let Ok(Some(monitor)) = window.current_monitor() {
        let monitor_position = monitor.position();
        let monitor_size = monitor.size();
        let monitor_mid_y = monitor_position.y + (monitor_size.height as i32 / 2);
        let tray_is_near_top = tray_position.y as i32 <= monitor_mid_y;
        if tray_is_near_top {
            y = tray_position.y as i32 + tray_height + PANEL_GAP;
        }
        let min_x = monitor_position.x + PANEL_GAP;
        let max_x = monitor_position.x + monitor_size.width as i32 - PANEL_WIDTH - PANEL_GAP;
        x = x.clamp(min_x, max_x.max(min_x));
    }

    let _ = window.set_position(Position::Physical(PhysicalPosition::new(x, y)));
    let _ = window.show();
    let _ = window.set_focus();
}

pub fn show_main_window<R: Runtime>(app: &AppHandle<R>) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.set_focus();
    }
}
