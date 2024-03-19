import { parseWithZod } from '@conform-to/zod'
import type { ActionFunctionArgs } from '@remix-run/node'
import { json, redirect } from '@remix-run/node'
import { db } from '~/utils/db.server'
import { EntrySchema } from './__entry-form'

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData()
  const submission = parseWithZod(formData, { schema: EntrySchema })

  if (submission.status !== 'success') {
    return json({ status: 'error', submission } as const, {
      status: 400,
    })
  }
  const { content, date, category } = submission.value

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
