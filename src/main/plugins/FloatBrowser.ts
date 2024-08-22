import { is } from '@electron-toolkit/utils'
import {
  BrowserWindow,
  ipcMain,
  Menu,
  MenuItem,
  WebContentsView
} from 'electron'
import { join } from 'path'
import { BROWSER_BAR_HEIGHT, COMMAND } from '../../constant'
import icon from '../../../resources/icon.png?asset'

export class FloatBrowser extends BrowserWindow {
  constructor() {
    super({
      width: 900,
      height: 670,
      show: false,
      autoHideMenuBar: true,
      ...(process.platform === 'linux' ? { icon } : {}),
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        sandbox: false
      }
    })

    this.createWindow()
  }

  private createWindow() {
    // Create the browser window.
    const browserWindow = this

    const view = new WebContentsView()
    browserWindow.contentView.addChildView(view)

    function updateViewSize(): void {
      view.setBounds({
        x: 0,
        y: BROWSER_BAR_HEIGHT,
        width: browserWindow.getBounds().width,
        height: browserWindow.getBounds().height - BROWSER_BAR_HEIGHT - 30
      })
    }

    browserWindow.on('resize', updateViewSize)
    updateViewSize()
    view.setBackgroundColor('white')

    view.webContents.on('did-finish-load', () => {
      browserWindow.webContents.send(COMMAND.routeChange, view.webContents.getURL())
      browserWindow.setTitle(view.webContents.getTitle())
    })
    view.webContents.on('did-navigate-in-page', (_, url) => {
      browserWindow.webContents.send(COMMAND.routeChange, url)
    })
    view.webContents.on('page-title-updated', (_, title) => {
      browserWindow.setTitle(title)
      if (view.webContents.isDevToolsOpened()) {
        view.webContents.setDevToolsTitle(`${title} - DevTools`)
      }
    })

    ipcMain.on(COMMAND.toggleDevTool, () => view.webContents.toggleDevTools())
    ipcMain.on(COMMAND.back, () => {
      view.webContents.goBack()
    })
    ipcMain.on(COMMAND.forward, () => view.webContents.goForward())
    ipcMain.on(COMMAND.refresh, () => view.webContents.reload())
    ipcMain.on(COMMAND.go, (_, payload) => view.webContents.loadURL(payload.url))
    ipcMain.on(COMMAND.showMenu, (event) => {
      const window = BrowserWindow.fromWebContents(event.sender)!
      const template = [
        new MenuItem({
          label: '置顶',
          checked: browserWindow.isAlwaysOnTop(),
          type: 'checkbox',
          click: (): void => browserWindow.setAlwaysOnTop(!browserWindow.isAlwaysOnTop())
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

    browserWindow.on('ready-to-show', () => {
      browserWindow.show()
    })

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      browserWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    } else {
      browserWindow.loadFile(join(__dirname, '../renderer/index.html'))
    }
  }
}
