import type { Record } from '@prisma/client/runtime/library'
import type { ActionFunctionArgs, MetaFunction } from '@remix-run/node'
import {
  Form,
  Link,
  json,
  redirect,
  useActionData,
  useLoaderData,
  useNavigation,
} from '@remix-run/react'
import { format, parseISO, startOfWeek } from 'date-fns'
import { useEffect, useRef, useState } from 'react'
import { z } from 'zod'
import { db } from '~/utils/db.server'

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

const EntrySchema = z.object({
  date: z.date(),
  category: z.enum(['work', 'learning', 'interest-things'], {
    invalid_type_error: 'Please select a category',
  }),
  content: z.string().min(15).max(140),
})

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData()
  const result = EntrySchema.safeParse({
    date: new Date(formData.get('date') as string),
    category: formData.get('category'),
    content: formData.get('content'),
  })

  if (!result.success) {
    return json({ status: 'error', errors: result.error.flatten() } as const, {
      status: 400,
    })
  }
  const { content, date, category } = result.data

  await db.entry.create({
    select: {
      id: true,
    },
    data: {
      text: content,
      date: date,
      type: category,
    },
  })

  return redirect('/')
}

export default function Index() {
  const data = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const contentRef = useRef<HTMLTextAreaElement>(null)
  const fieldErrors =
    actionData?.status === 'error' ? actionData.errors.fieldErrors : null
  const formErrors =
    actionData?.status === 'error' ? actionData.errors.formErrors : null

  const formHasErrors = Boolean(formErrors?.length)
  const dateHasErrors = Boolean(fieldErrors?.date?.length)
  const categoryHasErrors = Boolean(fieldErrors?.category?.length)
  const contentHasErrors = Boolean(fieldErrors?.content?.length)

  const isHydrated = useHydrated()
  const isLoading = navigation.state !== 'idle'

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

  useEffect(() => {
    if (!isLoading && contentRef.current) {
      contentRef.current.value = ''
      contentRef.current.focus()
    }
  }, [isLoading])

  return (
    <div>
      <div className="my-8 max-w-2xl border p-2">
        <Form
          className="p-2"
          method="post"
          aria-labelledby={formHasErrors ? 'form-err' : undefined}
          noValidate={isHydrated}
        >
          <p className="italic">Create a new entry</p>

          <fieldset disabled={isLoading} className="disabled:animate-pulse">
            <div className="mt-4 space-y-2">
              <input
                defaultValue={format(new Date(), 'yyyy-MM-dd')}
                className="text-gray-700"
                type="date"
                name="date"
                aria-labelledby={dateHasErrors ? 'date-err' : undefined}
                required
              />
              {dateHasErrors ? (
                <ErrorList id="date-err" errors={fieldErrors?.date} />
              ) : null}
            </div>

            <div className="mt-2">
              <div
                className="flex flex-wrap items-center gap-x-5 gap-y-2"
                role="radiogroup"
                aria-labelledby="category-err"
              >
                <label>
                  <input
                    className="mr-1"
                    type="radio"
                    name="category"
                    value="work"
                    required
                    defaultChecked
                  />
                  Work
                </label>
                <label>
                  <input
                    className="mr-1"
                    type="radio"
                    name="category"
                    value="learning"
                  />
                  Learning
                </label>
                <label>
                  <input
                    className="mr-1"
                    type="radio"
                    name="category"
                    value="interest-things"
                  />
                  Interesting things
                </label>
                {categoryHasErrors ? (
                  <ErrorList id="category-err" errors={fieldErrors?.category} />
                ) : null}
              </div>
            </div>

            <div className="mt-2">
              <textarea
                ref={contentRef}
                name="content"
                className="w-full text-gray-700"
                placeholder="Write your entry..."
                aria-labelledby={contentHasErrors ? 'content-err' : undefined}
                required
              />
              {contentHasErrors ? (
                <ErrorList id="content-err" errors={fieldErrors?.content} />
              ) : null}
            </div>

            <div className="mt-2 flex items-center justify-end">
              <button
                type="submit"
                className="bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-50"
                disabled={isLoading}
              >
                Save
              </button>
            </div>

            {formHasErrors ? (
              <ErrorList id="form-err" errors={formErrors} />
            ) : null}
          </fieldset>
        </Form>
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

type ListOfErrors = Array<string | null | undefined> | null | undefined

function ErrorList({ id, errors }: { id?: string; errors?: ListOfErrors }) {
  return errors?.length ? (
    <ul id={id}>
      {errors.map(error => (
        <li key={error} className="text-xs text-red-400">
          {error}
        </li>
      ))}
    </ul>
  ) : null
}

function useHydrated() {
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => setHydrated(true), [])
  return hydrated
}
