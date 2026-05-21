import { createServerClient } from "@supabase/ssr"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          response.cookies.set({
            name,
            value: "",
            ...options,
          })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  const pathname = req.nextUrl.pathname

  // Pages publiques (accessibles sans connexion)
  const publicPages = ["/splash", "/onboarding", "/auth"]
  
  // Redirection si page racine
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/splash", req.url))
  }
  
  // Si pas connecté et pas sur une page publique -> rediriger vers auth
  if (!session && !publicPages.includes(pathname)) {
    const redirectUrl = new URL("/auth", req.url)
    return NextResponse.redirect(redirectUrl)
  }
  
  // Si connecté et sur une page publique -> rediriger vers dashboard
  if (session && publicPages.includes(pathname)) {
    const redirectUrl = new URL("/dashboard", req.url)
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/projects/:path*",
    "/tasks/:path*",
    "/budget/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/splash",
    "/onboarding",
    "/auth"
  ]
}
