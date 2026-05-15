import React, { useEffect, useRef, useState } from 'react'

type Point = {
  lx: number
  ly: number
  energy: number
  seed: number
  r: number
  tw: number
  targetDist: number
}

type Link = [number, number, number]

type TitleLine = {
  text: string
  width: number
  baseline: number
}

type InteractiveTitleProps = {
  text: string
  as?: 'h1' | 'h2' | 'h3' | 'span'
  className?: string
  id?: string
  trackingFactor?: number
  maxPoints?: number
  wrapText?: boolean
}

const TAU = Math.PI * 2
const RADIUS = 112
const RADIUS_SOFT = 30

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value))

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

const rand = (seed: number) => {
  const value = Math.sin(seed * 12.9898) * 43758.5453123
  return value - Math.floor(value)
}

function measureTrackedText(
  context: CanvasRenderingContext2D,
  text: string,
  tracking: number,
) {
  let width = 0

  for (let index = 0; index < text.length; index++) {
    width += context.measureText(text[index]).width
    if (index < text.length - 1) width += tracking
  }

  return width
}

function drawTrackedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  tracking: number,
  mode: 'fill' | 'stroke' = 'fill',
) {
  let xx = x

  for (let index = 0; index < text.length; index++) {
    const character = text[index]
    if (mode === 'stroke') context.strokeText(character, xx, y)
    else context.fillText(character, xx, y)
    xx += context.measureText(character).width + tracking
  }
}

function wrapTrackedText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  tracking: number,
) {
  const words = text.split(/(\s+)/)
  const lines: string[] = []
  let line = ''

  for (const word of words) {
    const candidate = `${line}${word}`
    const candidateWidth = measureTrackedText(context, candidate.trimEnd(), tracking)

    if (line && !/^\s+$/.test(word) && candidateWidth > maxWidth) {
      lines.push(line.trimEnd())
      line = word.trimStart()
    } else {
      line = candidate
    }
  }

  if (line.trim()) lines.push(line.trimEnd())
  return lines.length ? lines : [text]
}

function buildLinks(points: Point[], size: number) {
  const maxDistance = size * 0.16
  const maxDistance2 = maxDistance * maxDistance
  const cells = new Map<string, number[]>()
  const links: Link[] = []
  const key = (ix: number, iy: number) => `${ix},${iy}`

  for (let i = 0; i < points.length; i++) {
    const point = points[i]
    const ix = Math.floor(point.lx / maxDistance)
    const iy = Math.floor(point.ly / maxDistance)
    let made = 0

    for (let yy = iy - 1; yy <= iy + 1; yy++) {
      for (let xx = ix - 1; xx <= ix + 1; xx++) {
        const bucket = cells.get(key(xx, yy))
        if (!bucket) continue

        for (const j of bucket) {
          const other = points[j]
          const dx = point.lx - other.lx
          const dy = point.ly - other.ly
          const distance2 = dx * dx + dy * dy

          if (
            distance2 > 1 &&
            distance2 < maxDistance2 &&
            rand((i + 13) * (j + 29)) > 0.84
          ) {
            links.push([i, j, Math.sqrt(distance2)])
            made++
            if (made >= 2 || links.length >= 900) break
          }
        }

        if (made >= 2 || links.length >= 900) break
      }

      if (made >= 2 || links.length >= 900) break
    }

    const cellKey = key(ix, iy)
    if (!cells.has(cellKey)) cells.set(cellKey, [])
    cells.get(cellKey)?.push(i)

    if (links.length >= 900) break
  }

  return links
}

function particleBudgetForText(lines: TitleLine[], size: number) {
  const letterCount = lines.reduce(
    (count, line) => count + line.text.replace(/\s/g, '').length,
    0,
  )
  const pointsPerLetter = clamp(Math.round(size * 0.55), 18, 48)

  return clamp(letterCount * pointsPerLetter, 90, 520)
}

export function InteractiveTitle({
  text,
  as: Heading = 'h1',
  className = '',
  id,
  trackingFactor = -0.035,
  maxPoints,
  wrapText = true,
}: InteractiveTitleProps) {
  const wrapRef = useRef<HTMLElement>(null)
  const headingRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const wrap = wrapRef.current
    const heading = headingRef.current
    const canvas = canvasRef.current
    if (!wrap || !heading || !canvas) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const largePointerSurface = window.matchMedia('(min-width: 768px)')
    if (reducedMotion.matches || !largePointerSurface.matches) return

    const context = canvas.getContext('2d')
    if (!context) return

    const pointer = {
      x: -9999,
      y: -9999,
      active: false,
      hot: false,
    }

    const state = {
      width: 0,
      height: 0,
      contentWidth: 0,
      contentHeight: 0,
      size: 0,
      baseline: 0,
      textWidth: 0,
      tracking: 0,
      font: '',
      bleed: 0,
      lines: [] as TitleLine[],
      points: [] as Point[],
      links: [] as Link[],
      last: performance.now(),
    }

    function buildTextField() {
      const styles = window.getComputedStyle(heading)
      const fontSize = Number.parseFloat(styles.fontSize) || 48
      const fontWeight = styles.fontWeight || '700'
      const fontFamily = styles.fontFamily
      const font = `${fontWeight} ${fontSize}px ${fontFamily}`
      const tracking = fontSize * trackingFactor
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const rect = wrap.getBoundingClientRect()
      const headingRect = heading.getBoundingClientRect()
      const bleed = RADIUS * 1.45

      state.contentWidth = Math.ceil(rect.width)
      state.contentHeight = Math.ceil(rect.height)
      state.bleed = bleed
      state.width = Math.ceil(state.contentWidth + bleed * 2)
      state.height = Math.ceil(state.contentHeight + bleed * 2)
      state.size = fontSize
      state.font = font
      state.tracking = tracking
      state.baseline = bleed + headingRect.top - rect.top + fontSize * 0.88
      context.font = font
      context.textBaseline = 'alphabetic'
      context.textAlign = 'left'

      const lineHeight =
        styles.lineHeight === 'normal'
          ? fontSize * 1.2
          : Number.parseFloat(styles.lineHeight) || fontSize * 1.2
      const lineTexts = wrapText
        ? wrapTrackedText(context, text, headingRect.width, tracking)
        : [text]
      state.lines = lineTexts.map((line, index) => ({
        text: line,
        width: measureTrackedText(context, line, tracking),
        baseline: state.baseline + index * lineHeight,
      }))
      state.textWidth = Math.max(...state.lines.map((line) => line.width))
      state.width = Math.ceil(Math.max(state.contentWidth, state.textWidth) + bleed * 2)

      canvas.width = Math.max(1, Math.round(state.width * dpr))
      canvas.height = Math.max(1, Math.round(state.height * dpr))
      canvas.style.width = `${state.width}px`
      canvas.style.height = `${state.height}px`
      canvas.style.left = `${-bleed}px`
      canvas.style.top = `${-bleed}px`
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      context.font = font
      context.textBaseline = 'alphabetic'
      context.textAlign = 'left'

      const offscreen = document.createElement('canvas')
      const offscreenContext = offscreen.getContext('2d')
      if (!offscreenContext) return

      const maskWidth = Math.max(1, Math.ceil(state.width))
      const maskHeight = Math.max(1, Math.ceil(state.height))
      offscreen.width = maskWidth
      offscreen.height = maskHeight
      offscreenContext.font = font
      offscreenContext.textBaseline = 'alphabetic'
      offscreenContext.fillStyle = '#fff'
      for (const line of state.lines) {
        drawTrackedText(offscreenContext, line.text, bleed, line.baseline, tracking)
      }

      const image = offscreenContext.getImageData(0, 0, maskWidth, maskHeight)
      const step = clamp(Math.round(fontSize / 18), 4, 8)
      const points: Point[] = []

      for (let y = 0; y < maskHeight; y += step) {
        for (let x = 0; x < maskWidth; x += step) {
          const alpha = image.data[(y * maskWidth + x) * 4 + 3]
          if (alpha < 42 || rand(x * 0.372 + y * 1.917 + fontSize) < 0.55) {
            continue
          }

          const jitterX = (rand(x * 1.731 + y * 0.121) - 0.5) * step * 2
          const jitterY = (rand(x * 0.317 + y * 2.711) - 0.5) * step * 2
          const isRing = rand(x * 2.1 + y * 3.4) > 0.2
          const targetDist = isRing
            ? RADIUS * lerp(0.82, 1.2, rand(x * 1.1 + y * 2.2))
            : RADIUS * lerp(0.05, 0.26, rand(x * 3.3 + y * 4.4))

          points.push({
            lx: x + jitterX,
            ly: y + jitterY,
            energy: 0,
            seed: rand(x * 4.13 + y * 8.71),
            r: lerp(1, 2.4, rand(x * 5.77 + y * 0.43)),
            tw: lerp(0.65, 1.35, rand(x * 1.91 + y * 3.77)),
            targetDist,
          })
        }
      }

      const particleBudget = maxPoints ?? particleBudgetForText(state.lines, fontSize)

      state.points =
        points.length > particleBudget
          ? Array.from(
              { length: particleBudget },
              (_, index) => points[Math.floor(index * (points.length / particleBudget))],
            )
          : points
      state.links = buildLinks(state.points, fontSize)
      setReady(true)
    }

    function isPointerNearText() {
      return (
        pointer.active &&
        pointer.x >= state.bleed - RADIUS &&
        pointer.x <= state.bleed + state.textWidth + RADIUS &&
        pointer.y >= state.bleed - RADIUS &&
        pointer.y <= state.bleed + state.contentHeight + RADIUS
      )
    }

    function activationFor(point: Point) {
      if (!isPointerNearText()) return 0

      const sx = point.lx
      const sy = point.ly
      const dx = pointer.x - sx
      const dy = pointer.y - sy
      const distance = Math.sqrt(dx * dx + dy * dy)
      const radial = 1 - smoothstep(RADIUS - RADIUS_SOFT, RADIUS, distance)

      return clamp(radial * (0.82 + 0.18 * point.tw), 0, 1)
    }

    function pointScreen(point: Point, time: number) {
      const sx = point.lx
      const sy = point.ly
      const dx = sx - pointer.x
      const dy = sy - pointer.y
      const distance = Math.sqrt(dx * dx + dy * dy) || 1
      const influence = smoothstep(0, 1, point.energy)
      const jitter = point.energy * 6

      return {
        x:
          lerp(sx, pointer.x + (dx / distance) * point.targetDist, influence) +
          Math.sin(time * 0.0012 + point.seed * 20) * jitter,
        y:
          lerp(sy, pointer.y + (dy / distance) * point.targetDist, influence) +
          Math.cos(time * 0.001 + point.seed * 24) * jitter,
      }
    }

    function drawBaseText() {
      context.save()

      if (pointer.active) {
        context.beginPath()
        context.rect(0, 0, state.width, state.height)
        context.arc(pointer.x, pointer.y, RADIUS, 0, TAU, true)
        context.clip()
      }

      context.font = state.font
      context.textBaseline = 'alphabetic'
      context.fillStyle = '#fff'
      for (const line of state.lines) {
        drawTrackedText(context, line.text, state.bleed, line.baseline, state.tracking)
      }
      context.restore()
    }

    function drawHighlight(time: number) {
      if (!isPointerNearText()) return

      context.save()
      context.beginPath()
      context.arc(pointer.x, pointer.y, RADIUS, 0, TAU)
      context.clip()
      context.font = state.font
      context.textBaseline = 'alphabetic'
      context.lineJoin = 'round'
      context.lineWidth = Math.max(1.4, state.size * 0.012)
      context.strokeStyle = 'rgba(255,255,255,0.16)'
      for (const line of state.lines) {
        drawTrackedText(
          context,
          line.text,
          state.bleed,
          line.baseline,
          state.tracking,
          'stroke',
        )
      }

      context.setLineDash([state.size * 0.18, state.size * 1.6])
      context.lineDashOffset = -(time * 0.022)
      context.lineWidth = Math.max(1, state.size * 0.006)
      context.strokeStyle = 'rgba(255,255,255,0.92)'
      for (const line of state.lines) {
        drawTrackedText(
          context,
          line.text,
          state.bleed,
          line.baseline,
          state.tracking,
          'stroke',
        )
      }
      context.restore()
    }

    function drawParticles(time: number) {
      if (!isPointerNearText()) return

      context.save()
      context.beginPath()
      context.arc(pointer.x, pointer.y, RADIUS * 1.35, 0, TAU)
      context.clip()
      context.globalCompositeOperation = 'lighter'
      context.lineWidth = Math.max(1, state.size * 0.004)

      for (const [ai, bi, distance] of state.links) {
        const a = state.points[ai]
        const b = state.points[bi]
        const energy = Math.min(a.energy, b.energy)
        if (energy < 0.025) continue

        const aScreen = pointScreen(a, time)
        const bScreen = pointScreen(b, time)
        const midX = (aScreen.x + bScreen.x) * 0.5
        const midY = (aScreen.y + bScreen.y) * 0.5
        const localDistance = Math.hypot(pointer.x - midX, pointer.y - midY)
        const local = 1 - smoothstep(RADIUS - 18, RADIUS * 1.3, localDistance)
        if (local <= 0) continue

        const distanceFade = clamp(1 - distance / (state.size * 0.16), 0, 1)
        context.strokeStyle = `rgba(255,255,255,${energy * local * distanceFade * 0.82})`
        context.beginPath()
        context.moveTo(aScreen.x, aScreen.y)
        context.lineTo(bScreen.x, bScreen.y)
        context.stroke()
      }

      for (let index = 0; index < state.points.length; index++) {
        const point = state.points[index]
        if (point.energy < 0.01) continue

        const screen = pointScreen(point, time)
        const twinkle = 0.74 + 0.26 * Math.sin(time * 0.006 + point.seed * TAU)
        const radius = point.r * (0.72 + point.energy * 1.5) * twinkle

        context.fillStyle = `rgba(255,255,255,${point.energy * 0.78})`
        context.beginPath()
        context.arc(screen.x, screen.y, radius, 0, TAU)
        context.fill()

        if (index % 8 === 0) {
          context.fillStyle = `rgba(255,255,255,${point.energy * 0.12})`
          context.beginPath()
          context.arc(screen.x, screen.y, radius * 2.8, 0, TAU)
          context.fill()
        }
      }

      context.restore()
    }

    let animationFrame = 0

    function animate(now: number) {
      const dt = Math.min(0.05, (now - state.last) / 1000)
      state.last = now
      context.clearRect(0, 0, state.width, state.height)

      if (isPointerNearText()) {
        context.save()
        context.beginPath()
        context.arc(pointer.x, pointer.y, RADIUS * 1.45, 0, TAU)
        context.clip()

        const glow = context.createRadialGradient(
          pointer.x,
          pointer.y,
          0,
          pointer.x,
          pointer.y,
          RADIUS * 1.45,
        )
        glow.addColorStop(0, 'rgba(255,255,255,0.07)')
        glow.addColorStop(0.55, 'rgba(255,255,255,0.018)')
        glow.addColorStop(1, 'rgba(255,255,255,0)')
        context.fillStyle = glow
        context.fillRect(0, 0, state.width, state.height)
        context.restore()
      }

      pointer.hot = false
      for (const point of state.points) {
        const target = activationFor(point)
        if (target > 0.02) pointer.hot = true
        const rate =
          target > point.energy
            ? 1 - Math.pow(0.00008, dt)
            : 1 - Math.pow(0.018, dt)
        point.energy += (target - point.energy) * rate
        if (point.energy < 0.001) point.energy = 0
      }

      drawBaseText()
      drawHighlight(now)
      drawParticles(now)
      animationFrame = window.requestAnimationFrame(animate)
    }

    function onPointerMove(event: PointerEvent) {
      const rect = canvas.getBoundingClientRect()
      pointer.x = event.clientX - rect.left
      pointer.y = event.clientY - rect.top
      pointer.active = true
    }

    function onPointerOut(event: PointerEvent) {
      if (!event.relatedTarget) onPointerLeave()
    }

    function onPointerLeave() {
      pointer.active = false
      pointer.x = -9999
      pointer.y = -9999
    }

    const resizeObserver = new ResizeObserver(buildTextField)
    resizeObserver.observe(wrap)
    buildTextField()

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('pointerout', onPointerOut)
    animationFrame = window.requestAnimationFrame(animate)

    return () => {
      window.cancelAnimationFrame(animationFrame)
      resizeObserver.disconnect()
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerout', onPointerOut)
    }
  }, [maxPoints, text, trackingFactor, wrapText])

  const Wrapper = Heading === 'span' ? 'span' : 'div'

  return (
    <Wrapper
      ref={wrapRef}
      style={{
        position: 'relative',
        display: 'block',
        maxWidth: '100%',
        overflow: 'clip',
        overflowClipMargin: `${RADIUS * 1.45}px`,
      }}
    >
      <Heading
        ref={headingRef}
        id={id}
        className={className}
        style={{
          opacity: ready ? 0 : 1,
          transition: 'opacity 200ms ease',
        }}
      >
        {text}
      </Heading>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          display: ready ? 'block' : 'none',
          pointerEvents: 'none',
          touchAction: 'none',
        }}
      />
    </Wrapper>
  )
}
