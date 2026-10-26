import { Router } from 'express'
import { QrCodeRenderer } from '../../core/qr/QrCodeRenderer'
import { TotpService } from '../../core/security/TotpService'
import { SystemClock } from '../../core/time/Clock'
import { authenticate } from '../../middleware/authenticate'
import { ApplicationRepository } from '../applications/ApplicationRepository'
import { OpportunityRepository } from '../opportunities/OpportunityRepository'
import { CheckinController } from './CheckinController'
import { CheckinRepository } from './CheckinRepository'
import { CheckinService } from './CheckinService'

const service = new CheckinService(
  new CheckinRepository(),
  new OpportunityRepository(),
  new ApplicationRepository(),
  new TotpService(),
  new SystemClock(),
)

const controller = new CheckinController(service, new QrCodeRenderer())

export const checkinRoutes = Router()

checkinRoutes.post('/opportunities/:id/checkin-code', authenticate, controller.open)
checkinRoutes.post('/opportunities/:id/checkins', authenticate, controller.checkIn)
checkinRoutes.post('/opportunities/:id/checkins/manual', authenticate, controller.markPresent)
checkinRoutes.get('/opportunities/:id/checkins', authenticate, controller.attendance)
checkinRoutes.patch('/checkins/:id/checkout', authenticate, controller.checkOut)
