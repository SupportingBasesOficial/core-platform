export function log(
  level: 'info' | 'error',
  message: string,
  data?: unknown
) {
  const payload = {
    level,
    message,
    data: data ?? null,
    timestamp: new Date().toISOString(),
  }

  if (level === 'error') {
    console.error(JSON.stringify(payload))
    return
  }

  console.log(JSON.stringify(payload))
}