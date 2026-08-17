export type StyleId = 'dossier' | 'modernist' | 'fieldbook'

export type StyleOption = {
  id: StyleId
  number: string
  name: string
  short: string
  summary: string
  strengths: string[]
  palette: string[]
  type: string
}

export const styleOptions: StyleOption[] = [
  {
    id: 'dossier',
    number: '01',
    name: 'Diplomatic Dossier',
    short: 'Institutional · warm · archival',
    summary: 'A working folder from a serious foreign service: cream paper, typed labels, restrained burgundy, and documents clipped into a case file.',
    strengths: ['The diplomacy premise reads immediately', 'Dense information feels intentional', 'Warm and human rather than technological'],
    palette: ['#f3eee2', '#282721', '#8d2f32', '#b89a62'],
    type: 'Newsreader + IBM Plex Mono',
  },
  {
    id: 'modernist',
    number: '02',
    name: 'Modernist Manual',
    short: 'Graphic · direct · instructional',
    summary: 'A bold 1960s systems manual with generous type, hard rules, primary colors, and diagrammatic cards. The game reads like a legible training exercise.',
    strengths: ['Fastest to scan at a glance', 'Card differences are unmistakable', 'Feels designed without feeling “sci-fi”'],
    palette: ['#f5f3ed', '#151515', '#1758d5', '#ed4a2f'],
    type: 'Archivo Black + Inter',
  },
  {
    id: 'fieldbook',
    number: '03',
    name: 'Contact Fieldbook',
    short: 'Observational · tactile · personal',
    summary: 'A xenologist’s annotated notebook: moss ink, ochre tabs, hand-marked observations, specimen sketches, and cards treated as field techniques.',
    strengths: ['Makes information gathering feel central', 'Supports discovery and annotation', 'Distinctive, intimate tone'],
    palette: ['#eee6d2', '#24372a', '#b55f32', '#6d8060'],
    type: 'Lora + Patrick Hand',
  },
]
