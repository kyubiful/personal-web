import es from './locale/es.json'
import en from './locale/en.json'

interface Languages {
  es: string
  en: string
}

export const languages: Languages = {
  es: 'es',
  en: 'en'
}

export const defaultLang = 'es'
export const showDefaultLang = false

export const ui = {
  es,
  en
} as const
