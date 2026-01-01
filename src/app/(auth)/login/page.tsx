"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, ArrowLeft } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
const KAKAO_CLIENT_ID = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID || ""
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""

function LoginContent() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  
  const router = useRouter()
  const searchParams = useSearchParams()

  // OAuth Redirect URI (Handled in this page)
  const REDIRECT_URI = typeof window !== "undefined" ? `${window.location.origin}/login` : ""

  // 1. Check for OAuth Callback
  useEffect(() => {
    const provider = searchParams.get("provider")
    const code = searchParams.get("code")
    const errorParam = searchParams.get("error")

    if (errorParam) {
      setError("OAuth 인증이 취소되었습니다.")
      return
    }

    if (provider && code) {
      handleOAuthCallback(provider, code)
    }
  }, [searchParams])

  // 2. Already Logged In Check
  useEffect(() => {
    const token = localStorage.getItem("admin_access_token")
    if (token) {
        // 이미 로그인 됨
        router.replace("/")
    }
  }, [router])

  const handleOAuthCallback = async (provider: string, code: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE}/admin/auth/oauth/code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Legacy backend expects 'redirectUri' to match exactly
        body: JSON.stringify({ provider, code, redirectUri: REDIRECT_URI }),
      })

      if (!response.ok) throw new Error("로그인 실패")
      
      const data = await response.json()
      saveTokens(data)
      router.push("/")
    } catch (err) {
      console.error(err)
      setError("소셜 로그인 처리에 실패했습니다.")
      setIsLoading(false)
    }
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // API Requirements spec
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const errText = await response.text()
        throw new Error(errText || "로그인 실패")
      }

      const data = await response.json()
      // Expecting { token, user } or { accessToken, ... }
      // Adapting to likely structure
      const token = data.token || data.accessToken
      if (!token) throw new Error("토큰이 없습니다.")
      
      // Save
      localStorage.setItem("admin_access_token", token)
      if (data.user) localStorage.setItem("admin_info", JSON.stringify(data.user))
      
      router.push("/")
    } catch (err) {
       // Mock Fallback for Demo if API fails (Optional, but safer to error out for real integration)
       console.error(err)
       setError("아이디 또는 비밀번호를 확인해주세요.")
    } finally {
        setIsLoading(false)
    }
  }

  const saveTokens = (data: any) => {
    if (data.accessToken) localStorage.setItem("admin_access_token", data.accessToken)
    if (data.refreshToken) localStorage.setItem("admin_refresh_token", data.refreshToken)
    if (data.admin) localStorage.setItem("admin_info", JSON.stringify(data.admin))
    if (data.user) localStorage.setItem("admin_info", JSON.stringify(data.user))
  }

  const handleKakaoLogin = () => {
    if (!KAKAO_CLIENT_ID) {
        setError("카카오 로그인이 설정되지 않았습니다.")
        return
    }
    const url = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=profile_nickname,account_email&state=provider%3Dkakao` // Added state hack or param?
    // The legacy code used query param on redirect_uri? `${REDIRECT_URI}?provider=kakao`
    // Yes, Kakao preserves redirects.
    window.location.href = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${REDIRECT_URI}?provider=kakao&response_type=code`
  }

  const handleGoogleLogin = () => {
    if (!GOOGLE_CLIENT_ID) {
        setError("구글 로그인이 설정되지 않았습니다.")
        return
    }
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${REDIRECT_URI}?provider=google&response_type=code&scope=email%20profile&access_type=offline&prompt=consent`
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7F9F2] font-sans text-[#2F3E1F] px-6">
      
      {/* Back Link */}
      <div className="absolute top-8 left-8">
        <Link 
          href="/" 
          className="flex items-center gap-2 text-[#556B2F] hover:text-[#2F3E1F] transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="text-lg font-medium">메인으로</span>
        </Link>
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-10 space-y-2">
          <h1 className="text-4xl font-extrabold text-[#2F3E1F]">담소</h1>
          <p className="text-lg text-[#6E7F4F]">기관 관리자 전용 로그인</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-10 border border-[#E1EAD3]">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                {error}
            </div>
          )}
          
          <form onSubmit={handleEmailLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#4A5D23] ml-1">아이디 (이메일)</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="institution@example.com"
                className="h-14 px-4 rounded-xl border-2 border-[#C2D5A8] bg-[#FDFDFB] text-lg"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#4A5D23] ml-1">비밀번호</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호"
                  className="h-14 px-4 pr-12 rounded-xl border-2 border-[#C2D5A8] bg-[#FDFDFB] text-lg"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7B8C5A]"
                >
                  {showPassword ? <EyeOff size={24} /> : <Eye size={24} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-16 mt-4 text-xl font-bold rounded-2xl bg-[#8FA963] hover:bg-[#7A9351] text-white shadow-lg"
            >
              {isLoading ? "로그인 중..." : "로그인 하기"}
            </Button>
          </form>

          {/* Social Login */}
          <div className="mt-8 space-y-3">
             <div className="text-center text-sm text-[#AAB59B] mb-4">또는 소셜 계정으로 로그인</div>
             <button onClick={handleKakaoLogin} className="w-full h-14 bg-[#FEE500] hover:bg-[#FDD835] text-[#191919] font-bold rounded-xl flex items-center justify-center gap-2">
                <KakaoIcon /> 카카오 로그인
             </button>
             <button onClick={handleGoogleLogin} className="w-full h-14 bg-white border border-[#DDD] hover:bg-[#F9FAFB] text-[#333] font-bold rounded-xl flex items-center justify-center gap-2">
                <GoogleIcon /> 구글 로그인
             </button>
          </div>

        </div>
        
        <p className="text-center text-sm text-[#8FA963]/80 mt-8">
          © 담소 Damsō · 안전한 데이터 보안을 준수합니다
        </p>
      </div>
    </div>
  )
}

function KakaoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path fillRule="evenodd" clipRule="evenodd" d="M10 2C5.02944 2 1 5.36131 1 9.47368C1 12.1172 2.8377 14.4386 5.55185 15.7088L4.50555 19.4013C4.41748 19.6881 4.73941 19.9231 4.98666 19.7538L9.36334 16.8129C9.57055 16.8373 9.78273 16.8496 10 16.8496C14.9706 16.8496 19 13.4883 19 9.37591C19 5.26352 14.9706 2 10 2Z" fill="#191919"/>
    </svg>
  )
}

function GoogleIcon() {
  return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M19.8055 10.2308C19.8055 9.55078 19.7499 8.86703 19.6332 8.19824H10.2051V11.9868H15.6016C15.3775 13.1868 14.6571 14.2251 13.6055 14.9018V17.3518H16.8238C18.7238 15.6091 19.8055 13.1318 19.8055 10.2308Z" fill="#4285F4"/>
        <path d="M10.2051 19.7139C12.8996 19.7139 15.1718 18.8168 16.8238 17.3518L13.6055 14.9018C12.7113 15.4918 11.5551 15.8278 10.2051 15.8278C7.60018 15.8278 5.38518 14.0628 4.6002 11.6978H1.28223V14.2218C2.96073 17.4963 6.41602 19.7139 10.2051 19.7139Z" fill="#34A853"/>
        <path d="M4.6002 11.6978C4.16602 10.4978 4.16602 9.2151 4.6002 8.01507V5.49109H1.28223C-0.0941016 8.14409 -0.0941016 11.5688 1.28223 14.2218L4.6002 11.6978Z" fill="#FBBC04"/>
        <path d="M10.2051 3.88491C11.6162 3.8621 13.0051 4.37178 14.0551 5.35903L16.8793 2.53478C15.0829 0.860284 12.6884 -0.0555664 10.2051 -0.0222664C6.41602 -0.0222664 2.96073 2.19541 1.28223 5.47028L4.6002 8.01507C5.38518 5.64303 7.60018 3.88491 10.2051 3.88491Z" fill="#EA4335"/>
      </svg>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  )
}
