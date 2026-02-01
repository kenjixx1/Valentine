import { useEffect, useRef, useState } from "react"
import styles from "./RepelButton.module.css"

type Vec = { x: number; y: number }

const PROXIMITY = 100          // Increased proximity for better evasion
const BASE_SPEED = 600
const PANIC_SPEED = 1000
const WALL_MARGIN = 24
const WALL_REPEL_DIST = 150
const MIN_SCALE = 0.1          // Don't shrink too much, text needs to be readable
const SCALE_RADIUS = 120

interface RepelButtonProps {
  label?: string
  onClick?: () => void
  className?: string
  initialPos?: { x: number; y: number }
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

function len(v: Vec) {
  return Math.hypot(v.x, v.y)
}

function norm(v: Vec): Vec {
  const l = len(v) || 1
  return { x: v.x / l, y: v.y / l }
}

export default function RepelButton({
  label = "NO",
  onClick,
  className = "",
  initialPos
}: RepelButtonProps) {
  const btnRef = useRef<HTMLButtonElement | null>(null)

  // mouse position tracked globally
  const mouse = useRef<Vec>({ x: -9999, y: -9999 })

  // position stored in state for rendering
  const [pos, setPos] = useState<Vec>(initialPos || {
    x: window.innerWidth / 2 + 100, // Default to slightly right of center if no init
    y: window.innerHeight / 2 + 50,
  })

  // internal refs for smooth animation
  const posRef = useRef<Vec>(pos)
  const velRef = useRef<Vec>({ x: 0, y: 0 })
  const rafRef = useRef<number | null>(null)
  const lastT = useRef<number>(performance.now())

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY }
    }

    window.addEventListener("mousemove", onMove)

    const tick = (t: number) => {
      const dt = Math.min(0.033, (t - lastT.current) / 1000)
      lastT.current = t

      const el = btnRef.current
      if (!el) {
        rafRef.current = requestAnimationFrame(tick)
        return
      }

      const rect = el.getBoundingClientRect()
      const w = rect.width
      const h = rect.height

      const maxX = window.innerWidth - w - WALL_MARGIN
      const maxY = window.innerHeight - h - WALL_MARGIN
      const minX = WALL_MARGIN
      const minY = WALL_MARGIN

      // button center
      const cx = posRef.current.x + w / 2
      const cy = posRef.current.y + h / 2

      // vector away from mouse
      const away = { x: cx - mouse.current.x, y: cy - mouse.current.y }
      const dist = len(away)

      // how "threatened" it is (0..1)
      const threat = clamp((PROXIMITY - dist) / PROXIMITY, 0, 1)

      // --- wall avoidance forces ---
      const dLeft = posRef.current.x - minX
      const dRight = maxX - posRef.current.x
      const dTop = posRef.current.y - minY
      const dBottom = maxY - posRef.current.y

      const nearLeft = clamp((WALL_REPEL_DIST - dLeft) / WALL_REPEL_DIST, 0, 1)
      const nearRight = clamp((WALL_REPEL_DIST - dRight) / WALL_REPEL_DIST, 0, 1)
      const nearTop = clamp((WALL_REPEL_DIST - dTop) / WALL_REPEL_DIST, 0, 1)
      const nearBottom = clamp((WALL_REPEL_DIST - dBottom) / WALL_REPEL_DIST, 0, 1)

      const wallForce: Vec = {
        x: (nearLeft * 1) + (nearRight * -1),
        y: (nearTop * 1) + (nearBottom * -1),
      }

      // cornered if close to 2 walls at once
      const cornerLevel = clamp(
        Math.max(nearLeft, nearRight) + Math.max(nearTop, nearBottom),
        0,
        2
      )
      const cornered = cornerLevel > 1.2

      const targetSpeed =
        cornered ? PANIC_SPEED : BASE_SPEED + threat * (PANIC_SPEED - BASE_SPEED) * 0.55

      let dir: Vec = { x: 0, y: 0 }

      if (threat > 0) {
        const awayDir = norm(away)
        dir.x += awayDir.x * (0.85 + 0.15 * threat)
        dir.y += awayDir.y * (0.85 + 0.15 * threat)
      }

      const wallDir = norm(wallForce)
      dir.x += wallDir.x * (0.9 * Math.max(nearLeft, nearRight))
      dir.y += wallDir.y * (0.9 * Math.max(nearTop, nearBottom))

      const dirLen = len(dir)
      const desiredVel =
        dirLen > 0
          ? { x: (dir.x / dirLen) * targetSpeed, y: (dir.y / dirLen) * targetSpeed }
          : { x: 0, y: 0 }

      const accel = cornered ? 25 : 15
      velRef.current.x += (desiredVel.x - velRef.current.x) * clamp(accel * dt, 0, 1)
      velRef.current.y += (desiredVel.y - velRef.current.y) * clamp(accel * dt, 0, 1)

      let nx = posRef.current.x + velRef.current.x * dt
      let ny = posRef.current.y + velRef.current.y * dt

      if (nx <= minX) {
        nx = minX
        velRef.current.x = Math.max(0, velRef.current.x)
      } else if (nx >= maxX) {
        nx = maxX
        velRef.current.x = Math.min(0, velRef.current.x)
      }

      if (ny <= minY) {
        ny = minY
        velRef.current.y = Math.max(0, velRef.current.y)
      } else if (ny >= maxY) {
        ny = maxY
        velRef.current.y = Math.min(0, velRef.current.y)
      }

      posRef.current = { x: nx, y: ny }
      setPos(posRef.current)

      // --- scale based on proximity ---
      let scale = 1
      if (dist < SCALE_RADIUS) {
        const t = clamp(dist / SCALE_RADIUS, 0, 1)
        scale = MIN_SCALE + (1 - MIN_SCALE) * t
      }
      el.style.transform = `scale(${scale})`

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener("mousemove", onMove)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <button
      ref={btnRef}
      className={`${styles.repel} ${className}`}
      style={{ left: pos.x, top: pos.y }}
      type="button"
      onClick={onClick}
    >
      {label}
    </button>
  )
}