import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'


export default defineConfig({
  root: '.', // Looks for index.html in root
  base: "/",
  publicDir: 'public', // Your other static files
    base: "/", // ensures correct asset paths on Vercel
  plugins: [react()],
  server: {
    port: 3000
  }
})
