
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Configuración para publicar ZAOR en GitHub Pages
export default defineConfig({
  plugins: [react()],
  base: '/Zaor-Inventory/',
})
