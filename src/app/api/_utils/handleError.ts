export function handleError(err: any) {
  return Response.json(
    {
      error: err?.code || err?.message || 'INTERNAL_ERROR',
      message: err?.message || 'Unexpected error',
    },
    {
      status: err?.status || 500,
    }
  )
}