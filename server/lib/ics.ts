export interface CalendarEvent {
  summary: string
  description: string
  location: string
  begin: string | Date
  end: string | Date
}

function formatDate (date: Date): string {
  const year = `${date.getFullYear()}`.padStart(4, '0')
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  const hours = `${date.getHours()}`.padStart(2, '0')
  const minutes = `${date.getMinutes()}`.padStart(2, '0')
  const seconds = `${date.getSeconds()}`.padStart(2, '0')
  return `${year}${month}${day}T${hours}${minutes}${seconds}`
}

export function ics (uidDomain = 'default', prodId = 'Calendar') {
  const SEPARATOR = '\r\n'
  const events: string[] = []
  const calendarStart = [
    'BEGIN:VCALENDAR',
    `PRODID:${prodId}`,
    'VERSION:2.0'
  ].join(SEPARATOR)
  const calendarEnd = `${SEPARATOR}END:VCALENDAR`

  function addEvent (
    subject: string,
    description: string,
    location: string,
    begin: string | Date,
    stop: string | Date
  ) {
    const start = formatDate(new Date(begin))
    const end = formatDate(new Date(stop))
    const now = formatDate(new Date())

    const eventLines = [
      'BEGIN:VEVENT',
      `UID:${events.length}@${uidDomain}`,
      'CLASS:PUBLIC',
      `DESCRIPTION:${description}`,
      `DTSTAMP;VALUE=DATE-TIME:${now}`,
      `DTSTART;VALUE=DATE-TIME:${start}`,
      `DTEND;VALUE=DATE-TIME:${end}`,
      `LOCATION:${location}`,
      `SUMMARY;LANGUAGE=en-us:${subject}`,
      'TRANSP:TRANSPARENT',
      'END:VEVENT'
    ].join(SEPARATOR)

    events.push(eventLines)
    return eventLines
  }

  function build () {
    if (events.length < 1) return ''
    return calendarStart + SEPARATOR + events.join(SEPARATOR) + calendarEnd
  }

  return {
    addEvent,
    build,
    events: () => events,
    calendar: build
  }
}
