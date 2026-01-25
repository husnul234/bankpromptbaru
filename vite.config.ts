import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // PENTING: base './' memastikan aset (js/css) dipanggil secara relatif.
  // Ini mencegah layar blank saat deploy manual ke Netlify.
  base: './',
})