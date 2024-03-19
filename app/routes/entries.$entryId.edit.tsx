import type { LoaderFunctionArgs } from '@remix-run/node'
import { Link, json, useLoaderData } from '@remix-run/react'
import { db } from '~/utils/db.server'
import { invariantResponse } from '~/utils/misc'

export async function loader({ params }: LoaderFunctionArgs) {
  const { entryId } = params
  invariantResponse(typeof entryId === 'string', 'Entry id is required')

  const entry = await db.entry.findUnique({ where: { id: entryId } })

  invariantResponse(entry, `Not entry found for id ${entryId}`, { status: 404 })

  return json({
    entry,
  })
}

export default function EditEntryPage() {
  const data = useLoaderData<typeof loader>()

  return (
    <div className="mt-4">
      <Link to="..">Back</Link>
      <div className="py-4">
        <h1>Edit</h1>
        <pre>{JSON.stringify(data.entry, null, 2)}</pre>
      </div>
    </div>
  )
}
