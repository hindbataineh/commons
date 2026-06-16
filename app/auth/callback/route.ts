import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next')
  const origin = requestUrl.origin

  console.log('[callback] code:', code ? 'present' : 'missing', 'next:', next)

  if (!code) {
    console.error('[callback] no code in URL')
    return NextResponse.redirect(`${origin}/login`)
  }

  const cookieStore = cookies()

  // Collect cookies written during exchangeCodeForSession so we can
  // attach them to the redirect response — this is what gives the browser
  // a valid Supabase session after the redirect.
  const pendingCookies: Array<{ name: string; value: string; options: Record<string, unknown> }> = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: (name, value, options) => {
          pendingCookies.push({ name, value, options: options as Record<string, unknown> })
        },
        remove: (name, options) => {
          pendingCookies.push({ name, value: '', options: options as Record<string, unknown> })
        },
      },
    }
  )

  const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)
  console.log('[callback] pendingCookies count:', pendingCookies.length)

  if (error || !session) {
    console.error('[callback] exchangeCodeForSession error:', error)
    return NextResponse.redirect(`${origin}/login`)
  }

  const userId = session.user.id
  const userEmail = session.user.email || ''
  console.log('[callback] session established for:', userEmail, 'uid:', userId)

  // Password reset or other ?next= flows — redirect there directly
  if (next) {
    console.log('[callback] next param, redirecting to:', next)
    const response = NextResponse.redirect(`${origin}${next}`)
    pendingCookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
    return response
  }

  const serviceSupabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get: () => undefined,
        set: () => {},
        remove: () => {},
      },
    }
  )

  const { data: host, error: hostError } = await serviceSupabase
    .from('hosts')
    .select('onboarding_complete')
    .eq('id', userId)
    .single()

  console.log('[callback] host:', host, 'hostError:', hostError)

  if (host?.onboarding_complete === true) {
    console.log('[callback] onboarding complete, redirecting to dashboard')
    const response = NextResponse.redirect(`${origin}/dashboard`)
    pendingCookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
    return response
  }

  const completeProfileUrl = `${origin}/complete-profile?uid=${userId}&email=${encodeURIComponent(userEmail)}`
  console.log('[callback] redirecting to:', completeProfileUrl)

  const response = NextResponse.redirect(completeProfileUrl)
  pendingCookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
  response.cookies.set('pending_uid', userId, { httpOnly: false, maxAge: 3600, path: '/' })
  response.cookies.set('pending_email', userEmail, { httpOnly: false, maxAge: 3600, path: '/' })
  return response
}
