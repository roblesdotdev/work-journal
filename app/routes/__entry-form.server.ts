import { parseWithZod } from '@conform-to/zod'
import type { ActionFunctionArgs } from '@remix-run/node'
import { json, redirect } from '@remix-run/node'
import { db } from '~/utils/db.server'
import { EntryFormIntents, EntrySchema } from './__entry-form'

export async function action({ params, request }: ActionFunctionArgs) {
  const { entryId } = params
  const formData = await request.formData()
  const submission = parseWithZod(formData, { schema: EntrySchema })

  if (submission.status !== 'success') {
    return json({ status: 'error', submission } as const, {
      status: 400,
    })
  }
  const { content, date, category, intent } = submission.value

  switch (intent) {
    case EntryFormIntents.Create:
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

    case EntryFormIntents.Update: {
      const updatedEntry = await db.entry.update({
        where: { id: entryId },
        select: { id: true },
        data: {
          date,
          text: content,
          type: category,
        },
      })
      return redirect(`/entries/${updatedEntry.id}/edit`)
    }

    case EntryFormIntents.Delete:
      await db.entry.delete({ where: { id: entryId } })
      return redirect('/')
  }
}
