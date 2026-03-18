"use client"

import { useState } from "react"

export default function WalkieTalkiePage() {
  const [isTransmitting, setIsTransmitting] = useState(false)
  const [channel, setChannel] = useState(1)
  const [volume, setVolume] = useState(75)

  return (
    <main className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="relative">
        {/* Walkie Talkie Device */}
        <div className="relative w-[280px] h-[520px]">
          {/* Device Image */}
          <img
            src="/walkie-talkie.jpg"
            alt="Walkie Talkie"
            className="w-full h-full object-contain"
          />

          {/* Overlay UI Controls */}
          <div className="absolute inset-0 flex flex-col items-center justify-between py-16 px-8">
            {/* Channel Display */}
            <div className="bg-black/80 backdrop-blur-sm rounded-lg px-6 py-3 border border-green-500/30">
              <div className="text-green-400 text-xs font-mono uppercase tracking-wider mb-1">
                Channel
              </div>
              <div className="text-green-400 text-3xl font-mono font-bold text-center">
                {channel.toString().padStart(2, "0")}
              </div>
            </div>

            {/* Middle Section - Status */}
            <div className="flex flex-col items-center gap-4">
              {/* Signal Indicator */}
              <div className="flex gap-1 items-end">
                {[1, 2, 3, 4, 5].map((bar) => (
                  <div
                    key={bar}
                    className={`w-2 rounded-sm transition-all duration-200 ${
                      bar <= 4 ? "bg-green-400" : "bg-green-900"
                    }`}
                    style={{ height: `${bar * 6}px` }}
                  />
                ))}
              </div>
              
              {/* Status Text */}
              <div
                className={`text-xs font-mono uppercase tracking-widest transition-all duration-200 ${
                  isTransmitting ? "text-red-400 animate-pulse" : "text-green-400"
                }`}
              >
                {isTransmitting ? "Transmitting..." : "Ready"}
              </div>

              {/* Volume Indicator */}
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-green-400"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                </svg>
                <div className="w-20 h-1 bg-green-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-400 rounded-full transition-all duration-200"
                    style={{ width: `${volume}%` }}
                  />
                </div>
              </div>
            </div>

            {/* PTT Button */}
            <button
              onMouseDown={() => setIsTransmitting(true)}
              onMouseUp={() => setIsTransmitting(false)}
              onMouseLeave={() => setIsTransmitting(false)}
              onTouchStart={() => setIsTransmitting(true)}
              onTouchEnd={() => setIsTransmitting(false)}
              className={`w-20 h-20 rounded-full border-4 transition-all duration-150 flex items-center justify-center ${
                isTransmitting
                  ? "bg-red-500 border-red-400 shadow-[0_0_30px_rgba(239,68,68,0.5)] scale-95"
                  : "bg-green-600 border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)]"
              }`}
            >
              <span className="text-white font-bold text-xs tracking-wider">
                PTT
              </span>
            </button>
          </div>
        </div>

        {/* Channel Controls */}
        <div className="absolute -right-16 top-1/2 -translate-y-1/2 flex flex-col gap-4">
          <button
            onClick={() => setChannel((c) => Math.min(c + 1, 99))}
            className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 text-green-400 hover:bg-zinc-700 transition-colors flex items-center justify-center"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <button
            onClick={() => setChannel((c) => Math.max(c - 1, 1))}
            className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 text-green-400 hover:bg-zinc-700 transition-colors flex items-center justify-center"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Volume Controls */}
        <div className="absolute -left-16 top-1/2 -translate-y-1/2 flex flex-col gap-4">
          <button
            onClick={() => setVolume((v) => Math.min(v + 10, 100))}
            className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 text-green-400 hover:bg-zinc-700 transition-colors flex items-center justify-center"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12M6 12h12" />
            </svg>
          </button>
          <button
            onClick={() => setVolume((v) => Math.max(v - 10, 0))}
            className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 text-green-400 hover:bg-zinc-700 transition-colors flex items-center justify-center"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12h12" />
            </svg>
          </button>
        </div>
      </div>
    </main>
  )
}
