import { electronApp, optimizer } from '@electron-toolkit/utils'
import { app, BrowserWindow, globalShortcut, Menu, MenuItem } from 'electron'

import { FloatBrowser } from './plugins/FloatBrowser'
import { registerShortcut } from './utils/shortKey'

function createWindow(): void {
  new FloatBrowser()
}

function addMenu(): void {
  const currentMenu = Menu.getApplicationMenu()
  const fileMenu = currentMenu!.items.find((item) => ['窗口', 'Window'].includes(item.label))
  fileMenu!.submenu?.insert(
    0,
    new MenuItem({
      label: '置顶',
      accelerator: 'CmdOrCtrl+Shift+F', // 定义快捷键
      click: (_, window) => {
        if (window) {
          window.setAlwaysOnTop(!window.isAlwaysOnTop())
        }
      }
    })
  )
  Menu.setApplicationMenu(currentMenu)
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()
  addMenu()
  registerShortcut()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  globalShortcut.unregisterAll()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
