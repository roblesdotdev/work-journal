import type { MetaFunction } from '@remix-run/node'

export const meta: MetaFunction = () => {
  return [
    { title: 'Work Journal' },
    { name: 'description', content: 'Work Journal. Learnings and doings.' },
  ]
}

export default function Index() {
  return (
    <div className="px-8 py-20 sm:p-20">
      <h1 className="text-3xl sm:text-5xl">Work Journal</h1>
      <p className="mt-2 text-lg text-gray-400">
        Learnings and doings. Updated weekly.
      </p>
    </div>
  )
}
