import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {
  UIProvider,
  extendConfig,
} from "@yamada-ui/react"
import type { ThemeConfig } from "@yamada-ui/react"
import App from './App.tsx'


export const config: ThemeConfig = {
  initialColorMode: "light",
  useSystemColorMode: false,
}
const customConfig = extendConfig(config)


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UIProvider config={customConfig}>
      <App />
    </UIProvider>
  </StrictMode>,
)
