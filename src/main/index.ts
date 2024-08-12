import {
  app,
  BrowserWindow,
  ipcMain,
  WebContentsView,
  Menu,
  MenuItem,
  globalShortcut
} from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

import { BROWSER_BAR_HEIGHT, COMMAND } from '../constant'

let JSWin: BrowserWindow | null = null

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    //transparent: true,
    // alwaysOnTop: true,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  const view = new WebContentsView()
  mainWindow.contentView.addChildView(view)

  function updateViewSize(): void {
    view.setBounds({
      x: 0,
      y: BROWSER_BAR_HEIGHT,
      width: mainWindow.getBounds().width,
      height: mainWindow.getBounds().height - BROWSER_BAR_HEIGHT - 30
    })
  }

  mainWindow.on('resize', updateViewSize)
  updateViewSize()
  view.setBackgroundColor('white')

  view.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send(COMMAND.routeChange, view.webContents.getURL())
    mainWindow.setTitle(view.webContents.getTitle())
  })
  view.webContents.on('did-navigate-in-page', (_, url) => {
    mainWindow.webContents.send(COMMAND.routeChange, url)
  })
  view.webContents.on('page-title-updated', (_, title) => {
    mainWindow.setTitle(title)
    if (view.webContents.isDevToolsOpened()) {
      view.webContents.setDevToolsTitle(`${title} - DevTools`)
    }
  })

  ipcMain.on(COMMAND.toggleDevTool, () => view.webContents.toggleDevTools())
  ipcMain.on(COMMAND.back, () => {
    view.webContents.goBack()
    // const a =new BrowserWindow({
    //   width: 900,
    //   height: 670,
    //   alwaysOnTop: true,
    //   transparent: true,
    //   autoHideMenuBar: true,
    //   ...(process.platform === 'linux' ? { icon } : {}),
    //   webPreferences: {
    //     preload: join(__dirname, '../preload/index.js'),
    //     sandbox: false
    //   }
    // })
    // a.loadFile(join(__dirname, '../renderer/index.html'))
  })
  ipcMain.on(COMMAND.forward, () => view.webContents.goForward())
  ipcMain.on(COMMAND.refresh, () => view.webContents.reload())
  ipcMain.on(COMMAND.go, (_, payload) => view.webContents.loadURL(payload.url))
  ipcMain.on(COMMAND.showMenu, (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)!
    const template = [
      new MenuItem({
        label: '置顶',
        checked: mainWindow.isAlwaysOnTop(),
        type: 'checkbox',
        click: (): void => mainWindow.setAlwaysOnTop(!mainWindow.isAlwaysOnTop())
      }),
      new MenuItem({
        label: '调试',
        click: async (): Promise<void> => {
          view.webContents.closeDevTools()
          if (!(view.webContents.isDevToolsOpened() && view.webContents.isDevToolsFocused())) {
            view.webContents.openDevTools({
              title: `${view.webContents.getTitle()} - DevTools`,
              mode: 'detach'
            })
          }
        }
      })
    ]
    const menu = Menu.buildFromTemplate(template)
    menu.popup({ window })
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  // mainWindow.webContents.setWindowOpenHandler((details) => {
  //   shell.openExternal(details.url)
  //   return { action: 'deny' }
  // })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // 注册 CmdOrCtrl+Shift+I 快捷键
  const newJSWin = (): void => {
    if (!JSWin) {
      JSWin = new BrowserWindow({
        width: 900,
        height: 670,
        show: true,
        autoHideMenuBar: true,
        ...(process.platform === 'linux' ? { icon } : {}),
        webPreferences: {
          preload: join(__dirname, '../preload/index.js'),
          sandbox: false
        }
      })
      JSWin.loadURL('http://jsitor.com')

      JSWin.on('closed', () => {
        JSWin = null
      })
    } else {
      JSWin.show()
      JSWin.focus()
    }
  }

  if (process.platform === 'darwin') {
    globalShortcut.register('Cmd+Shift+J', () => {
      newJSWin()
    })
  } else {
    globalShortcut.register('Ctrl+Shift+J', () => {
      newJSWin()
    })
  }

  mainWindow.on('closed', () => {
    globalShortcut.unregisterAll()
    app.quit()
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

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
  JSWin && JSWin.close()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
