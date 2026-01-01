"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    // Mock login logic
    setTimeout(() => {
        setIsLoading(false)
        router.push("/")
    }, 2000)
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
        {/* Header Section */}
        <div className="text-center mb-10 space-y-2">
          <h1 className="text-4xl font-extrabold text-[#2F3E1F]">담소</h1>
          <p className="text-lg text-[#6E7F4F]">기관 관리자 전용 로그인</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-10 border border-[#E1EAD3]">
          <form onSubmit={handleLogin} className="space-y-6">
            
            {/* ID Input */}
            <div className="space-y-2">
              <label 
                htmlFor="id" 
                className="block text-sm font-bold text-[#4A5D23] ml-1"
              >
                아이디 (이메일)
              </label>
              <Input
                id="id"
                type="email"
                placeholder="institution@example.com"
                className="h-14 px-4 rounded-xl border-2 border-[#C2D5A8] bg-[#FDFDFB] text-lg placeholder:text-[#AAB59B] focus-visible:ring-[#8FA963]/20 focus-visible:border-[#8FA963] focus-visible:ring-offset-0"
                required
              />
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label 
                htmlFor="password" 
                className="block text-sm font-bold text-[#4A5D23] ml-1"
              >
                비밀번호
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="비밀번호를 입력하세요"
                  className="h-14 px-4 pr-12 rounded-xl border-2 border-[#C2D5A8] bg-[#FDFDFB] text-lg placeholder:text-[#AAB59B] focus-visible:ring-[#8FA963]/20 focus-visible:border-[#8FA963] focus-visible:ring-offset-0"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7B8C5A] hover:text-[#4A5D23]"
                >
                  {showPassword ? <EyeOff size={24} /> : <Eye size={24} />}
                </button>
              </div>
            </div>

            {/* Keep Logged In & Forgot Password */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="keep-login" className="border-[#8FA963] data-[state=checked]:bg-[#8FA963] data-[state=checked]:text-white" />
                <label
                    htmlFor="keep-login"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-[#6E7F4F] hover:text-[#4A5D23] cursor-pointer"
                >
                    로그인 상태 유지
                </label>
              </div>
              
              <Link 
                href="#" 
                className="text-sm font-semibold text-[#8FA963] hover:underline"
              >
                비밀번호를 잊으셨나요?
              </Link>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-16 mt-4 text-xl font-bold rounded-2xl bg-[#8FA963] hover:bg-[#7A9351] text-white shadow-lg shadow-[#8FA963]/30 transition-all hover:-translate-y-[2px]"
            >
              {isLoading ? "로그인 중..." : "로그인 하기"}
            </Button>
          </form>

          {/* Divider & Register Link */}
          <div className="mt-8 pt-8 border-t border-[#E1EAD3] text-center space-y-4">
            <p className="text-[#6E7F4F]">
              아직 기관 계정이 없으신가요?
            </p>
            <Link href="/onboarding/intro" className="block">
              <Button
                variant="outline"
                className="w-full h-14 text-lg font-semibold rounded-xl border-2 border-[#C2D5A8] text-[#4A5D23] bg-transparent hover:bg-[#F1F6E8] hover:border-[#8FA963] hover:text-[#4A5D23]"
              >
                새 기관 등록 신청
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Footer Copyright */}
        <p className="text-center text-sm text-[#8FA963]/80 mt-8">
          © 담소 Damsō · 안전한 데이터 보안을 준수합니다
        </p>
      </div>
    </div>
  )
}
