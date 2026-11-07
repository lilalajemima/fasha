import { Router } from 'express'
import {
  AVAILABILITY_SLOTS,
  DAYS,
  INTERESTS,
  PARTS,
  SKILLS,
} from '../../core/domain/catalogue'
import { SECTORS } from '../../core/domain/sectors'

export const catalogueRoutes = Router()

catalogueRoutes.get('/catalogue', (_req, res) => {
  res.set('Cache-Control', 'public, max-age=86400')
  res.json({
    interests: INTERESTS,
    skills: SKILLS,
    sectors: SECTORS,
    availability: { days: DAYS, parts: PARTS, slots: AVAILABILITY_SLOTS },
  })
})
