import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const PUBLIC_PATHS = new Set([
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/auth/confirm',
])

export async function proxy(request: NextRequest) {
  // Start with a passthrough response; setAll may reassign this.
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, headers) {
          // Write refreshed tokens to request (so upstream sees them) and to the
          // new response (so the browser receives Set-Cookie headers).
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
          Object.entries(headers).forEach(([key, value]) =>
            supabaseResponse.headers.set(key, value)
          )
        },
      },
    }
  )

  // getUser() validates the JWT with Supabase Auth (not just reads the cookie).
  // Do NOT use getSession() here — it returns unverified cookie data.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  if (!PUBLIC_PATHS.has(pathname) && !user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Always return supabaseResponse so Set-Cookie headers are not dropped.
  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|.*\\.png$).*)'],
}
