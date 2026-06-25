"use client"

import { useState, useTransition } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { getMonthVisits } from "@/lib/actions/schedule"

type Visit = {
  id: string
  visitedAt: Date | string
  status: string
  customer: { id: string; firstName: string; lastName: string }
  route: { id: string; name: string } | null
}

type Route = {
  id: string
  name: string
  dayOfWeek: number | null
  stops: { customer: { firstName: string; lastName: string } }[]
}

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
]
const DAY_HEADERS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]

const STATUS_STYLE: Record<string, string> = {
  completed: "bg-green-100 text-green-700",
  skipped:   "bg-gray-100 text-gray-500",
  pending:   "bg-yellow-100 text-yellow-700",
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth()    === b.getMonth()    &&
         a.getDate()     === b.getDate()
}

export default function ScheduleCalendar({
  initialVisits,
  routes,
  initialYear,
  initialMonth,
}: {
  initialVisits: Visit[]
  routes: Route[]
  initialYear: number
  initialMonth: number
}) {
  const [year,    setYear]    = useState(initialYear)
  const [month,   setMonth]   = useState(initialMonth)
  const [visits,  setVisits]  = useState(initialVisits)
  const [selected, setSelected] = useState<number | null>(null)
  const [pending, startTransition] = useTransition()

  function navigate(dir: -1 | 1) {
    setSelected(null)
    const newMonth = month + dir
    const newYear  = newMonth < 0 ? year - 1 : newMonth > 11 ? year + 1 : year
    const adjMonth = ((newMonth % 12) + 12) % 12
    setYear(newYear)
    setMonth(adjMonth)
    startTransition(async () => {
      const data = await getMonthVisits(newYear, adjMonth)
      setVisits(data as Visit[])
    })
  }

  const today = new Date()
  const firstOfMonth = new Date(year, month, 1)
  const daysInMonth  = new Date(year, month + 1, 0).getDate()
  const startPad     = firstOfMonth.getDay() // 0 = Sun

  // Build grid: nulls for padding, then day numbers
  const cells: (number | null)[] = [
    ...Array(startPad).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  // Index visits by day-of-month
  const visitsByDay = new Map<number, Visit[]>()
  for (const v of visits) {
    const d = new Date(v.visitedAt).getDate()
    if (!visitsByDay.has(d)) visitsByDay.set(d, [])
    visitsByDay.get(d)!.push(v)
  }

  // Planned visits for future days: routes with a matching dayOfWeek
  const plannedByDay = new Map<number, Route[]>()
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth()
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d)
    if (date <= today && !(isCurrentMonth && d === today.getDate())) continue
    const dayOfWeek = date.getDay()
    const dayRoutes = routes.filter((r) => r.dayOfWeek === dayOfWeek)
    if (dayRoutes.length > 0) plannedByDay.set(d, dayRoutes)
  }

  const selectedVisits  = selected ? (visitsByDay.get(selected)  ?? []) : []
  const selectedPlanned = selected ? (plannedByDay.get(selected) ?? []) : []

  const isThisMonth = year === today.getFullYear() && month === today.getMonth()

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">
          {MONTH_NAMES[month]} {year}
        </h2>
        <div className="flex items-center gap-1">
          {!isThisMonth && (
            <button
              onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth()); setSelected(null); startTransition(async () => { const data = await getMonthVisits(today.getFullYear(), today.getMonth()); setVisits(data as Visit[]) }) }}
              className="text-xs text-sky-600 hover:text-sky-700 px-2 py-1 rounded hover:bg-sky-50 transition-colors mr-1"
            >
              Today
            </button>
          )}
          <button
            onClick={() => navigate(-1)}
            disabled={pending}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-40 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate(1)}
            disabled={pending}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-40 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {pending && <p className="text-xs text-sky-500 text-center py-1">Loading…</p>}

      {/* Day headers */}
      <div className="grid grid-cols-7 text-center mb-1">
        {DAY_HEADERS.map((d) => (
          <div key={d} className="text-xs font-medium text-gray-400 py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-gray-100 border border-gray-100 rounded-xl overflow-hidden">
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={`pad-${i}`} className="bg-gray-50 min-h-[72px]" />
          }

          const date       = new Date(year, month, day)
          const isToday    = isSameDay(date, today)
          const isPast     = date < today && !isToday
          const dayVisits  = visitsByDay.get(day) ?? []
          const dayPlanned = plannedByDay.get(day) ?? []
          const isSelected = selected === day

          return (
            <button
              key={day}
              onClick={() => setSelected(isSelected ? null : day)}
              className={`
                min-h-[72px] p-1.5 text-left flex flex-col gap-1 transition-colors
                ${isSelected ? "bg-sky-50 ring-1 ring-inset ring-sky-300" : isPast ? "bg-white hover:bg-gray-50" : "bg-white hover:bg-sky-50/40"}
              `}
            >
              <span className={`
                text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full
                ${isToday ? "bg-sky-600 text-white" : isSelected ? "text-sky-700" : "text-gray-700"}
              `}>
                {day}
              </span>
              <div className="flex flex-col gap-0.5 w-full overflow-hidden">
                {dayVisits.slice(0, 3).map((v) => (
                  <span
                    key={v.id}
                    className={`text-[10px] leading-tight px-1 py-0.5 rounded truncate font-medium ${STATUS_STYLE[v.status] ?? "bg-gray-100 text-gray-500"}`}
                  >
                    {v.customer.firstName} {v.customer.lastName[0]}.
                  </span>
                ))}
                {dayPlanned.slice(0, dayVisits.length >= 3 ? 0 : 3 - dayVisits.length).map((r) => (
                  <span
                    key={r.id}
                    className="text-[10px] leading-tight px-1 py-0.5 rounded truncate text-sky-500 bg-sky-50 border border-sky-100"
                  >
                    {r.name}
                  </span>
                ))}
                {(dayVisits.length + dayPlanned.length) > 3 && (
                  <span className="text-[10px] text-gray-400 px-1">
                    +{dayVisits.length + dayPlanned.length - 3} more
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Day detail panel */}
      {selected !== null && (
        <div className="border border-gray-200 rounded-xl p-4 bg-white space-y-3">
          <p className="text-sm font-semibold text-gray-900">
            {MONTH_NAMES[month]} {selected}, {year}
          </p>

          {selectedVisits.length === 0 && selectedPlanned.length === 0 && (
            <p className="text-sm text-gray-400">No visits on this day.</p>
          )}

          {selectedVisits.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Logged Visits</p>
              {selectedVisits.map((v) => (
                <div key={v.id} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      href={`/customers/${v.customer.id}`}
                      className="text-sm font-medium text-gray-900 hover:text-sky-600 truncate block"
                    >
                      {v.customer.firstName} {v.customer.lastName}
                    </Link>
                    {v.route && (
                      <p className="text-xs text-gray-400">{v.route.name}</p>
                    )}
                  </div>
                  <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLE[v.status] ?? "bg-gray-100 text-gray-500"}`}>
                    {v.status.charAt(0).toUpperCase() + v.status.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {selectedPlanned.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Scheduled Routes</p>
              {selectedPlanned.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-2">
                  <Link href={`/routes/${r.id}`} className="text-sm font-medium text-sky-700 hover:underline">
                    {r.name}
                  </Link>
                  <span className="text-xs text-gray-400">{r.stops.length} stop{r.stops.length !== 1 ? "s" : ""}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-400">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-green-100 inline-block" /> Completed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-gray-100 inline-block" /> Skipped
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-sky-50 border border-sky-100 inline-block" /> Scheduled
        </span>
      </div>
    </div>
  )
}
