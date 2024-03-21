import { createCookieSessionStorage } from '@remix-run/node'

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: 'wj_session',
    sameSite: 'lax',
    path: '/',
    httpOnly: true,
    // TODO: use environment
    secrets: ['super secret'],
    secure: process.env.NODE_ENV === 'production',
  },
})
