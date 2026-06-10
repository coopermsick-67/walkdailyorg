import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const token = requestUrl.searchParams.get('token')
  const type = requestUrl.searchParams.get('type')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  // Handle OAuth errors (e.g. user denied access)
  if (error) {
    const redirectUrl = new URL('/auth/login', requestUrl.origin)
    redirectUrl.searchParams.set('error', errorDescription || error)
    return NextResponse.redirect(redirectUrl)
  }

  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch {
            // Server Component streaming -- middleware handles refresh
          }
        },
        remove(name: string, options: Record<string, unknown>) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch {
            // Server Component streaming -- middleware handles refresh
          }
        },
      },
    }
  )

  // 1. OAuth code exchange (Google, etc.)
  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    if (exchangeError) {
      const redirectUrl = new URL('/auth/login', requestUrl.origin)
      redirectUrl.searchParams.set('error', 'Failed to sign in. Please try again.')
      return NextResponse.redirect(redirectUrl)
    }
    // Check if user has completed onboarding
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('has_completed_onboarding')
          .eq('id', user.id)
          .single()
        if (profile && !profile.has_completed_onboarding) {
          return NextResponse.redirect(requestUrl.origin + '/onboarding')
        }
      } catch {
        // Allow through
      }
    }
    return NextResponse.redirect(requestUrl.origin + '/home')
  }

  // 2. Password reset / email verification token (magic link flow)
  if (token && type) {
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: type as 'recovery' | 'signup' | 'email_change' | 'invite' | 'magiclink',
    })

    if (verifyError) {
      const redirectUrl = new URL('/auth/login', requestUrl.origin)
      redirectUrl.searchParams.set('error', 'Invalid or expired link. Please request a new one.')
      return NextResponse.redirect(redirectUrl)
    }

    // For password recovery, redirect to set new password
    if (type === 'recovery') {
      const redirectUrl = new URL('/auth/forgot-password', requestUrl.origin)
      redirectUrl.searchParams.set('reset', 'true')
      return NextResponse.redirect(redirectUrl)
    }

    // For email verification / signup confirmation, check onboarding
    if (type === 'signup' || type === 'email_change') {
      const { data: { user: verifiedUser } } = await supabase.auth.getUser()
      if (verifiedUser) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('has_completed_onboarding')
            .eq('id', verifiedUser.id)
            .single()
          if (profile && !profile.has_completed_onboarding) {
            return NextResponse.redirect(requestUrl.origin + '/onboarding')
          }
        } catch {
          // Allow through
        }
      }
    }
    return NextResponse.redirect(requestUrl.origin + '/home')
  }

  // 3. Recovery-type token (Supabase password reset link format)
  if (type === 'recovery' && !token) {
    const redirectUrl = new URL('/auth/forgot-password', requestUrl.origin)
    redirectUrl.searchParams.set('error', 'Invalid reset link. Please request a new one.')
    return NextResponse.redirect(redirectUrl)
  }

  // Fallback: no recognized params, send to home
  return NextResponse.redirect(requestUrl.origin + '/home')
}
