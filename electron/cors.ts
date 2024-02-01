import type { BrowserWindow } from 'electron'

export function fixElectronCors(win: BrowserWindow) {
  win.webContents.session.webRequest.onBeforeSendHeaders((details, callback) => {
    callback({ requestHeaders: { Origin: '*', ...details.requestHeaders } })
  })

  win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    if (details.responseHeaders) {
      let newHeaders = details.responseHeaders
      let headerAlreadySet = false

      for (const [key, value] of Object.entries(details.responseHeaders)) {
        if (key.toLowerCase() === 'access-control-allow-origin') {
          if (value[0] === '*')
            headerAlreadySet = true

          break
        }
      }

      if (!headerAlreadySet) {
        newHeaders = {
          ...details.responseHeaders,
          'Access-Control-Allow-Origin': ['*'],
        }
      }

      callback({ responseHeaders: newHeaders })
    }
  })
}
