'use client'

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  return (
    <html lang="en">
      <body>
        <h2>Something went wrong</h2>
        {error.digest ? <p>Ref: {error.digest}</p> : null}
        <button type="button" onClick={() => unstable_retry()}>
          Try again
        </button>
      </body>
    </html>
  )
}
