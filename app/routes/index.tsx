import type { ActionFunctionArgs, MetaFunction } from '@remix-run/node'
import { Form, json, redirect, useLoaderData } from '@remix-run/react'
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

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData()
  const json = Object.fromEntries(formData)
  console.log(json)
  return redirect('/')
}

export default function Index() {
  const data = useLoaderData<typeof loader>()
  return (
    <div className="px-8 py-20 sm:p-20">
      <h1 className="text-3xl sm:text-5xl">Work Journal</h1>
      <p className="mt-2 text-lg text-gray-400">
        Learnings and doings. Updated weekly.
      </p>

      <div className="my-8 max-w-2xl border p-2">
        <Form className="p-2" method="post">
          <p className="italic">Create a new entry</p>

          <div>
            <div className="mt-4">
              <input className="text-gray-700" type="date" name="date" />
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2">
              <label>
                <input
                  className="mr-1"
                  type="radio"
                  name="category"
                  value="work"
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
            </div>

            <div className="mt-2">
              <textarea
                name="content"
                className="w-full text-gray-700"
                placeholder="Write your entry..."
              />
            </div>

            <div className="mt-2">
              <button
                type="submit"
                className="bg-blue-600 px-4 py-2 font-medium text-white"
              >
                Save
              </button>
            </div>
          </div>
        </Form>
      </div>
      <pre>{JSON.stringify(data.entries, null, 2)}</pre>
    </div>
  )
}
