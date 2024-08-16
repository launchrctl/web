import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import env from 'vite-plugin-env-compatible'

export default defineConfig({
  plugins: [react(), env()],
})
