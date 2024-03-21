import type { ActionFunctionArgs } from '@remix-run/node'
import { redirect } from '@remix-run/node'
import { sessionStorage } from '~/utils/session.server'

export async function loader() {
  return redirect('/')
}

export async function action({ request }: ActionFunctionArgs) {
  const session = await sessionStorage.getSession(request.headers.get('cookie'))

  return redirect('/', {
    headers: {
      'Set-Cookie': await sessionStorage.destroySession(session),
    },
  })
}
