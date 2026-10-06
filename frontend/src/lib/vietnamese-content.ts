// Nội dung luyện viết: bảng chữ cái tiếng Việt, chữ số, vần, từ, câu ứng dụng.

/** 29 chữ cái tiếng Việt theo thứ tự sách Tiếng Việt lớp 1. */
export const ALPHABET = [
  'a', 'ă', 'â', 'b', 'c', 'd', 'đ', 'e', 'ê', 'g', 'h', 'i', 'k', 'l', 'm',
  'n', 'o', 'ô', 'ơ', 'p', 'q', 'r', 's', 't', 'u', 'ư', 'v', 'x', 'y',
]

export const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']

/** Chữ hoa của một chữ cái (toUpperCase giữ đúng Ă Â Đ Ê Ô Ơ Ư). */
export const upper = (ch: string) => ch.toLocaleUpperCase('vi')

export interface TextPreset {
  label: string
  lines: string[]
  /** Chuỗi ngắn (vần, từ) thì mặc định lặp cho kín dòng */
  repeat: boolean
}

export const TEXT_PRESETS: TextPreset[] = [
  { label: 'Vần an, ăn, ân…', lines: ['an', 'ăn', 'ân', 'on', 'ôn', 'ơn', 'un', 'ưn'], repeat: true },
  { label: 'Vần at, ăt, ât…', lines: ['at', 'ăt', 'ât', 'ot', 'ôt', 'ơt', 'ut', 'ưt'], repeat: true },
  { label: 'Vần ang, anh, ong…', lines: ['ang', 'anh', 'ong', 'ông', 'ung', 'ưng', 'inh', 'ênh'], repeat: true },
  { label: 'Vần ai, oi, ôi…', lines: ['ai', 'oi', 'ôi', 'ơi', 'ui', 'ưi', 'ay', 'ây'], repeat: true },
  { label: 'Vần ao, eo, au…', lines: ['ao', 'eo', 'au', 'âu', 'iu', 'êu', 'ưu', 'ươu'], repeat: true },
  { label: 'Từ ngữ quen thuộc', lines: ['bà ba', 'cá rô', 'quả na', 'ngôi nhà', 'chú mèo', 'mặt trời', 'cây bàng', 'trường học'], repeat: true },
  {
    label: 'Tục ngữ, thành ngữ',
    lines: [
      'Có công mài sắt, có ngày nên kim.',
      'Ăn quả nhớ kẻ trồng cây.',
      'Uống nước nhớ nguồn.',
      'Học ăn, học nói, học gói, học mở.',
      'Anh em như thể tay chân.',
      'Lá lành đùm lá rách.',
      'Tốt gỗ hơn tốt nước sơn.',
    ],
    repeat: false,
  },
  {
    label: 'Ca dao',
    lines: [
      'Công cha như núi Thái Sơn,',
      'Nghĩa mẹ như nước trong nguồn chảy ra.',
      'Một cây làm chẳng nên non,',
      'Ba cây chụm lại nên hòn núi cao.',
      'Bầu ơi thương lấy bí cùng,',
      'Tuy rằng khác giống nhưng chung một giàn.',
    ],
    repeat: false,
  },
  {
    label: 'Câu ứng dụng lớp 1',
    lines: ['Bé Hà có vở ô li.', 'Mẹ đi chợ mua cá.', 'Bố cho bé đi sở thú.', 'Chú gà trống gáy ò ó o.', 'Bé tập viết chữ đẹp.'],
    repeat: false,
  },
]
