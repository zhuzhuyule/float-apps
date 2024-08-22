import { BrowserWindow, globalShortcut, Menu } from 'electron'
import { FloatBrowser } from '../plugins/FloatBrowser'
import { JSRunWindow } from '../plugins/JSRunner'

function shortKey(key: string, ...args: ('cmd' | 'ctrl' | 'shift' | 'option' | 'alt')[]) {
  const keys: string[] = []
  if (process.platform === 'darwin') {
    if (args.includes('cmd')) keys.push('Cmd')
    if (args.includes('ctrl')) keys.push('Ctrl')
    if (args.includes('option')) keys.push('Option')
  } else {
    if (args.includes('cmd')) keys.push('Ctrl')
    if (args.includes('option')) keys.push('Alt')
  }
  if (args.includes('ctrl')) keys.push('Ctrl')
  if (args.includes('shift')) keys.push('Shift')
  if (args.includes('alt')) keys.push('Alt')
  keys.push(key.toLocaleUpperCase())
  return keys.join('+')
}

export function registerShortcut() {
  globalShortcut.register(shortKey('J', 'cmd', 'ctrl'), () => {
    JSRunWindow.getInstance().show()
    JSRunWindow.getInstance().focus()
  })

  globalShortcut.register(shortKey('B', 'cmd', 'ctrl'), () => {
    new FloatBrowser()
  })
}
