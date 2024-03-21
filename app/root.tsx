import '~/styles/tailwind.css'
import {
  Form,
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useLocation,
} from '@remix-run/react'
import type { LoaderFunctionArgs } from '@remix-run/node'
import { json } from '@remix-run/node'
import { sessionStorage } from './utils/session.server'

export async function loader({ request }: LoaderFunctionArgs) {
  const cookieSession = await sessionStorage.getSession(
    request.headers.get('cookie'),
  )
  const userId = cookieSession.get('userId')

  const isLoggedIn = Boolean(userId)

  // TODO: return user info
  return json({
    isLoggedIn,
  })
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="antialiased">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default function App() {
  const data = useLoaderData<typeof loader>()
  const location = useLocation()

  const isLoginPage = location.pathname.split('/')[1] === 'login'

  return (
    <div className="mx-auto max-w-7xl px-8 py-20 sm:p-20">
      <div className="flex flex-col items-start justify-between sm:flex-row">
        <div className="sm:order-0 order-1 mt-8 sm:mt-0">
          <h1 className="text-3xl sm:text-5xl">Work Journal</h1>
          <p className="mt-2 text-lg text-gray-400">
            Learnings and doings. Updated weekly.
          </p>
        </div>
        <div className="order-0 self-end sm:order-1 sm:self-auto">
          {data.isLoggedIn ? (
            <Form method="POST" action="/logout">
              <button>Logout</button>
            </Form>
          ) : !isLoginPage ? (
            <Link to="/login">Login</Link>
          ) : null}
        </div>
      </div>
      <Outlet />
    </div>
  )
}
