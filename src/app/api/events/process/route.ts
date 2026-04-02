import { processEvents } from '@/server/events/worker'
import { handleError } from '../../_utils/handleError'

export async function POST() {
  try {
    const result = await processEvents(10)

    return Response.json({
      ok: true,
      processed: result,
    })
  } catch (err) {
    return handleError(err)
  }
}