import type { ActionFunctionArgs, MetaFunction } from '@remix-run/node'
import {
  Form,
  json,
  redirect,
  useActionData,
  useLoaderData,
} from '@remix-run/react'
import { format } from 'date-fns'
import { useEffect, useState } from 'react'
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
    entries,
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
  const fieldErrors =
    actionData?.status === 'error' ? actionData.errors.fieldErrors : null
  const formErrors =
    actionData?.status === 'error' ? actionData.errors.formErrors : null

  const formHasErrors = Boolean(formErrors?.length)
  const dateHasErrors = Boolean(fieldErrors?.date?.length)
  const categoryHasErrors = Boolean(fieldErrors?.category?.length)
  const contentHasErrors = Boolean(fieldErrors?.content?.length)

  const isHydrated = useHydrated()

  return (
    <div className="px-8 py-20 sm:p-20">
      <h1 className="text-3xl sm:text-5xl">Work Journal</h1>
      <p className="mt-2 text-lg text-gray-400">
        Learnings and doings. Updated weekly.
      </p>

      <div className="my-8 max-w-2xl border p-2">
        <Form
          className="p-2"
          method="post"
          aria-labelledby={formHasErrors ? 'form-err' : undefined}
          noValidate={isHydrated}
        >
          <p className="italic">Create a new entry</p>

          <div>
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

            <div className="mt-2">
              <button
                type="submit"
                className="bg-blue-600 px-4 py-2 font-medium text-white"
              >
                Save
              </button>
            </div>

            {formHasErrors ? (
              <ErrorList id="form-err" errors={formErrors} />
            ) : null}
          </div>
        </Form>
      </div>
      <pre>{JSON.stringify(data.entries, null, 2)}</pre>
    </div>
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
