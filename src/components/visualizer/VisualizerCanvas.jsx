import React, { forwardRef, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Box, Typography, useTheme } from "@mui/material";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import VisualizerNode from "./VisualizerNode";

const NODE_TYPES = { jsonNode: VisualizerNode };

// Wraps <ReactFlow>, owning pan/zoom/fit controls and translating the
// positioned {nodes, edges} graph (from jsonGraph + jsonGraphLayout) into
// React Flow's node/edge shape. Exposes zoomIn/zoomOut/fitView/centerOnNode
// imperatively via ref so the menu bar/search box (outside the canvas tree)
// can drive the viewport.
const VisualizerCanvas = forwardRef(
  (
    {
      graph,
      direction = "RIGHT",
      collapsedIds,
      onToggleCollapse,
      onNodeActivate,
      searchMatchIds,
      activeMatchId,
    },
    ref
  ) => {
    const theme = useTheme();
    const rfInstanceRef = useRef(null);
    const nodesByIdRef = useRef(new Map());
    const [zoomPct, setZoomPct] = useState(100);

    const hasChildNodesById = useMemo(() => {
      const map = new Map();
      graph.edges.forEach((edge) => map.set(edge.source, true));
      return map;
    }, [graph.edges]);

    const rfNodes = useMemo(() => {
      nodesByIdRef.current = new Map(graph.nodes.map((n) => [n.id, n]));
      return graph.nodes.map((node) => ({
        id: node.id,
        type: "jsonNode",
        position: { x: node.x, y: node.y },
        connectable: false,
        data: {
          id: node.id,
          label: node.label,
          type: node.type,
          rows: node.rows,
          childCount: node.childCount,
          path: node.path,
          isRoot: node.id === "root",
          hasChildNodes: !!hasChildNodesById.get(node.id),
          collapsed: collapsedIds.has(node.id),
          onToggleCollapse,
          onActivate: onNodeActivate,
          isSearchMatch: searchMatchIds?.has(node.id) ?? false,
          isActiveMatch: node.id === activeMatchId,
          direction,
        },
      }));
    }, [graph.nodes, hasChildNodesById, collapsedIds, onToggleCollapse, onNodeActivate, searchMatchIds, activeMatchId, direction]);

    const rfEdges = useMemo(
      () =>
        graph.edges.map((edge) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          label: edge.label,
          type: "smoothstep",
          style: { stroke: theme.palette.divider },
          labelStyle: { fill: theme.palette.text.secondary, fontSize: 11 },
          labelBgStyle: { fill: theme.palette.background.paper },
        })),
      [graph.edges, theme.palette.divider, theme.palette.text.secondary, theme.palette.background.paper]
    );

    useImperativeHandle(ref, () => ({
      zoomIn: () => rfInstanceRef.current?.zoomIn({ duration: 150 }),
      zoomOut: () => rfInstanceRef.current?.zoomOut({ duration: 150 }),
      fitView: () => rfInstanceRef.current?.fitView({ duration: 200, padding: 0.15 }),
      centerOnNode: (id) => {
        const node = nodesByIdRef.current.get(id);
        const instance = rfInstanceRef.current;
        if (!node || !instance) return;
        instance.setCenter(node.x + (node.width || 0) / 2, node.y + (node.height || 0) / 2, {
          zoom: Math.max(instance.getZoom(), 0.75),
          duration: 300,
        });
      },
    }));

    if (!graph.nodes.length) {
      return (
        <Box
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "text.secondary",
          }}
        >
          <Typography variant="body2">Enter valid JSON to see the graph.</Typography>
        </Box>
      );
    }

    return (
      <Box sx={{ flex: 1, position: "relative", minHeight: 0 }}>
        <ReactFlowProvider>
          <ReactFlow
            nodes={rfNodes}
            edges={rfEdges}
            nodeTypes={NODE_TYPES}
            onInit={(instance) => {
              rfInstanceRef.current = instance;
              setTimeout(() => instance.fitView({ padding: 0.15 }), 0);
            }}
            onMove={(_, viewport) => setZoomPct(Math.round(viewport.zoom * 100))}
            minZoom={0.1}
            maxZoom={2}
            proOptions={{ hideAttribution: true }}
            colorMode={theme.palette.mode}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={16}
              size={1}
              color={theme.palette.divider}
            />
            <Controls showInteractive={false} />
          </ReactFlow>
        </ReactFlowProvider>

        <Box
          sx={{
            position: "absolute",
            bottom: 8,
            // Bottom-left is where React Flow's own zoom/fit-view <Controls>
            // render -- placing this badge there too clipped/overlapped the
            // fit-view button. Bottom-right is empty (attribution is
            // hidden via proOptions.hideAttribution).
            right: 8,
            px: 1,
            py: 0.25,
            borderRadius: 1,
            background: theme.palette.background.paper,
            border: 1,
            borderColor: "divider",
            fontSize: 12,
            color: "text.secondary",
            zIndex: 5,
          }}
        >
          {zoomPct}%
        </Box>
      </Box>
    );
  }
);

VisualizerCanvas.displayName = "VisualizerCanvas";

export default VisualizerCanvas;
