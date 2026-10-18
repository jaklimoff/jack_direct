// G2 "glyph map" covers. Each featured post gets a small diagram built from
// facts in the post. The Cover component renders these as HTML, and
// scripts/render-covers.mjs turns them into PNGs for social previews.

export type Tone = 'hot' | 'faint' | 'fainter'

export type Diagram =
  | {
      kind: 'chat'
      lines: { t: string; tone?: Tone }[]
      badge: string
      chip: string
      prompt: string
      caption: string
    }
  | {
      kind: 'events'
      items: { t: string; hot?: boolean; tag?: string }[]
      caption: string
    }
  | {
      kind: 'knobs'
      title: string
      items: { t: string; pos: number; hot?: boolean }[]
      caption: string
    }
  | {
      kind: 'graph'
      nodes: {
        t: string
        x: number
        y: number
        hot?: boolean
        ghost?: boolean
        sub?: string
      }[]
      edges: { from: number; to: number; label?: string; hot?: boolean }[]
      caption?: string
    }
  | {
      kind: 'stairs'
      items: { t: string; hot?: boolean }[]
      caption: string
    }
  | {
      kind: 'lanes'
      chips: { t: string; hot?: boolean }[]
      lanes: { t: string; w: number; hot?: boolean }[]
      barrier: string
      caption: string
    }
  | {
      kind: 'slots'
      rows: {
        label: string
        slots: { t: string; w: number; hot?: boolean }[][]
      }[]
      caption: string
    }

export interface CoverSpec {
  kicker: string
  short: string
  stat?: string
  diagram: Diagram
}

export const COVERS: Record<string, CoverSpec> = {
  'claude-code-mod-open-questions': {
    kicker: 'A Claude Code mod',
    short: 'The warning my agent gave that I never saw',
    diagram: {
      kind: 'chat',
      lines: [
        { t: 'I added a cache to /users.', tone: 'faint' },
        { t: 'getUsers() stores the promise', tone: 'faint' },
        { t: 'How stale can /users be?', tone: 'hot' },
        { t: '- invalidateUsersCache()', tone: 'fainter' },
      ],
      badge: '? 3 open',
      chip: 'send 2',
      prompt: '2  How stale can /users be?',
      caption: '↑ pinned above the prompt',
    },
  },

  'claude-code-hooks-complete-guide': {
    kicker: 'Claude Code guide',
    short: 'Claude Code hooks: the deterministic layer',
    stat: '33 events',
    diagram: {
      kind: 'events',
      items: [
        { t: 'SessionStart' },
        { t: 'UserPromptSubmit' },
        { t: 'PreToolUse', hot: true, tag: 'exit 2 → blocked' },
        { t: 'PostToolUse' },
        { t: 'Stop' },
      ],
      caption: '+ 28 more events',
    },
  },

  'every-knob-in-a-claude-code-skill-md': {
    kicker: 'Reference',
    short: 'Every knob in a Claude Code SKILL.md',
    stat: '20 fields',
    diagram: {
      kind: 'knobs',
      title: 'SKILL.md',
      items: [
        { t: 'name', pos: 20 },
        { t: 'description', pos: 62 },
        { t: 'allowed-tools', pos: 40 },
        { t: 'model', pos: 75 },
        { t: 'context: fork', pos: 88, hot: true },
        { t: 'agent', pos: 50 },
      ],
      caption: '+ 14 more fields',
    },
  },

  'wild-west-of-ai-protocols': {
    kicker: 'Beyond MCP',
    short: 'The wild west of AI agent protocols',
    diagram: {
      kind: 'graph',
      nodes: [
        { t: 'your agent', x: 50, y: 50, hot: true },
        { t: 'MCP', x: 50, y: 14 },
        { t: 'A2A', x: 86, y: 50 },
        { t: 'Agora', x: 50, y: 86 },
        { t: 'ANP', x: 14, y: 50 },
      ],
      edges: [
        { from: 0, to: 1 },
        { from: 0, to: 2 },
        { from: 0, to: 3 },
        { from: 0, to: 4 },
      ],
    },
  },

  'cap-theorem-for-developers': {
    kicker: 'Distributed systems',
    short: 'CAP theorem for developers',
    diagram: {
      kind: 'graph',
      nodes: [
        { t: 'C', sub: 'consistency', x: 50, y: 17 },
        { t: 'A', sub: 'availability', x: 18, y: 70 },
        { t: 'P', sub: 'partition tolerance', x: 82, y: 70, hot: true },
      ],
      edges: [
        { from: 0, to: 2, label: 'CP · Spanner', hot: true },
        { from: 1, to: 2, label: 'AP · Dynamo', hot: true },
        { from: 0, to: 1, label: 'CA · 1 node' },
      ],
      caption: 'Choose per operation, not per database',
    },
  },

  'how-to-stop-your-solidity-code-from-guzzling-gas-and-eth': {
    kicker: 'Solidity',
    short: "What saves gas, and what's folklore",
    stat: '6 myths',
    diagram: {
      kind: 'slots',
      rows: [
        {
          label: 'before · 3 slots',
          slots: [
            [{ t: 'uint128 a', w: 50 }],
            [{ t: 'uint256 b', w: 100 }],
            [{ t: 'uint128 c', w: 50 }],
          ],
        },
        {
          label: 'packed · 2 slots',
          slots: [
            [
              { t: 'uint128 a', w: 50, hot: true },
              { t: 'uint128 c', w: 50, hot: true },
            ],
            [{ t: 'uint256 b', w: 100 }],
          ],
        },
      ],
      caption: 'pack ’em in like sardines',
    },
  },

  'pull-over-push-pattern-in-solidity': {
    kicker: 'Solidity pattern',
    short: 'Pull over push: let users withdraw',
    diagram: {
      kind: 'graph',
      nodes: [
        { t: 'balances', x: 50, y: 50, hot: true },
        { t: 'user', x: 50, y: 13 },
        { t: 'user', x: 85, y: 70 },
        { t: 'user', x: 15, y: 70 },
        { t: 'for (…) transfer()', x: 50, y: 90, ghost: true },
      ],
      edges: [
        { from: 1, to: 0, label: 'withdraw()', hot: true },
        { from: 2, to: 0, label: 'withdraw()', hot: true },
        { from: 3, to: 0, label: 'withdraw()', hot: true },
      ],
    },
  },

  'python-threading-semaphores-and-barriers': {
    kicker: 'Python concurrency',
    short: 'Threading, semaphores, and barriers',
    diagram: {
      kind: 'lanes',
      chips: [{ t: 'Semaphore(2)' }, { t: 'Barrier(4)', hot: true }],
      lanes: [
        { t: 'Alice', w: 100 },
        { t: 'Bob', w: 100 },
        { t: 'Charlie', w: 64, hot: true },
        { t: 'David', w: 100 },
      ],
      barrier: 'barrier.wait()',
      caption: 'no one enters until everyone arrives',
    },
  },

  'reflections-on-kotters-8-step-change-model': {
    kicker: 'Leadership',
    short: 'Kotter’s 8-step change model, in practice',
    stat: '8 steps',
    diagram: {
      kind: 'stairs',
      items: [
        { t: 'urgency' },
        { t: 'coalition' },
        { t: 'vision' },
        { t: 'communicate' },
        { t: 'empower' },
        { t: 'short-term wins' },
        { t: 'consolidate' },
        { t: 'anchor in culture', hot: true },
      ],
      caption: 'one step at a time',
    },
  },
}

export function getCover(postId: string): CoverSpec | undefined {
  return COVERS[postId]
}

export function coverImagePath(postId: string): string {
  return `/content/images/covers/${postId}.png`
}
