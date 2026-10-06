import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Gộp class Tailwind an toàn (twMerge xử lý class trùng). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
