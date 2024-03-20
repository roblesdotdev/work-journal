import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import type { ActionFunctionArgs, MetaFunction } from '@remix-run/node'
import { Form, json } from '@remix-run/react'
import { z } from 'zod'
import { ErrorList } from '~/components/forms'

export const meta: MetaFunction = () => [{ title: 'Login' }]

export async function loader() {
  // TODO: redirect if is logged in
  return null
}

const LoginFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(32),
})

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData()

  const submission = parseWithZod(formData, { schema: LoginFormSchema })

  if (submission.status !== 'success') {
    return json(
      { result: submission.reply({ hideFields: ['password'] }) },
      { status: submission.status === 'error' ? 400 : 200 },
    )
  }

  // TODO: authenticate with credentials
  // TODO: handle session

  return null
}

export default function LoginPage() {
  const [form, fields] = useForm({
    id: 'login-form',
    constraint: getZodConstraint(LoginFormSchema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: LoginFormSchema })
    },
    shouldValidate: 'onBlur',
  })

  return (
    <div className="flex flex-col pt-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold">Welcome Back!</h1>
        <p className="text-lg text-neutral-400">
          Please enter your credentials.
        </p>
      </div>

      <div className="max-w-xl">
        <Form method="post" {...getFormProps(form)}>
          <fieldset className="flex flex-col gap-2 py-4">
            <div className="flex flex-col gap-1">
              <label htmlFor={fields.email.id}>Email</label>
              <input
                className="text-neutral-700"
                {...getInputProps(fields.email, { type: 'email' })}
              />
              <ErrorList
                id={fields.email.errorId}
                errors={fields.email.errors}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor={fields.password.id}>Password</label>
              <input
                className="text-neutral-700"
                {...getInputProps(fields.password, { type: 'password' })}
              />
              <ErrorList
                id={fields.password.errorId}
                errors={fields.password.errors}
              />
            </div>
          </fieldset>

          <ErrorList id={form.errorId} errors={form.errors} />

          <div className="flex items-center justify-end">
            <button type="submit" className="bg-blue-600 px-4 py-2 font-medium">
              Login
            </button>
          </div>
        </Form>
      </div>
    </div>
  )
}
