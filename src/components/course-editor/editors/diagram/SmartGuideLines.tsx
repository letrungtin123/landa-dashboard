import React from 'react';
import { useViewport } from '@xyflow/react';
import type { GuideLine } from './useSmartGuides';

interface SmartGuideLinesProps {
  guideLines: GuideLine[];
}

/**
 * Renders visual alignment guide lines (dashed blue lines) on the ReactFlow canvas.
 * Must be rendered as a child of <ReactFlow>.
 */
export default function SmartGuideLines({ guideLines }: SmartGuideLinesProps) {
  const { x, y, zoom } = useViewport();

  if (guideLines.length === 0) return null;

  return (
    <svg
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 5,
      }}
    >
      {guideLines.map((line, i) => {
        if (line.type === 'vertical') {
          const sx = line.pos * zoom + x;
          return (
            <line
              key={`v-${i}`}
              x1={sx}
              y1={0}
              x2={sx}
              y2="100%"
              stroke="#3b82f6"
              strokeWidth={1.5}
              strokeDasharray="6 3"
              opacity={0.7}
            />
          );
        }
        const sy = line.pos * zoom + y;
        return (
          <line
            key={`h-${i}`}
            x1={0}
            y1={sy}
            x2="100%"
            y2={sy}
            stroke="#3b82f6"
            strokeWidth={1.5}
            strokeDasharray="6 3"
            opacity={0.7}
          />
        );
      })}
    </svg>
  );
}
