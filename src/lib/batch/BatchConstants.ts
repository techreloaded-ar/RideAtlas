export const VALID_CHARACTERISTICS = [
  'Strade sterrate',
  'Curve strette',
  'Presenza pedaggi',
  'Presenza traghetti',
  'Autostrada',
  'Bel paesaggio',
  'Visita prolungata',
  'Interesse gastronomico',
  'Interesse storico-culturale'
] as const

export const VALID_SEASONS = [
  'Primavera',
  'Estate',
  'Autunno',
  'Inverno'
] as const

export const SUPPORTED_IMAGE_TYPES = ['.jpg', '.jpeg', '.png', '.webp']
export const SUPPORTED_VIDEO_TYPES = ['.mp4', '.mov', '.avi']

export const SYSTEM_FILES_TO_IGNORE = [
  '.ds_store',
  'thumbs.db',
  'desktop.ini',
  '.directory',
  '.localized',
  '__macosx',
  '.spotlight-v100',
  '.trashes',
  '.fseventsd',
  '.volumeicon.icns',
  '.git',
  '.gitignore',
  '.svn',
  '.hg',
  'node_modules'
]

export const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB