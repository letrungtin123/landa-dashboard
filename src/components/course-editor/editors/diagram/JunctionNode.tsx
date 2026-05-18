import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

function JunctionNode() {
  return (
    <div 
      className="w-3 h-3 bg-muted-foreground hover:bg-primary rounded-full shadow-md transition-colors group relative cursor-crosshair ring-2 ring-background hover:scale-125"
      title="Điểm nối (Junction)"
    >
      {/* Target handles allow incoming connections */}
      <Handle
        type="target"
        position={Position.Top}
        id="top-target"
        className="w-2 h-2 opacity-0 group-hover:opacity-100 transition-opacity bg-primary"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left-target"
        className="w-2 h-2 opacity-0 group-hover:opacity-100 transition-opacity bg-primary"
      />
      {/* Source handles allow outgoing connections */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom-source"
        className="w-2 h-2 opacity-0 group-hover:opacity-100 transition-opacity bg-primary"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right-source"
        className="w-2 h-2 opacity-0 group-hover:opacity-100 transition-opacity bg-primary"
      />
    </div>
  );
}

export default memo(JunctionNode);
