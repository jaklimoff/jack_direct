import { getImageInfo } from './images'

// Minimal hast shapes, enough for this plugin
interface Element {
  type: 'element'
  tagName: string
  properties: Record<string, unknown>
  children: Node[]
}
type Node = Element | { type: string; children?: Node[] }

const isElement = (node: Node): node is Element => node.type === 'element'

/**
 * Post body images: lazy load, add width/height so the layout does not jump,
 * and serve the WebP copy from scripts/optimize-images.mjs when there is one.
 */
export function rehypeOptimizedImages() {
  return (tree: Node) => walk(tree)
}

function walk(node: Node) {
  if (!node.children) return
  node.children = node.children.map((child) => {
    if (isElement(child) && child.tagName === 'img') return optimize(child)
    walk(child)
    return child
  })
}

function optimize(img: Element): Element {
  img.properties.loading ??= 'lazy'
  img.properties.decoding ??= 'async'

  const info = getImageInfo(String(img.properties.src ?? ''))
  if (!info) return img

  img.properties.width ??= info.width
  img.properties.height ??= info.height

  return {
    type: 'element',
    tagName: 'picture',
    properties: {},
    children: [
      {
        type: 'element',
        tagName: 'source',
        properties: { srcSet: info.webp, type: 'image/webp' },
        children: [],
      },
      img,
    ],
  }
}
