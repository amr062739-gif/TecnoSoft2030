import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/TecnoSoft2030/', // اسم المستودع على GitHub
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
})
