import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import yamlToJsonPlugin from './vite-plugin-yaml-to-json.js'

export default defineConfig({
  // GitHub Pages project site: set VITE_BASE=/RepoName/ in CI or .env.production
  base: process.env.VITE_BASE || '/',
  plugins: [
    yamlToJsonPlugin(), // YAML 파일 변경 시 자동으로 JSON 생성
    react()
  ],
  // 빌드에서 제외할 디렉토리 (기본적으로 src와 public만 포함됨)
  publicDir: 'public',
})
