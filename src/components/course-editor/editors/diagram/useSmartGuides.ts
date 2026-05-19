import { useCallback, useState } from 'react';
import type { Node, NodeChange } from '@xyflow/react';

export interface GuideLine {
  type: 'vertical' | 'horizontal';
  pos: number;
}

const SNAP_THRESHOLD = 8;
const GRID_SIZE = 12;

interface AlignResult {
  diff: number;
  snapTo: number;
  guidePos: number;
}

function getNodeBounds(node: Node) {
  const isJunction = node.type === 'junction';
  const fallbackW = isJunction ? 12 : 150;
  const fallbackH = isJunction ? 12 : 40;
  const w = (node.measured?.width ?? (node as any).width) || fallbackW;
  const h = (node.measured?.height ?? (node as any).height) || fallbackH;
  return {
    left: node.position.x,
    right: node.position.x + w,
    centerX: node.position.x + w / 2,
    top: node.position.y,
    bottom: node.position.y + h,
    centerY: node.position.y + h / 2,
    width: w,
    height: h,
  };
}

function calculateGuides(draggedNode: Node, allNodes: Node[]) {
  const d = getNodeBounds(draggedNode);
  const lines: GuideLine[] = [];
  let bestX: AlignResult | null = null;
  let bestY: AlignResult | null = null;

  for (const node of allNodes) {
    if (node.id === draggedNode.id) continue;
    const o = getNodeBounds(node);

    // X-axis alignment checks (vertical guide lines)
    const xChecks: AlignResult[] = [
      { diff: Math.abs(d.centerX - o.centerX), snapTo: o.centerX - d.width / 2, guidePos: o.centerX },
      { diff: Math.abs(d.left - o.left), snapTo: o.left, guidePos: o.left },
      { diff: Math.abs(d.right - o.right), snapTo: o.right - d.width, guidePos: o.right },
      { diff: Math.abs(d.left - o.right), snapTo: o.right, guidePos: o.right },
      { diff: Math.abs(d.right - o.left), snapTo: o.left - d.width, guidePos: o.left },
    ];
    for (const c of xChecks) {
      if (c.diff < SNAP_THRESHOLD && (!bestX || c.diff < bestX.diff)) bestX = c;
    }

    // Y-axis alignment checks (horizontal guide lines)
    const yChecks: AlignResult[] = [
      { diff: Math.abs(d.centerY - o.centerY), snapTo: o.centerY - d.height / 2, guidePos: o.centerY },
      { diff: Math.abs(d.top - o.top), snapTo: o.top, guidePos: o.top },
      { diff: Math.abs(d.bottom - o.bottom), snapTo: o.bottom - d.height, guidePos: o.bottom },
      { diff: Math.abs(d.top - o.bottom), snapTo: o.bottom, guidePos: o.bottom },
      { diff: Math.abs(d.bottom - o.top), snapTo: o.top - d.height, guidePos: o.top },
    ];
    for (const c of yChecks) {
      if (c.diff < SNAP_THRESHOLD && (!bestY || c.diff < bestY.diff)) bestY = c;
    }
  }

  if (bestX) lines.push({ type: 'vertical', pos: bestX.guidePos });
  if (bestY) lines.push({ type: 'horizontal', pos: bestY.guidePos });

  return { snapX: bestX?.snapTo, snapY: bestY?.snapTo, lines };
}

export function useSmartGuides() {
  const [guideLines, setGuideLines] = useState<GuideLine[]>([]);

  const applySmartSnap = useCallback(
    (changes: NodeChange[], currentNodes: Node[]): NodeChange[] => {
      let newLines: GuideLine[] = [];

      const result = changes.map((change) => {
        if (change.type === 'position' && change.position) {
          const node = currentNodes.find((n) => n.id === change.id);
          if (node) {
            const tempNode = { ...node, position: change.position };
            const { snapX, snapY, lines } = calculateGuides(tempNode, currentNodes);
            // Only show guide lines while actively dragging
            if (change.dragging) newLines = lines;
            return {
              ...change,
              position: {
                x: snapX !== undefined ? snapX : Math.round(change.position.x / GRID_SIZE) * GRID_SIZE,
                y: snapY !== undefined ? snapY : Math.round(change.position.y / GRID_SIZE) * GRID_SIZE,
              },
            };
          }
        }
        return change;
      });

      setGuideLines(newLines);
      return result;
    },
    []
  );

  const clearGuides = useCallback(() => {
    setGuideLines([]);
  }, []);

  return { guideLines, applySmartSnap, clearGuides };
}
