// Nhớ trạng thái giao diện nhỏ (tab đang mở, mục đang gập) cho lần mở sau. Lỗi lưu trữ thì bỏ qua.
import { ref, watch, type Ref } from 'vue'

export function remembered<T>(key: string, initial: T): Ref<T> {
  let start = initial
  try {
    const raw = localStorage.getItem(`renchu.ui.${key}`)
    if (raw !== null) start = JSON.parse(raw) as T
  } catch {
    /* không đọc được: dùng giá trị mặc định */
  }
  const state = ref(start) as Ref<T>
  watch(state, (v) => {
    try {
      localStorage.setItem(`renchu.ui.${key}`, JSON.stringify(v))
    } catch {
      /* không lưu được: chỉ mất trạng thái ở lần mở sau */
    }
  })
  return state
}
