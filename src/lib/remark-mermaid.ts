import { createHash } from 'node:crypto'
import manifest from './diagram-manifest.json'

// Minimal mdast shapes, enough for this plugin
interface MdNode {
  type: string
  lang?: string | null
  meta?: string | null
  value?: string
  url?: string
  alt?: string
  children?: MdNode[]
  data?: Record<string, unknown>
}

interface DiagramInfo {
  width: number
  height: number
}

const diagrams: Record<string, DiagramInfo> = manifest.diagrams

// Keep in sync with diagramKey() in scripts/render-diagrams.mjs
const diagramKey = (source: string) =>
  createHash('sha256').update(source.trim()).digest('hex').slice(0, 12)

const attr = (meta: string | null | undefined, name: string) =>
  meta?.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1]

/**
 * Swap each ```mermaid block for the SVGs from scripts/render-diagrams.mjs:
 * a <figure> with one image per theme (CSS shows the right one) and an
 * optional caption. Fails the build when a block was not rendered yet.
 */
export function remarkMermaid() {
  return (tree: unknown, file: { path?: string }) =>
    walk(tree as MdNode, file.path ?? 'a post')
}

function walk(node: MdNode, path: string) {
  if (!node.children) return
  node.children = node.children.map((child) => {
    if (child.type === 'code' && child.lang === 'mermaid') return figure(child, path)
    walk(child, path)
    return child
  })
}

function figure(code: MdNode, path: string): MdNode {
  const alt = attr(code.meta, 'alt')
  if (!alt) throw new Error(`${path}: a mermaid block needs alt="..." after \`\`\`mermaid`)
  const key = diagramKey(code.value ?? '')
  const info = diagrams[key]
  if (!info) {
    throw new Error(
      `${path}: the mermaid diagram "${(code.value ?? '').trim().split('\n')[0]}" is not rendered. Run: pnpm diagrams`,
    )
  }

  const image = (theme: 'light' | 'dark'): MdNode => ({
    type: 'image',
    url: `/content/diagrams/${key}-${theme}.svg`,
    alt,
    data: {
      hProperties: {
        className: [`diagram-${theme}`],
        width: info.width,
        height: info.height,
      },
    },
  })
  const caption = attr(code.meta, 'caption')

  return {
    type: 'diagram',
    data: { hName: 'figure', hProperties: { className: ['diagram'] } },
    children: [
      image('light'),
      image('dark'),
      ...(caption
        ? [
            {
              type: 'diagramCaption',
              data: { hName: 'figcaption' },
              children: [{ type: 'text', value: caption }],
            },
          ]
        : []),
    ],
  }
}
