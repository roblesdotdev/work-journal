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

export const EntrySchema = z.object({
  date: z.date(),
  category: z.enum(['work', 'learning', 'interest-things'], {
    invalid_type_error: 'Please select a category',
  }),
  content: z.string().min(15).max(140),
})

export default function EntryForm() {
  const contentRef = useRef<HTMLTextAreaElement>(null)
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const isLoading = navigation.state !== 'idle'

  const [form, fields] = useForm({
    id: 'entry-form',
    constraint: getZodConstraint(EntrySchema),
    lastResult: actionData,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: EntrySchema })
    },
    defaultValue: {
      date: format(new Date(), 'yyyy-MM-dd'),
      category: 'work',
      content: '',
    },
  })

  useEffect(() => {
    if (!isLoading && contentRef.current) {
      contentRef.current.value = ''
      contentRef.current.focus()
    }
  }, [isLoading])

  return (
    <Form className="p-2" method="post" {...getFormProps(form)}>
      <p className="italic">Create a new entry</p>

      <fieldset disabled={isLoading} className="disabled:animate-pulse">
        <div className="mt-4 space-y-2">
          <input
            defaultValue={format(new Date(), 'yyyy-MM-dd')}
            className="text-gray-700"
            {...getInputProps(fields.date, { type: 'date' })}
          />
          <ErrorList id={fields.date.errorId} errors={fields.date.errors} />
        </div>

        <div className="mt-2">
          <div
            className="flex flex-wrap items-center gap-x-5 gap-y-2"
            role="radiogroup"
            aria-labelledby="category-err"
          >
            {['work', 'learning', 'interest-things'].map(value => (
              <label key={value}>
                <input
                  type="radio"
                  name={fields.category.name}
                  value={value}
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
