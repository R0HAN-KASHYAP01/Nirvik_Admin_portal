// lib/schemeCatalog.js

export const SCHEME_CATEGORIES = [
  { value: 'educational', label: 'Educational' },
  { value: 'economic_development', label: 'Economic Development' },
  { value: 'social_empowerment', label: 'Social Empowerment' },
]

export const SCHEMES = [
  { code: 'post_matric_scholarship_sc', category: 'educational', label: 'Post-Matric Scholarship – SC' },
  { code: 'pre_matric_scholarship_sc_others', category: 'educational', label: 'Pre-Matric Scholarship – SC & Others' },
  { code: 'pm_yasasvi', category: 'educational', label: 'PM YASASVI' },
  { code: 'shreyas_sc', category: 'educational', label: 'SHREYAS – SC' },
  { code: 'seed', category: 'economic_development', label: 'SEED' },
  { code: 'visvas_obc', category: 'economic_development', label: 'VISVAS – OBC' },
  { code: 'namaste', category: 'economic_development', label: 'NAMASTE' },
  { code: 'pm_daksh', category: 'economic_development', label: 'PM-DAKSH' },
  { code: 'pm_ajay', category: 'social_empowerment', label: 'PM-AJAY' },
  { code: 'pcr_poa_strengthening', category: 'social_empowerment', label: 'Strengthening Machinery for PCR/PoA Acts' },
  { code: 'avyay', category: 'social_empowerment', label: 'AVYAY' },
  { code: 'smile', category: 'social_empowerment', label: 'SMILE' },
]

export const schemesForCategory = (category) =>
  SCHEMES.filter((s) => s.category === category)

export const schemeLabel = (code) =>
  SCHEMES.find((s) => s.code === code)?.label || code

export const categoryLabel = (value) =>
  SCHEME_CATEGORIES.find((c) => c.value === value)?.label || value