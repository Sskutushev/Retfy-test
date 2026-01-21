import AnalyzeForm from '@/components/AnalyzeForm'

export default function Home() {
  return (
    <main className="relative min-h-screen p-4 sm:p-24 overflow-hidden">
      {/* Background shapes */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-600 rounded-full mix-blend-screen filter blur-2xl opacity-30 animate-pulse-slow"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-600 rounded-full mix-blend-screen filter blur-2xl opacity-30 animate-pulse-slow animation-delay-2000"></div>
      <div className="absolute bottom-0 -left-4 w-72 h-72 bg-pink-600 rounded-full mix-blend-screen filter blur-2xl opacity-30 animate-pulse-slow animation-delay-4000"></div>


      <div className="text-center mb-12 z-10">
        <h1 className="text-4xl sm:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
          Telegram Chat Analytics
        </h1>
        <p className="text-lg sm:text-xl text-white/70">
          Unlock insights from your group chats with the power of AI.
        </p>
      </div>
      <AnalyzeForm />
    </main>
  )
}
