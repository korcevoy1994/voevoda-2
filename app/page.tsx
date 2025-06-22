import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <h1 className="text-4xl md:text-6xl font-extrabold mb-8 text-center text-gray-900 drop-shadow-lg">
        Добро пожаловать!
      </h1>
      <Link href="/seats">
        <Button size="lg" className="text-xl px-10 py-6 shadow-2xl bg-gradient-to-r from-purple-600 to-blue-500 text-white hover:from-purple-700 hover:to-blue-600 rounded-2xl">
          Купить билет
        </Button>
      </Link>
    </main>
  )
}