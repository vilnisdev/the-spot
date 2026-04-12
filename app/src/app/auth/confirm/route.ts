import { NextRequest, NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (!token_hash && !code) {
    return NextResponse.redirect(new URL('/login?error=invalid_link', origin))
  }

  // Build the success redirect first so we can attach session cookies directly to it.
  // cookies() from next/headers writes to Next.js's internal response pipeline, which
  // is NOT the same as a manually created NextResponse — so cookies set via
  // cookieStore.set() are lost when we return NextResponse.redirect(). Instead, we
  // pass setAll a closure that writes directly onto this response object.
  const successResponse = NextResponse.redirect(new URL(next, origin))

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value, options }) =>
            successResponse.cookies.set(name, value, options)
          )
          Object.entries(headers).forEach(([key, value]) =>
            successResponse.headers.set(key, value)
          )
        },
      },
    }
  )

  // @supabase/ssr uses PKCE by default → email link may carry a `code` param.
  // Older / non-PKCE projects send `token_hash` + `type` instead. Handle both.
  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : await supabase.auth.verifyOtp({ token_hash: token_hash!, type: type! })

  if (error) {
    return NextResponse.redirect(new URL('/login?error=invalid_link', origin))
  }

  return successResponse
}
