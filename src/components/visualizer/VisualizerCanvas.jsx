import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Box, IconButton, Tooltip, Typography, useTheme } from "@mui/material";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
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
      onFullscreenChange,
    },
    ref
  ) => {
    const theme = useTheme();
    const rfInstanceRef = useRef(null);
    const nodesByIdRef = useRef(new Map());
    const fullscreenContainerRef = useRef(null);
    const [zoomPct, setZoomPct] = useState(100);
    // Two independent flags because they're driven by two independent
    // mechanisms: the native flag mirrors the browser's own fullscreenchange
    // event (so it stays in sync with Esc, which the browser handles on its
    // own); the fallback flag is CSS-only state we own entirely, used when
    // the Fullscreen API is unsupported or rejects (e.g. iframes without
    // `allow="fullscreen"`, some mobile browsers).
    const [isNativeFullscreen, setIsNativeFullscreen] = useState(false);
    const [isFallbackFullscreen, setIsFallbackFullscreen] = useState(false);
    const isFullscreen = isNativeFullscreen || isFallbackFullscreen;

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
      // So JsonVisualizerPage can redirect NodeDetailModal's Dialog portal
      // here while in full screen -- a Dialog portaled to its default
      // document.body root would be invisible, since the browser only
      // presents the fullscreen element (and its descendants) on screen.
      getFullscreenContainer: () => fullscreenContainerRef.current,
    }));

    // Mirrors the browser's own fullscreenchange event (fired on Esc, the
    // browser/OS fullscreen UI, etc.) so the icon and NodeDetailModal's
    // portal target stay correct even when the user didn't use our button
    // to exit.
    useEffect(() => {
      const handleFullscreenChange = () => {
        setIsNativeFullscreen(document.fullscreenElement === fullscreenContainerRef.current);
      };
      document.addEventListener("fullscreenchange", handleFullscreenChange);
      return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
    }, []);

    // The CSS-only fallback path has no browser-level Esc handling of its
    // own (unlike the native Fullscreen API), so wire it up ourselves.
    useEffect(() => {
      if (!isFallbackFullscreen) return undefined;
      const handleKeyDown = (e) => {
        if (e.key === "Escape") setIsFallbackFullscreen(false);
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isFallbackFullscreen]);

    useEffect(() => {
      onFullscreenChange?.(isFullscreen);
    }, [isFullscreen, onFullscreenChange]);

    // React Flow needs the container's *new* size to actually land before
    // fitView can frame correctly -- same short-delay pattern used
    // elsewhere in this app for the mobile tab switch and the editor
    // collapse/expand toggle (immediate fitView can still race the
    // ResizeObserver that reports the resize to React Flow).
    useEffect(() => {
      const id = setTimeout(() => rfInstanceRef.current?.fitView({ padding: 0.15 }), 150);
      return () => clearTimeout(id);
    }, [isFullscreen]);

    const handleToggleFullscreen = async () => {
      if (document.fullscreenElement) {
        try {
          await document.exitFullscreen();
        } catch {
          // Nothing more we can do -- leave the UI as-is.
        }
        return;
      }
      if (isFallbackFullscreen) {
        setIsFallbackFullscreen(false);
        return;
      }

      const el = fullscreenContainerRef.current;
      if (el && document.fullscreenEnabled && el.requestFullscreen) {
        try {
          await el.requestFullscreen();
          return; // the fullscreenchange listener above picks up the new state
        } catch {
          // Rejected (permissions policy, user gesture requirements in some
          // embeds, etc.) -- fall through to the CSS-only fallback below.
        }
      }
      setIsFallbackFullscreen(true);
    };

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
      <Box
        ref={fullscreenContainerRef}
        sx={
          isFallbackFullscreen
            ? {
                // The native Fullscreen API handles filling the screen (and
                // its own backdrop) on its own -- this branch only applies
                // when falling back to a plain CSS overlay instead.
                position: "fixed",
                inset: 0,
                zIndex: (t) => t.zIndex.modal + 1,
                bgcolor: "background.default",
              }
            : {
                flex: 1,
                position: "relative",
                minHeight: 0,
                // Explicit rather than inherited: the browser's default
                // fullscreen backdrop is black, which would otherwise show
                // through if this element itself had no background of its
                // own once native fullscreen is active.
                bgcolor: "background.default",
              }
        }
      >
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

        <Tooltip title={isFullscreen ? "Exit full screen" : "Enter full screen"}>
          <IconButton
            size="small"
            onClick={handleToggleFullscreen}
            aria-label={isFullscreen ? "Exit full screen" : "Enter full screen"}
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              zIndex: 5,
              background: theme.palette.background.paper,
              border: 1,
              borderColor: "divider",
              "&:hover": { background: theme.palette.action.hover },
            }}
          >
            {isFullscreen ? <FullscreenExitIcon fontSize="small" /> : <FullscreenIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Box>
    );
  }
);

VisualizerCanvas.displayName = "VisualizerCanvas";

export default VisualizerCanvas;
