const currency = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 2,
})

const dateTime = new Intl.DateTimeFormat('es-AR', {
  dateStyle: 'short',
  timeStyle: 'short',
})

export function formatMoney(value: string | number) {
  return currency.format(Number(value))
}

export function formatDateTime(value: string | null) {
  return value ? dateTime.format(new Date(value)) : '—'
}
