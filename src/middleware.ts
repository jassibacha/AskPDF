import { authMiddleware } from "@kinde-oss/kinde-auth-nextjs/server"

export const config = {
  matcher: ["/dashboard/:path*", "/auth-callback"] // Urls we want to force auth
}

export default authMiddleware