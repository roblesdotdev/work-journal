import type { LoaderFunctionArgs } from '@remix-run/node'
import { Link, json, useLoaderData } from '@remix-run/react'
import { db } from '~/utils/db.server'
import { invariantResponse } from '~/utils/misc'
import EntryForm from './__entry-form'

export { action } from './__entry-form.server'

export async function loader({ params }: LoaderFunctionArgs) {
  const { entryId } = params
  invariantResponse(typeof entryId === 'string', 'Entry id is required')

  const entry = await db.entry.findUnique({ where: { id: entryId } })

  invariantResponse(entry, `Not entry found for id ${entryId}`, { status: 404 })

  return json({
    entry: {
      ...entry,
      date: entry.date.toISOString().substring(0, 10),
    },
  })
}

export default function EditEntryPage() {
  const data = useLoaderData<typeof loader>()

  return (
    <div className="mt-4">
      <Link to="..">Back</Link>
      <div className="max-w-2xl py-4">
        <p className="italic">Edit entry</p>
        <EntryForm entry={data.entry} intent="edit" />
      </div>
    </div>
  )
}
