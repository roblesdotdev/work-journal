import type { Record } from '@prisma/client/runtime/library'
import type { MetaFunction } from '@remix-run/node'
import { Link, json, useLoaderData } from '@remix-run/react'
import { format, parseISO, startOfWeek } from 'date-fns'
import { db } from '~/utils/db.server'
import EntryForm from './__entry-form'

export { action } from './__entry-form.server'

export const meta: MetaFunction = () => {
  return [
    { title: 'Work Journal' },
    { name: 'description', content: 'Work Journal. Learnings and doings.' },
  ]
}

export async function loader() {
  const entries = await db.entry.findMany()

  return json({
    entries: entries.map(entry => ({
      ...entry,
      date: entry.date.toISOString().substring(0, 10), // remove tz
    })),
  })
}

export default function Index() {
  const data = useLoaderData<typeof loader>()

  const entriesByWeek = data.entries.reduce<
    Record<string, typeof data.entries>
  >((memo, entry) => {
    const sunday = startOfWeek(parseISO(entry.date))
    const sundayStr = format(sunday, 'yyyy-MM-dd')

    memo[sundayStr] ||= []
    memo[sundayStr].push(entry)

    return memo
  }, {})

  const weeks = Object.keys(entriesByWeek)
    .sort((a, b) => a.localeCompare(b))
    .map(dateString => ({
      dateString,
      work: entriesByWeek[dateString].filter(entry => entry.type === 'work'),
      learnings: entriesByWeek[dateString].filter(
        entry => entry.type === 'learning',
      ),
      interestingThings: entriesByWeek[dateString].filter(
        entry => entry.type === 'interest-things',
      ),
    }))

  return (
    <div>
      <div className="my-7 max-w-2xl border p-2">
        <EntryForm />
      </div>
      <div className="mt-12 space-y-8">
        {weeks.length ? (
          weeks.map(week => (
            <div key={week.dateString}>
              <p className="font-bold">
                Week of {format(parseISO(week.dateString), 'MMMM do')}
              </p>
              {week.work.length ? (
                <div>
                  <p className="mt-2 font-medium">Work</p>
                  <ul className="ml-8 list-disc">
                    {week.work.map(entry => (
                      <EntryListItem
                        key={entry.id}
                        id={entry.id}
                        text={entry.text}
                      />
                    ))}
                  </ul>
                </div>
              ) : null}
              {week.learnings.length ? (
                <div>
                  <p className="mt-2 font-medium">Learning</p>
                  <ul className="ml-8 list-disc">
                    {week.learnings.map(entry => (
                      <EntryListItem
                        key={entry.id}
                        id={entry.id}
                        text={entry.text}
                      />
                    ))}
                  </ul>
                </div>
              ) : null}
              {week.interestingThings.length ? (
                <div>
                  <p className="mt-2 font-medium">Interesting things</p>
                  <ul className="ml-8 list-disc">
                    {week.interestingThings.map(entry => (
                      <EntryListItem
                        key={entry.id}
                        id={entry.id}
                        text={entry.text}
                      />
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ))
        ) : (
          <div>
            <p className="text-lg text-gray-400">
              Not entries yet. Try creating one.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function EntryListItem({ id, text }: { id: string; text: string }) {
  return (
    <li className="flex items-center gap-2">
      {text}
      <Link to={`/entries/${id}/edit`} className="text-blue-400 underline">
        Edit
      </Link>
    </li>
  )
}
