export type TreeNode<T extends { id: number }> = T & {
  children?: TreeNode<T>[]
}

export function buildTreeByParentId<T extends { id: number; parentId?: number | null }>(items: T[]): TreeNode<T>[] {
  const map = new Map<number, TreeNode<T>>()
  const roots: TreeNode<T>[] = []

  items.forEach((item) => {
    map.set(item.id, { ...item, children: [] })
  })

  items.forEach((item) => {
    const node = map.get(item.id)
    if (!node) return

    const parentId = item.parentId ?? null
    if (parentId === null || !map.has(parentId)) {
      roots.push(node)
      return
    }

    const parent = map.get(parentId)
    if (parent && parent.children) {
      parent.children.push(node)
    }
  })

  return roots
}

export function flattenTreeNodeIds<T extends { id: number; children?: T[] }>(nodes: T[]): number[] {
  const result: number[] = []

  nodes.forEach((node) => {
    result.push(node.id)
    if (node.children && node.children.length > 0) {
      result.push(...flattenTreeNodeIds(node.children))
    }
  })

  return result
}
