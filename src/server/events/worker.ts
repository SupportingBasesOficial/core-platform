import { createSupabaseServerClient } from '../db/supabaseServer'

function getNextRetryDate(attempts: number) {
  const seconds = Math.pow(2, attempts)
  return new Date(Date.now() + seconds * 1000).toISOString()
}

export async function processEvents(limit = 10) {
  const supabase = createSupabaseServerClient()

  const { data: events, error: lockError } = await supabase.rpc('lock_events', {
    limit_count: limit,
  })

  if (lockError) {
    throw lockError
  }

  const results: Array<{
    id: string
    type: string
    status: 'processed' | 'retry_scheduled' | 'dead'
  }> = []

  for (const event of events || []) {
    try {
      switch (event.type) {
        case 'sale_created':
          console.log('PROCESSING_EVENT', {
            type: event.type,
            eventId: event.id,
            payload: event.payload,
          })

          // teste de falha forçada opcional
          if ((event.payload as any)?.force_fail === true) {
            throw new Error('FORCED_EVENT_FAILURE')
          }

          break

        default:
          console.log('UNKNOWN_EVENT_TYPE', {
            type: event.type,
            eventId: event.id,
          })
      }

      const { error: processedError } = await supabase
        .from('events')
        .update({
          status: 'processed',
          processed_at: new Date().toISOString(),
        })
        .eq('id', event.id)
        .is('processed_at', null)

      if (processedError) {
        throw processedError
      }

      results.push({
        id: event.id,
        type: event.type,
        status: 'processed',
      })
    } catch (err) {
      const attempts = (event.attempts ?? 0) + 1
      const maxAttempts = event.max_attempts ?? 5
      const shouldDeadLetter = attempts >= maxAttempts

      if (shouldDeadLetter) {
        const { error: deadInsertError } = await supabase
          .from('dead_events')
          .insert({
            ...event,
            status: 'failed',
            attempts,
            next_retry_at: null,
          })

        if (deadInsertError) {
          throw deadInsertError
        }

        const { error: originalUpdateError } = await supabase
          .from('events')
          .update({
            status: 'failed',
            attempts,
            next_retry_at: null,
          })
          .eq('id', event.id)

        if (originalUpdateError) {
          throw originalUpdateError
        }

        results.push({
          id: event.id,
          type: event.type,
          status: 'dead',
        })

        continue
      }

      const { error: retryError } = await supabase
        .from('events')
        .update({
          status: 'pending',
          attempts,
          next_retry_at: getNextRetryDate(attempts),
        })
        .eq('id', event.id)

      if (retryError) {
        throw retryError
      }

      results.push({
        id: event.id,
        type: event.type,
        status: 'retry_scheduled',
      })
    }
  }

  return results
}