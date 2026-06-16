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
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (n) => cookieStore.get(n)?.value,
        set: () => {},
        remove: () => {},
      },
    }
  )

  const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !session) {
    console.error('[callback] exchangeCodeForSession error:', error)
    return NextResponse.redirect(`${origin}/login`)
  }

  const userId = session.user.id
  const userEmail = session.user.email || ''
  console.log('[callback] session established for:', userEmail, 'uid:', userId)

  // Password reset or other ?next= flows — redirect there directly
  if (next) {
    console.log('[callback] next param present, redirecting to:', next)
    return NextResponse.redirect(`${origin}${next}`)
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
    return NextResponse.redirect(`${origin}/dashboard`)
  }

  const completeProfileUrl = `${origin}/complete-profile?uid=${userId}&email=${encodeURIComponent(userEmail)}`
  console.log('[callback] redirecting to:', completeProfileUrl)
  return NextResponse.redirect(completeProfileUrl)
}
