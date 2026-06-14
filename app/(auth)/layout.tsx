import { Waves } from "lucide-react"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-950 to-sky-800 flex flex-col items-center justify-center p-4">
      <div className="mb-8 flex items-center gap-2 text-white">
        <Waves className="w-7 h-7 text-sky-300" />
        <span className="text-2xl font-bold tracking-tight">PoolOS</span>
      </div>
      {children}
    </div>
  )
}
