import { BrowserWindow, dialog } from 'electron'
import { join } from 'path'
import icon from '../../../resources/icon.png?asset'

export class JSRunWindow {
  private static instance: JSRun | null = null

  public static getInstance() {
    if (!this.instance) {
      this.instance = new JSRun()
      this.instance.on('closed', () => {
        this.instance = null
      })
    }
    return this.instance
  }
}

class JSRun extends BrowserWindow {
  constructor() {
    super({
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

    this.loadURL('http://jsitor.com')

    let closeTimer: NodeJS.Timeout
    this.on('close', () => {
      closeTimer = setTimeout(() => {
        const idx = dialog.showMessageBoxSync(this, {
          type: 'question',
          title: '提示',
          message: '页面有改动，是否保存后退出？',
          buttons: ['取消', '退出'],
          defaultId: 0
        })

        if (idx === 1) {
          this.destroy()
        }
      }, 200)
    })

    this.on('closed', () => {
      clearTimeout(closeTimer)
      this.destroy()
    })
  }
}
