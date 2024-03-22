import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from '@remix-run/node'
import {
  Form,
  json,
  redirect,
  useActionData,
  useSearchParams,
} from '@remix-run/react'
import { safeRedirect } from 'remix-utils/safe-redirect'
import { z } from 'zod'
import { ErrorList } from '~/components/forms'
import { login, requireAnonymous } from '~/utils/auth.server'
import { sessionStorage } from '~/utils/session.server'

export const meta: MetaFunction = () => [{ title: 'Login' }]

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAnonymous(request)
  return json({})
}

const LoginFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(32),
  redirectTo: z.string().optional(),
})

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData()

  const submission = await parseWithZod(formData, {
    schema: intent =>
      LoginFormSchema.transform(async (data, ctx) => {
        if (intent !== null) return { ...data, user: null }

        const user = await login({ email: data.email, password: data.password })
        if (!user) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Invalid username or password',
          })
          return z.NEVER
        }
        return { ...data, user }
      }),
    async: true,
  })

  if (submission.status !== 'success' || !submission.value.user) {
    return json(
      { result: submission.reply({ hideFields: ['password'] }) },
      { status: submission.status === 'error' ? 400 : 200 },
    )
  }

  const { user, redirectTo } = submission.value
  const cookieSession = await sessionStorage.getSession(
    request.headers.get('cookie'),
  )
  cookieSession.set('userId', user.id)

  return redirect(safeRedirect(redirectTo), {
    headers: {
      'set-cookie': await sessionStorage.commitSession(cookieSession),
    },
  })
}

export default function LoginPage() {
  const [searchParams] = useSearchParams()
  const redirectTo = searchParams.get('redirectTo')
  const actionData = useActionData<typeof action>()
  const [form, fields] = useForm({
    id: 'login-form',
    lastResult: actionData?.result,
    defaultValue: { redirectTo },
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

          <input {...getInputProps(fields.redirectTo, { type: 'hidden' })} />

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
