import { Router, IRouter } from 'express'

const router: IRouter = Router()

router.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'scout-backend',
    timestamp: new Date().toISOString(),
  })
})

export default router
