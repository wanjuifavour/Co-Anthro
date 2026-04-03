const HACKATHON_TIME_ZONE = 'Africa/Nairobi'
const HACKATHON_START_MONTH = 4
const HACKATHON_START_DAY = 2
const HACKATHON_END_MONTH = 4
const HACKATHON_END_DAY = 11

function getZonedDateParts(date: Date, timeZone: string) {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(date)

    const year = Number(parts.find(part => part.type === 'year')?.value)
    const month = Number(parts.find(part => part.type === 'month')?.value)
    const day = Number(parts.find(part => part.type === 'day')?.value)

    return { year, month, day }
}

export function getHackathonYear(now = new Date()) {
    return getZonedDateParts(now, HACKATHON_TIME_ZONE).year
}

export function formatHackathonDayLabel(month: number, day: number, year = getHackathonYear()) {
    const date = new Date(Date.UTC(year, month - 1, day, 12))
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: HACKATHON_TIME_ZONE,
        month: 'short',
        day: 'numeric',
        weekday: 'short',
    })
    const parts = formatter.formatToParts(date)
    const monthPart = parts.find(part => part.type === 'month')?.value ?? ''
    const dayPart = parts.find(part => part.type === 'day')?.value ?? ''
    const weekdayPart = parts.find(part => part.type === 'weekday')?.value ?? ''

    return `${monthPart} ${dayPart} (${weekdayPart})`
}

export function getHackathonDayIndex(now = new Date()) {
    const current = getZonedDateParts(now, HACKATHON_TIME_ZONE)
    const currentUtc = Date.UTC(current.year, current.month - 1, current.day)
    const startUtc = Date.UTC(current.year, HACKATHON_START_MONTH - 1, HACKATHON_START_DAY)
    const diff = Math.floor((currentUtc - startUtc) / 86400000)

    return Math.max(0, Math.min(diff, 9))
}

export function getHackathonDeadline(now = new Date()) {
    const year = getHackathonYear(now)
    return new Date(Date.UTC(year, HACKATHON_END_MONTH - 1, HACKATHON_END_DAY, 8, 0, 0))
}

