import { log } from '@/server/utils/logger'

export function applyRequestMetric(input: {
  route: string
  method: string
  duration: number
  success: boolean
  statusCode: number
  requestId: string
}) {
  log(input.success ? 'info' : 'error', 'REQUEST_METRIC', input)
}