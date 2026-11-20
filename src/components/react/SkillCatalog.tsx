import { useEffect, useMemo, useState } from 'react'
import { ExternalLink, Loader2, Search, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

// Data: public/data/agent-skills.json, built by content/2026-11-best-claude-code-skills/catalog/build.py
// in the jack_direct repo. Rows are compact arrays to keep the file small.
type RepoRow = [name: string, stars: number, branch: string, aggregator: 0 | 1]
type SkillRow = [
  name: string,
  desc: string,
  repo: number,
  path: string,
  userInvoked: 0 | 1,
  cat: number,
  copies: number,
  pick: string,
]
type Catalog = { date: string; repos: RepoRow[]; cats: string[]; rows: SkillRow[] }

type Skill = {
  id: number
  name: string
  desc: string
  repo: string
  stars: number
  url: string
  cat: number
  copies: number
  agg: boolean
  pick: string
  hay: string
}

type Source = 'orig' | 'all'
type Sort = 'stars' | 'copies' | 'name'

const PAGE = 60
const DATA_URL = '/data/agent-skills.json'
const POST_URL = '/blog/best-claude-code-skills/'

const fmtK = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(n >= 100000 ? 0 : 1).replace(/\.0$/, '')}k` : String(n)

function readParams() {
  const p = new URLSearchParams(window.location.search)
  return {
    q: p.get('q') ?? '',
    cat: p.has('cat') ? Number(p.get('cat')) : -1,
    src: (p.get('src') === 'all' ? 'all' : 'orig') as Source,
    picks: p.get('picks') === '1',
    sort: (['stars', 'copies', 'name'].includes(p.get('sort') ?? '') ? p.get('sort') : 'copies') as Sort,
  }
}

export default function SkillCatalog() {
  const [data, setData] = useState<Catalog | null>(null)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')
  const [cat, setCat] = useState(-1)
  const [src, setSrc] = useState<Source>('orig')
  const [picksOnly, setPicksOnly] = useState(false)
  const [sort, setSort] = useState<Sort>('copies')
  const [limit, setLimit] = useState(PAGE)

  useEffect(() => {
    const p = readParams()
    setQ(p.q)
    setCat(p.cat)
    setSrc(p.src)
    setPicksOnly(p.picks)
    setSort(p.sort)
    fetch(DATA_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(setData)
      .catch((e: Error) => setError(e.message))
  }, [])

  // Keep the filters in the URL so a filtered view can be shared
  useEffect(() => {
    const p = new URLSearchParams()
    if (q) p.set('q', q)
    if (cat >= 0) p.set('cat', String(cat))
    if (src !== 'orig') p.set('src', src)
    if (picksOnly) p.set('picks', '1')
    if (sort !== 'copies') p.set('sort', sort)
    const qs = p.toString()
    window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname)
    setLimit(PAGE)
  }, [q, cat, src, picksOnly, sort])

  const skills = useMemo<Skill[]>(() => {
    if (!data) return []
    return data.rows.map((r, id) => {
      const [repo, stars, branch, agg] = data.repos[r[2]]
      return {
        id,
        name: r[0],
        desc: r[1],
        repo,
        stars,
        url: `https://github.com/${repo}/blob/${branch}/${r[3]}`,
        cat: r[5],
        copies: r[6],
        agg: agg === 1,
        pick: r[7],
        hay: `${r[0]} ${r[1]} ${repo}`.toLowerCase(),
      }
    })
  }, [data])

  const base = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return skills.filter(
      (s) =>
        (src === 'all' || !s.agg || !!s.pick) &&
        (!picksOnly || s.pick) &&
        (!needle || needle.split(/\s+/).every((w) => s.hay.includes(w))),
    )
  }, [skills, q, src, picksOnly])

  const catCounts = useMemo(() => {
    const counts = new Array(data?.cats.length ?? 0).fill(0)
    base.forEach((s) => counts[s.cat]++)
    return counts as number[]
  }, [base, data])

  const rows = useMemo(() => {
    const list = cat < 0 ? base.slice() : base.filter((s) => s.cat === cat)
    const by: Record<Sort, (a: Skill, b: Skill) => number> = {
      stars: (a, b) => b.stars - a.stars || a.name.localeCompare(b.name),
      copies: (a, b) => b.copies - a.copies || b.stars - a.stars,
      name: (a, b) => a.name.localeCompare(b.name),
    }
    return list.sort((a, b) => (b.pick ? 1 : 0) - (a.pick ? 1 : 0) || by[sort](a, b))
  }, [base, cat, sort])

  if (error)
    return (
      <p className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
        The skill list did not load ({error}). Reload the page to try again.
      </p>
    )
  if (!data)
    return (
      <p className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading about 9,600 skills…
      </p>
    )

  const total = skills.length
  const origCount = skills.filter((s) => !s.agg).length
  const pickCount = skills.filter((s) => s.pick).length

  const chip = (on: boolean) =>
    cn(
      'inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-sm transition-colors',
      on
        ? 'border-primary/50 bg-accent text-foreground'
        : 'border-border bg-surface text-muted-foreground hover:text-foreground',
    )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-3">
        <label className="flex h-10 items-center gap-2 rounded-md border border-border bg-background px-3 focus-within:border-primary">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="sr-only">Search skills</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search: review, hook, pdf, a repo…"
            className="h-full w-full min-w-0 bg-transparent text-base outline-none placeholder:text-muted-foreground sm:text-sm"
          />
        </label>

        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={chip(src === 'orig')} aria-pressed={src === 'orig'} onClick={() => setSrc('orig')}>
            Original repos <span className="font-mono text-xs">{origCount.toLocaleString('en-US')}</span>
          </button>
          <button type="button" className={chip(src === 'all')} aria-pressed={src === 'all'} onClick={() => setSrc('all')}>
            Plus aggregator copies <span className="font-mono text-xs">{total.toLocaleString('en-US')}</span>
          </button>
          <button type="button" className={chip(picksOnly)} aria-pressed={picksOnly} onClick={() => setPicksOnly(!picksOnly)}>
            <Star className="h-3.5 w-3.5" /> In the post <span className="font-mono text-xs">{pickCount}</span>
          </button>
          <label className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
            Sort
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="h-8 rounded-md border border-border bg-background px-2 text-sm text-foreground"
            >
              <option value="copies">Most copied</option>
              <option value="stars">Repo stars</option>
              <option value="name">Name</option>
            </select>
          </label>
        </div>

        <div
          className="-mx-3 flex gap-1.5 overflow-x-auto px-3 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0 [&>button]:shrink-0"
          role="group"
          aria-label="Category"
        >
          <button type="button" className={chip(cat < 0)} aria-pressed={cat < 0} onClick={() => setCat(-1)}>
            All <span className="font-mono text-xs">{base.length.toLocaleString('en-US')}</span>
          </button>
          {data.cats.map((name, i) => (
            <button
              key={name}
              type="button"
              className={cn(chip(cat === i), catCounts[i] === 0 && 'opacity-50')}
              aria-pressed={cat === i}
              onClick={() => setCat(cat === i ? -1 : i)}
            >
              {name} <span className="font-mono text-xs">{catCounts[i].toLocaleString('en-US')}</span>
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-muted-foreground" aria-live="polite">
        <b className="text-foreground">{rows.length.toLocaleString('en-US')}</b> skills
        {rows.length > limit && <> · showing {limit}</>}
      </p>

      {rows.length === 0 ? (
        <div className="flex flex-col items-start gap-3 py-8 text-sm text-muted-foreground">
          Nothing matches these filters.
          <button
            type="button"
            className={chip(false)}
            onClick={() => {
              setQ('')
              setCat(-1)
              setPicksOnly(false)
              setSrc('all')
            }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-lg border border-border bg-surface">
          {rows.slice(0, limit).map((s) => (
            <li key={s.id} className="flex flex-col gap-1.5 px-4 py-3">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <a
                  href={s.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1 font-mono text-sm font-semibold text-foreground hover:text-primary"
                >
                  {s.name}
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                </a>
                {s.pick && (
                  <a
                    href={`${POST_URL}#${s.pick}`}
                    className="inline-flex items-center gap-1 rounded-md bg-accent px-1.5 py-0.5 text-xs font-medium text-accent-foreground hover:underline"
                  >
                    <Star className="h-3 w-3" /> in the post
                  </a>
                )}
                <span className="font-mono text-xs text-muted-foreground">
                  {s.repo} · {fmtK(s.stars)}★
                </span>
              </div>
              <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground sm:line-clamp-none">{s.desc}</p>
              <div className="flex flex-wrap gap-x-3 text-xs text-faint">
                <span>{data.cats[s.cat]}</span>
                {s.copies > 0 && <span>also in {s.copies} other {s.copies === 1 ? 'repo' : 'repos'}</span>}
                {s.agg && <span>from an aggregator</span>}
              </div>
            </li>
          ))}
        </ul>
      )}

      {rows.length > limit && (
        <button type="button" className={cn(chip(false), 'self-center')} onClick={() => setLimit(limit + PAGE * 2)}>
          Show more
        </button>
      )}
    </div>
  )
}
