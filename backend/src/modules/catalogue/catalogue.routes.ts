import { Router } from 'express'
import {
  AVAILABILITY_SLOTS,
  DAYS,
  INTERESTS,
  PARTS,
  SKILLS,
} from '../../core/domain/catalogue'
import { SECTORS } from '../../core/domain/sectors'

/**
 * The lists every form picks from, served rather than copied into the client.
 * One source of truth means the browser cannot offer a tag the server will
 * then refuse. It is public and unchanging, so it is cached for a day.
 */
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
