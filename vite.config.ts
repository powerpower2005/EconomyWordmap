import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // 빌드에서 제외할 디렉토리 (기본적으로 src와 public만 포함됨)
  publicDir: 'public',
})
