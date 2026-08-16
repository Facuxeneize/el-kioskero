const BUSINESS_TIME_ZONE = 'America/Argentina/Buenos_Aires'
const BUSINESS_OFFSET = '-03:00'

export function currentBusinessDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

export function businessDayRange(date: string) {
  const from = new Date(`${date}T00:00:00${BUSINESS_OFFSET}`)
  return { from, to: new Date(from.getTime() + 86_400_000) }
}
