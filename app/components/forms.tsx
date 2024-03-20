type ListOfErrors = Array<string | null | undefined> | null | undefined

export function ErrorList({
  id,
  errors,
}: {
  id?: string
  errors?: ListOfErrors
}) {
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
