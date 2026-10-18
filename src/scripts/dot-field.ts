// Canvas dot grid that bends around the cursor and ripples as it moves.
// Matches the CSS grid it replaces: 20px cells, dots centred in each cell.
// Elements marked [data-field-body] inside the host get nudged by the same
// field: data-field-lens and data-field-ripple set how strongly (0..1).

const GAP = 20
const OFFSET = GAP / 2
const DOT_RADIUS = 1.1

const LENS_RADIUS = 160
const LENS_STRENGTH = 24 // max outward shift in px (magnifier bulge)

const RIPPLE_SPEED = 0.38 // px per ms
const RIPPLE_WIDTH = 38
const RIPPLE_LIFE = 1500 // ms
const RIPPLE_PUSH = 7 // px at amplitude 1
const TRAIL_STEP = 120 // px the cursor travels between trail ripples
const MAX_RIPPLES = 14

type Ripple = { x: number; y: number; start: number; amp: number }
type Body = { el: HTMLElement; lens: number; ripple: number; x: number; y: number }
type Sample = { dx: number; dy: number; glow: number }

export function mountDotField(root: HTMLElement): () => void {
  const canvas = root.querySelector('canvas')
  const ctx = canvas?.getContext('2d')
  const host = root.parentElement
  if (!canvas || !ctx || !host) return () => {}

  let width = 0
  let height = 0
  let dotColor = ''
  let accent = ''
  let frame = 0

  // Eased lens position and strength, chasing the raw pointer
  const lens = { x: 0, y: 0, tx: 0, ty: 0, strength: 0, target: 0 }
  let travelled = 0
  let last: { x: number; y: number } | null = null
  const ripples: Ripple[] = []
  const bodies: Body[] = Array.from(
    host.querySelectorAll<HTMLElement>('[data-field-body]'),
    (el) => ({
      el,
      lens: Number(el.dataset.fieldLens ?? 1),
      ripple: Number(el.dataset.fieldRipple ?? 1),
      x: 0,
      y: 0,
    }),
  )

  const readColors = () => {
    const style = getComputedStyle(document.documentElement)
    dotColor = style.getPropertyValue('--dot').trim()
    accent = style.getPropertyValue('--primary').trim()
  }

  const resize = () => {
    const rect = root.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    width = rect.width
    height = rect.height
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    schedule()
  }

  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(draw)
  }

  // Field displacement at (x, y), written into `out` to avoid allocations
  const out: Sample = { dx: 0, dy: 0, glow: 0 }
  const sample = (
    x: number,
    y: number,
    now: number,
    lensOn: boolean,
    lensWeight: number,
    rippleWeight: number,
  ) => {
    out.dx = 0
    out.dy = 0
    out.glow = 0

    if (lensOn && lensWeight > 0) {
      const ox = x - lens.x
      const oy = y - lens.y
      const d = Math.hypot(ox, oy)
      if (d < LENS_RADIUS && d > 0) {
        // sin bulge: zero shift at centre and edge, so the grid never folds
        const t = d / LENS_RADIUS
        const push =
          Math.sin(Math.PI * t) * LENS_STRENGTH * lens.strength * lensWeight
        out.dx += (ox / d) * push
        out.dy += (oy / d) * push
        out.glow = Math.max(out.glow, (1 - t) * (1 - t) * lens.strength)
      }
    }

    if (rippleWeight === 0) return
    for (const r of ripples) {
      const age = now - r.start
      const ox = x - r.x
      const oy = y - r.y
      const d = Math.hypot(ox, oy)
      const band = d - age * RIPPLE_SPEED
      if (d === 0 || Math.abs(band) >= RIPPLE_WIDTH) continue
      const life = 1 - age / RIPPLE_LIFE
      const fade = life * life * r.amp * rippleWeight
      const shift = Math.sin((Math.PI * band) / RIPPLE_WIDTH) * fade
      out.dx += (ox / d) * shift * RIPPLE_PUSH
      out.dy += (oy / d) * shift * RIPPLE_PUSH
      const crest = Math.cos((Math.PI * band) / (2 * RIPPLE_WIDTH))
      out.glow = Math.max(out.glow, crest * crest * fade * 0.7)
    }
  }

  const moveBodies = (now: number, lensOn: boolean, rest: boolean) => {
    if (!bodies.length) return
    const origin = root.getBoundingClientRect()
    for (const b of bodies) {
      let dx = 0
      let dy = 0
      let glow = 0
      if (!rest) {
        const rect = b.el.getBoundingClientRect()
        // Sample at the element's resting centre, not where we pushed it
        const cx = rect.left + rect.width / 2 - origin.left - b.x
        const cy = rect.top + rect.height / 2 - origin.top - b.y
        sample(cx, cy, now, lensOn, b.lens, b.ripple)
        ;({ dx, dy, glow } = out)
      }
      b.x = dx
      b.y = dy
      b.el.style.translate = rest ? '' : `${dx.toFixed(2)}px ${dy.toFixed(2)}px`
      b.el.style.setProperty('--field-glow', glow.toFixed(3))
    }
  }

  const draw = (now: number) => {
    frame = 0
    lens.x += (lens.tx - lens.x) * 0.2
    lens.y += (lens.ty - lens.y) * 0.2
    lens.strength += (lens.target - lens.strength) * 0.09

    for (let i = ripples.length - 1; i >= 0; i--) {
      if (now - ripples[i].start > RIPPLE_LIFE) ripples.splice(i, 1)
    }

    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = dotColor
    ctx.beginPath()
    const hot: number[] = []
    const lensOn = lens.strength > 0.002

    for (let y = OFFSET; y < height; y += GAP) {
      for (let x = OFFSET; x < width; x += GAP) {
        sample(x, y, now, lensOn, 1, 1)
        const { dx, dy, glow } = out

        const px = x + dx
        const py = y + dy
        if (glow > 0.04) {
          hot.push(px, py, glow)
        } else {
          ctx.moveTo(px + DOT_RADIUS, py)
          ctx.arc(px, py, DOT_RADIUS, 0, Math.PI * 2)
        }
      }
    }
    ctx.fill()

    ctx.fillStyle = accent
    for (let i = 0; i < hot.length; i += 3) {
      const glow = Math.min(hot[i + 2], 1)
      ctx.globalAlpha = 0.2 + glow * 0.8
      ctx.beginPath()
      ctx.arc(hot[i], hot[i + 1], DOT_RADIUS + glow * 1.3, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1

    const settling =
      Math.abs(lens.tx - lens.x) > 0.1 ||
      Math.abs(lens.ty - lens.y) > 0.1 ||
      Math.abs(lens.target - lens.strength) > 0.002
    const active = settling || ripples.length > 0
    moveBodies(now, lensOn, !active && lens.target === 0)
    if (active) schedule()
  }

  const local = (e: PointerEvent) => {
    const rect = root.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const addRipple = (x: number, y: number, amp: number) => {
    if (ripples.length >= MAX_RIPPLES) ripples.shift()
    ripples.push({ x, y, start: performance.now(), amp })
    schedule()
  }

  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return
    const p = local(e)
    if (!last || lens.target === 0) {
      // Start the lens under the cursor instead of sliding in from a corner
      lens.x = p.x
      lens.y = p.y
    }
    lens.tx = p.x
    lens.ty = p.y
    lens.target = 1
    if (last) travelled += Math.hypot(p.x - last.x, p.y - last.y)
    last = p
    if (travelled > TRAIL_STEP) {
      travelled = 0
      addRipple(p.x, p.y, 0.45)
    }
    schedule()
  }

  const onLeave = () => {
    lens.target = 0
    last = null
    travelled = 0
    schedule()
  }

  const onDown = (e: PointerEvent) => {
    const p = local(e)
    addRipple(p.x, p.y, 1.2)
  }

  readColors()
  resize()
  root.dataset.live = 'true'

  host.addEventListener('pointermove', onMove)
  host.addEventListener('pointerleave', onLeave)
  host.addEventListener('pointerdown', onDown)
  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(root)
  const themeObserver = new MutationObserver(() => {
    readColors()
    schedule()
  })
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  })

  return () => {
    cancelAnimationFrame(frame)
    host.removeEventListener('pointermove', onMove)
    host.removeEventListener('pointerleave', onLeave)
    host.removeEventListener('pointerdown', onDown)
    resizeObserver.disconnect()
    themeObserver.disconnect()
    delete root.dataset.live
    for (const b of bodies) {
      b.el.style.translate = ''
      b.el.style.removeProperty('--field-glow')
    }
  }
}
