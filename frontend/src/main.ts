import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

// Sáng/tối theo hệ điều hành (trang in luôn nền trắng)
const media = window.matchMedia('(prefers-color-scheme: dark)')
const applyTheme = () => document.documentElement.classList.toggle('dark', media.matches)
applyTheme()
media.addEventListener('change', applyTheme)

createApp(App).mount('#app')
