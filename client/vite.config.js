// This file tells the development tool (Vite) how to build and run the website.
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  server: {
    // While developing, forward any request starting with "/api" to our server on port 5000.
    proxy: { '/api': 'http://localhost:5000' },
  },
})
