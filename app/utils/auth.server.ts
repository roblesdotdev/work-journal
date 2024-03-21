import type { Password, User } from '@prisma/client'
import { db } from './db.server'
import bcrypt from 'bcryptjs'
import { sessionStorage } from './session.server'
import { redirect } from '@remix-run/node'
import { combineHeaders } from './misc'

export async function login({
  email,
  password,
}: {
  email: User['email']
  password: string
}) {
  const user = await verifyUserPassword({ email }, password)
  if (!user) return null
  return user
}

export async function verifyUserPassword(
  where: Pick<User, 'email'> | Pick<User, 'id'>,
  password: Password['hash'],
) {
  const userWithPassword = await db.user.findUnique({
    where,
    select: { id: true, password: { select: { hash: true } } },
  })

  if (!userWithPassword || !userWithPassword.password) {
    return null
  }

  const isValid = await bcrypt.compare(password, userWithPassword.password.hash)

  if (!isValid) {
    return null
  }

  return { id: userWithPassword.id }
}

export async function getUserId(request: Request) {
  const authSession = await sessionStorage.getSession(
    request.headers.get('cookie'),
  )
  const userId = authSession.get('userId')
  if (!userId) return null
  const user = await db.user.findUnique({
    select: { id: true },
    where: { id: userId },
  })
  if (!user) {
    throw redirect('/', {
      headers: {
        'set-cookie': await sessionStorage.destroySession(authSession),
      },
    })
  }
  return user.id
}

export async function requireUserId(
  request: Request,
  { redirectTo }: { redirectTo?: string | null } = {},
) {
  const userId = await getUserId(request)
  if (!userId) {
    const requestUrl = new URL(request.url)
    redirectTo =
      redirectTo === null
        ? null
        : redirectTo ?? `${requestUrl.pathname}${requestUrl.search}`
    const loginParams = redirectTo ? new URLSearchParams({ redirectTo }) : null
    const loginRedirect = ['/login', loginParams?.toString()]
      .filter(Boolean)
      .join('?')
    throw redirect(loginRedirect)
  }
  return userId
}

export async function requireAnonymous(request: Request) {
  const userId = await getUserId(request)
  if (userId) {
    throw redirect('/')
  }
}

export async function logout(
  {
    request,
    redirectTo = '/',
  }: {
    request: Request
    redirectTo?: string
  },
  responseInit?: ResponseInit,
) {
  const authSession = await sessionStorage.getSession(
    request.headers.get('cookie'),
  )
  throw redirect(redirectTo, {
    ...responseInit,
    headers: combineHeaders(
      { 'set-cookie': await sessionStorage.destroySession(authSession) },
      responseInit?.headers,
    ),
  })
}
