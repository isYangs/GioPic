import type { BrowserWindow } from 'electron'

const CORS_HEADERS: Record<string, string | string[]> = {
  'Access-Control-Allow-Origin': ['*'],
  'Access-Control-Allow-Methods': ['*'],
  'Access-Control-Allow-Headers': ['*'],
  'Access-Control-Allow-Credentials': ['true'],
  'Access-Control-Max-Age': ['3600'],
  'Access-Control-Expose-Headers': ['*'],
}

export function fixElectronCors(win: BrowserWindow) {
  const { webRequest } = win.webContents.session

  webRequest.onBeforeSendHeaders((details, callback) => {
    callback({
      requestHeaders: { Origin: '*', ...details.requestHeaders },
    })
  })

  webRequest.onHeadersReceived((details, callback) => {
    if (!details.responseHeaders) {
      callback({})
      return
    }

    const newHeaders = Object.entries(details.responseHeaders)
      .filter(([key]) => !key.toLowerCase().startsWith('access-control-'))
      .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), CORS_HEADERS)

    callback({ responseHeaders: newHeaders })
  })
}
