"use client"

import { useState } from "react"

export default function WalkieTalkiePage() {
  const [isTransmitting, setIsTransmitting] = useState(false)
  const [channel, setChannel] = useState(1)
  const [volume, setVolume] = useState(75)
  const [isPowerOn, setIsPowerOn] = useState(true)

  return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="relative">
        {/* Walkie Talkie Device - Pure CSS */}
        <div className="relative">
          {/* Antenna */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 flex flex-col items-center">
            {/* Antenna tip */}
            <div className="w-3 h-3 rounded-full bg-zinc-600 border border-zinc-500" />
            {/* Antenna body */}
            <div className="w-2 h-20 bg-gradient-to-b from-zinc-500 via-zinc-600 to-zinc-700 rounded-full" />
            {/* Antenna base */}
            <div className="w-6 h-4 bg-zinc-700 rounded-t-lg border-t border-x border-zinc-600" />
          </div>

          {/* Main Body */}
          <div className="w-72 h-[520px] bg-gradient-to-b from-zinc-800 via-zinc-900 to-zinc-950 rounded-3xl border border-zinc-700 shadow-2xl shadow-black/50 overflow-hidden">
            {/* Top Section with ridges */}
            <div className="h-8 bg-gradient-to-b from-zinc-700 to-zinc-800 flex items-center justify-center gap-0.5 px-4">
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className="w-1.5 h-4 bg-zinc-600 rounded-full" />
              ))}
            </div>

            {/* Speaker Grille */}
            <div className="mx-6 mt-4 p-4 bg-zinc-950 rounded-xl border border-zinc-800">
              <div className="grid grid-cols-8 gap-1.5">
                {Array.from({ length: 48 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-zinc-800 border border-zinc-700"
                  />
                ))}
              </div>
            </div>

            {/* Display Screen */}
            <div className="mx-6 mt-4">
              <div className={`bg-zinc-950 rounded-lg p-4 border-2 ${isPowerOn ? 'border-green-900/50' : 'border-zinc-800'} relative overflow-hidden`}>
                {/* Screen glow effect */}
                {isPowerOn && (
                  <div className="absolute inset-0 bg-green-500/5" />
                )}
                
                <div className="relative">
                  {/* Channel Display */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-mono uppercase tracking-wider ${isPowerOn ? 'text-green-500/70' : 'text-zinc-700'}`}>
                      CH
                    </span>
                    <div className={`text-4xl font-mono font-bold ${isPowerOn ? 'text-green-400' : 'text-zinc-800'}`}>
                      {channel.toString().padStart(2, "0")}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className={`h-px ${isPowerOn ? 'bg-green-900/50' : 'bg-zinc-800'} mb-3`} />

                  {/* Status Row */}
                  <div className="flex items-center justify-between">
                    {/* Signal Bars */}
                    <div className="flex gap-0.5 items-end">
                      {[1, 2, 3, 4, 5].map((bar) => (
                        <div
                          key={bar}
                          className={`w-1.5 rounded-sm transition-all duration-200 ${
                            isPowerOn
                              ? bar <= 4
                                ? "bg-green-400"
                                : "bg-green-900/50"
                              : "bg-zinc-800"
                          }`}
                          style={{ height: `${bar * 4}px` }}
                        />
                      ))}
                    </div>

                    {/* Status Text */}
                    <div
                      className={`text-[10px] font-mono uppercase tracking-wider transition-all duration-200 ${
                        !isPowerOn
                          ? "text-zinc-700"
                          : isTransmitting
                          ? "text-red-400 animate-pulse"
                          : "text-green-400"
                      }`}
                    >
                      {!isPowerOn ? "OFF" : isTransmitting ? "TX" : "RX"}
                    </div>

                    {/* Volume */}
                    <div className="flex items-center gap-1">
                      <svg
                        className={`w-3 h-3 ${isPowerOn ? 'text-green-500/70' : 'text-zinc-700'}`}
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                      </svg>
                      <div className={`w-12 h-1.5 ${isPowerOn ? 'bg-green-900/50' : 'bg-zinc-800'} rounded-full overflow-hidden`}>
                        <div
                          className={`h-full rounded-full transition-all duration-200 ${isPowerOn ? 'bg-green-400' : 'bg-zinc-700'}`}
                          style={{ width: `${volume}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Control Knobs Section */}
            <div className="mx-6 mt-4 flex items-center justify-between">
              {/* Volume Knob */}
              <div className="flex flex-col items-center gap-1">
                <span className="text-[8px] text-zinc-500 font-mono uppercase">Vol</span>
                <div 
                  className="w-10 h-10 rounded-full bg-gradient-to-b from-zinc-600 to-zinc-800 border-2 border-zinc-600 shadow-lg flex items-center justify-center cursor-pointer"
                  onClick={() => setVolume((v) => (v + 10) % 110)}
                >
                  <div className="w-1 h-3 bg-zinc-400 rounded-full" style={{ transform: `rotate(${volume * 2.7 - 135}deg)` }} />
                </div>
              </div>

              {/* Power Button */}
              <button
                onClick={() => setIsPowerOn(!isPowerOn)}
                className={`w-8 h-8 rounded-full border-2 transition-all duration-200 ${
                  isPowerOn
                    ? "bg-green-600 border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"
                    : "bg-zinc-700 border-zinc-600"
                }`}
              />

              {/* Channel Knob */}
              <div className="flex flex-col items-center gap-1">
                <span className="text-[8px] text-zinc-500 font-mono uppercase">Ch</span>
                <div 
                  className="w-10 h-10 rounded-full bg-gradient-to-b from-zinc-600 to-zinc-800 border-2 border-zinc-600 shadow-lg flex items-center justify-center cursor-pointer"
                  onClick={() => setChannel((c) => (c % 99) + 1)}
                >
                  <div className="w-1 h-3 bg-zinc-400 rounded-full" style={{ transform: `rotate(${channel * 3.6 - 180}deg)` }} />
                </div>
              </div>
            </div>

            {/* Side Texture Lines */}
            <div className="mx-6 mt-6 flex justify-center">
              <div className="flex gap-1">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="w-1 h-8 bg-zinc-800 rounded-full" />
                ))}
              </div>
            </div>

            {/* PTT Button */}
            <div className="mx-6 mt-6 flex justify-center">
              <button
                onMouseDown={() => isPowerOn && setIsTransmitting(true)}
                onMouseUp={() => setIsTransmitting(false)}
                onMouseLeave={() => setIsTransmitting(false)}
                onTouchStart={() => isPowerOn && setIsTransmitting(true)}
                onTouchEnd={() => setIsTransmitting(false)}
                disabled={!isPowerOn}
                className={`w-full h-20 rounded-xl border-2 transition-all duration-150 flex flex-col items-center justify-center gap-1 ${
                  !isPowerOn
                    ? "bg-zinc-800 border-zinc-700 cursor-not-allowed"
                    : isTransmitting
                    ? "bg-red-600 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.4)] scale-[0.98]"
                    : "bg-gradient-to-b from-zinc-700 to-zinc-800 border-zinc-600 hover:from-zinc-600 hover:to-zinc-700 active:scale-[0.98]"
                }`}
              >
                <span className={`font-bold text-lg tracking-wider ${
                  !isPowerOn ? 'text-zinc-600' : isTransmitting ? 'text-white' : 'text-zinc-300'
                }`}>
                  PTT
                </span>
                <span className={`text-[10px] uppercase tracking-widest ${
                  !isPowerOn ? 'text-zinc-600' : isTransmitting ? 'text-red-200' : 'text-zinc-500'
                }`}>
                  Push to Talk
                </span>
              </button>
            </div>

            {/* Bottom Ridge */}
            <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-zinc-950 to-transparent" />
          </div>

          {/* Side Button - Left */}
          <div className="absolute left-0 top-40 -translate-x-1/2">
            <button
              onClick={() => setChannel((c) => Math.min(c + 1, 99))}
              className="w-4 h-16 bg-gradient-to-r from-zinc-700 to-zinc-600 rounded-l-lg border border-zinc-500 hover:from-zinc-600 hover:to-zinc-500 transition-colors"
            />
          </div>

          {/* Side Button - Right */}
          <div className="absolute right-0 top-40 translate-x-1/2">
            <button
              onClick={() => setVolume((v) => Math.min(v + 10, 100))}
              className="w-4 h-16 bg-gradient-to-l from-zinc-700 to-zinc-600 rounded-r-lg border border-zinc-500 hover:from-zinc-600 hover:to-zinc-500 transition-colors"
            />
          </div>
        </div>
      </div>
    </main>
  )
}
