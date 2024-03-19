import {
  getFormProps,
  getInputProps,
  getTextareaProps,
  useForm,
} from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { Form, useActionData, useNavigation } from '@remix-run/react'
import { format } from 'date-fns'
import { useEffect, useRef } from 'react'
import { type action } from './__entry-form.server'
import { z } from 'zod'
import type { Entry } from '@prisma/client'

export const EntrySchema = z.object({
  date: z.date(),
  category: z.enum(['work', 'learning', 'interest-things'], {
    invalid_type_error: 'Please select a category',
  }),
  content: z.string().min(15).max(140),
  intent: z.enum(['create', 'edit']),
})

type EntryFormProps = {
  entry?: Omit<Entry, 'date'> & { date: string }
  intent?: 'create' | 'edit'
}

export default function EntryForm({
  entry,
  intent = 'create',
}: EntryFormProps) {
  const contentRef = useRef<HTMLTextAreaElement>(null)
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const isLoading = navigation.state !== 'idle'
  const date = entry?.date ?? new Date()

  const [form, fields] = useForm({
    id: 'entry-form',
    constraint: getZodConstraint(EntrySchema),
    lastResult: actionData,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: EntrySchema })
    },
    defaultValue: {
      date: format(date, 'yyyy-MM-dd'),
      category: entry?.type ?? 'work',
      content: entry?.text ?? '',
      intent,
    },
  })

  useEffect(() => {
    if (intent !== 'edit' && !isLoading && contentRef.current) {
      contentRef.current.value = ''
      contentRef.current.focus()
    }
  }, [isLoading, intent])

  return (
    <Form method="post" {...getFormProps(form)}>
      <fieldset disabled={isLoading} className="disabled:animate-pulse">
        <input {...getInputProps(fields.intent, { type: 'hidden' })} />
        <div className="mt-4 space-y-2">
          <input
            className="text-gray-700"
            {...getInputProps(fields.date, { type: 'date' })}
          />
          <ErrorList id={fields.date.errorId} errors={fields.date.errors} />
        </div>

        <div className="mt-2">
          <div
            className="flex flex-wrap items-center gap-x-5 gap-y-2"
            role="radiogroup"
            aria-labelledby={fields.category.errorId}
          >
            {['work', 'learning', 'interest-things'].map(value => (
              <label key={value}>
                <input
                  type="radio"
                  name={fields.category.name}
                  value={value}
                  className="mr-1"
                  defaultChecked={fields.category.initialValue === value}
                />
                {value}
              </label>
            ))}
            <ErrorList
              id={fields.category.errorId}
              errors={fields.category.errors}
            />
          </div>
        </div>

        <div className="mt-2">
          <textarea
            className="w-full text-gray-700"
            placeholder="Write your entry..."
            ref={contentRef}
            {...getTextareaProps(fields.content)}
          />
          <ErrorList
            id={fields.content.errorId}
            errors={fields.content.errors}
          />
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

        <ErrorList id={form.errorId} errors={form.errors} />
      </fieldset>
    </Form>
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
