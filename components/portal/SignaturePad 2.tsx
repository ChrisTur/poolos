"use client"

import { useRef, useState, useCallback, useEffect } from "react"

interface Props {
  name: string
}

export default function SignaturePad({ name }: Props) {
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const drawing      = useRef(false)
  const [isEmpty, setIsEmpty] = useState(true)
  const [value, setValue]     = useState("")

  const setupCanvas = useCallback(() => {
    const canvas    = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    const dpr = window.devicePixelRatio || 1
    const w   = container.clientWidth
    const h   = 160
    canvas.width  = w * dpr
    canvas.height = h * dpr
    canvas.style.width  = `${w}px`
    canvas.style.height = `${h}px`
    const ctx = canvas.getContext("2d")!
    ctx.scale(dpr, dpr)
    ctx.strokeStyle = "#1e293b"
    ctx.lineWidth   = 2.5
    ctx.lineCap     = "round"
    ctx.lineJoin    = "round"
  }, [])

  useEffect(() => {
    setupCanvas()
    const ro = new ResizeObserver(setupCanvas)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [setupCanvas])

  function toPos(e: { clientX: number; clientY: number }): { x: number; y: number } {
    const rect = canvasRef.current!.getBoundingClientRect()
    const scaleX = canvasRef.current!.width  / rect.width
    const scaleY = canvasRef.current!.height / rect.height
    return {
      x: (e.clientX - rect.left) * scaleX / (window.devicePixelRatio || 1),
      y: (e.clientY - rect.top)  * scaleY / (window.devicePixelRatio || 1),
    }
  }

  function beginStroke(x: number, y: number) {
    drawing.current = true
    const ctx = canvasRef.current!.getContext("2d")!
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  function continueStroke(x: number, y: number) {
    if (!drawing.current) return
    const ctx = canvasRef.current!.getContext("2d")!
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  function endStroke() {
    if (!drawing.current) return
    drawing.current = false
    const data = canvasRef.current!.toDataURL("image/png")
    setIsEmpty(false)
    setValue(data)
  }

  function clear() {
    const canvas = canvasRef.current!
    canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height)
    setIsEmpty(true)
    setValue("")
    setupCanvas()
  }

  return (
    <div ref={containerRef} className="w-full space-y-1">
      <div className="relative border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          className="block w-full cursor-crosshair touch-none select-none"
          onMouseDown={(e) => { e.preventDefault(); const p = toPos(e.nativeEvent); beginStroke(p.x, p.y) }}
          onMouseMove={(e) => { const p = toPos(e.nativeEvent); continueStroke(p.x, p.y) }}
          onMouseUp={endStroke}
          onMouseLeave={endStroke}
          onTouchStart={(e) => { e.preventDefault(); const p = toPos(e.touches[0]); beginStroke(p.x, p.y) }}
          onTouchMove={(e) => { e.preventDefault(); const p = toPos(e.touches[0]); continueStroke(p.x, p.y) }}
          onTouchEnd={endStroke}
        />
        {isEmpty && (
          <p className="absolute inset-0 flex items-center justify-center text-sm text-gray-400 pointer-events-none">
            Draw your signature here
          </p>
        )}
        {!isEmpty && (
          <button
            type="button"
            onClick={clear}
            className="absolute top-2 right-2 text-xs text-gray-400 hover:text-red-500 bg-white border border-gray-200 rounded px-2 py-1 transition-colors"
          >
            Clear
          </button>
        )}
      </div>
      <div className="h-px bg-gray-300 mx-2" />
      <input type="hidden" name={name} value={value} />
    </div>
  )
}
