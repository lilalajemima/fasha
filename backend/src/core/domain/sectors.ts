export const SECTORS = [
  'Bumbogo',
  'Gatsata',
  'Gikomero',
  'Gisozi',
  'Jabana',
  'Jali',
  'Kacyiru',
  'Kimihurura',
  'Kimironko',
  'Kinyinya',
  'Ndera',
  'Nduba',
  'Remera',
  'Rusororo',
  'Rutunga',
  'Other',
]

export function isSector(value: string): boolean {
  return SECTORS.includes(value)
}
