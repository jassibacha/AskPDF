"use client" // Because this is a FE component that we're using TRPC in, we need use client
import { ArrowRight, Menu } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"


function MobileNav({isAuth}: {isAuth: boolean}) {
  const [isOpen, setOpen] = useState<boolean>(false)

  const toggleOpen = () => setOpen((prev) => !prev)

  const pathname = usePathname()

  useEffect(() => {
    if (isOpen) toggleOpen()
  }, [pathname])

  const closeOnCurrent = (href: string) => {
    if (pathname === href) {
      toggleOpen()
    }
  }

  return (
    <div className="sm:hidden">
      <Menu 
        className="relative z-50 h-5 w-5 text-zinc-700" 
        onClick={toggleOpen} />
      {isOpen ? (
        <div className="fixed animate-in slide-in-from-top-5 fade-in-20 inset-0 z-0 w-full">
          <ul className="absolute bg-white border-b border-zinc-200 shadow-xl grid w-full gap-3 px-10 pt-20 pb-8">
            {!isAuth ? (
              <>
                <li>
                  <Link 
                    className="flex items-center w-full font-semibold text-green-600" 
                    onClick={() => closeOnCurrent('/sign-up')}
                    href="/sign-up">
                    Get Started <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </li> 
                <li className="my-3 h-px w-full bg-gray-300" />
                <li>
                  <Link 
                    className="flex items-center w-full font-semibold" 
                    onClick={() => closeOnCurrent('/sign-in')}
                    href="/sign-in">
                    Sign In
                  </Link>
                </li> 
                <li className="my-3 h-px w-full bg-gray-300" />
                <li>
                  <Link 
                    className="flex items-center w-full font-semibold" 
                    onClick={() => closeOnCurrent('/pricing')}
                    href="/pricing">
                    Pricing
                  </Link>
                </li> 
              </>
            ) : (
              <>
                <li>
                  <Link 
                    className="flex items-center w-full font-semibold" 
                    onClick={() => closeOnCurrent('/dashboard')}
                    href="/dashboard">
                    Dashboard
                  </Link>
                </li> 
                <li className="my-3 h-px w-full bg-gray-300" />
                <li>
                  <Link 
                    className="flex items-center w-full font-semibold" 
                    href="/log-out">
                    Log Out
                  </Link>
                </li> 
              </>
            )}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

export default MobileNav