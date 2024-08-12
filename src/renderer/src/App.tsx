import { Box, IconButton, Input } from '@mui/material'

import WestIcon from '@mui/icons-material/West'
import RefreshIcon from '@mui/icons-material/Refresh'
// import GpsFixedSharpIcon from '@mui/icons-material/GpsFixedSharp'
// import PushPinIcon from '@mui/icons-material/PushPin'
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight'

import { BROWSER_BAR_HEIGHT, COMMAND } from '../../constant'
import { useEffect, useState } from 'react'
function App(): JSX.Element {
  const [url, setUrl] = useState('')

  useEffect(() => {
    window.electron.ipcRenderer.on(COMMAND.routeChange, (_e, newUrl) => {
      if (newUrl !== url) {
        setUrl(newUrl)
      }
    })

    return () => {
      window.electron.ipcRenderer.removeAllListeners(COMMAND.routeChange)
    }
  }, [])
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        width: '100vw',
        height: BROWSER_BAR_HEIGHT,
        overflow: 'hidden',
        backgroundColor: '#e9e9e9'
      }}
    >
      <IconButton size="small" onClick={() => window.electron.ipcRenderer.send(COMMAND.back, {})}>
        <WestIcon />
      </IconButton>
      <IconButton
        size="small"
        onClick={() => window.electron.ipcRenderer.send(COMMAND.refresh, {})}
      >
        <RefreshIcon />
      </IconButton>
      <Input
        sx={{
          flex: 1,
          '&:before,&:after': { border: 'none !important' },
          background: 'white',
          p: '0 4px',
          pt: '4px',
          borderRadius: '4px',
          alignItems: 'center'
        }}
        placeholder="Enter your URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            const url = /^\w/.test(e.currentTarget.value)
              ? e.currentTarget.value
              : `http://${e.currentTarget.value}`
            window.electron.ipcRenderer.send(COMMAND.go, { url })
          }
        }}
        size="small"
      />
      <IconButton
        size="small"
        onClick={() => window.electron.ipcRenderer.send(COMMAND.showMenu, {})}
      >
        <KeyboardDoubleArrowRightIcon />
      </IconButton>
    </Box>
  )
}

export default App
