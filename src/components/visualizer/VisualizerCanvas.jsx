import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Box, Fade, IconButton, Slider, Tooltip, Typography, useMediaQuery, useTheme } from "@mui/material";
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

// Ctrl on Windows/Linux, ⌘ on macOS -- matches the zoomActivationKeyCode
// below (React Flow's own default is already "Meta" on macOS / "Control"
// elsewhere, so this is just for the hint's wording).
const isMacPlatform = () => {
  if (typeof navigator === "undefined") return false;
  const platform = navigator.userAgentData?.platform ?? navigator.platform ?? "";
  return /mac/i.test(platform);
};

const SCROLL_HINT_DURATION_MS = 1500;

// Must match the <ReactFlow> minZoom/maxZoom props below -- the slider maps
// its 0-100 track onto exactly that range.
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 2;

// A log scale reads better for zoom than linear: equal slider distance ==
// equal *perceived* (multiplicative) zoom change, matching how zooming
// actually feels (10%->20% is as big a visual jump as 100%->200%, not the
// tiny one a linear scale would give it at the low end) -- the same curve
// wheel-zoom and pinch-zoom already use internally (scale by a constant
// factor per step/pixel, not a constant absolute amount).
const zoomToSliderValue = (zoom) => {
  const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
  return (Math.log(clamped / MIN_ZOOM) / Math.log(MAX_ZOOM / MIN_ZOOM)) * 100;
};

const sliderValueToZoom = (value) => MIN_ZOOM * Math.pow(MAX_ZOOM / MIN_ZOOM, value / 100);

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
    const isNarrowViewport = useMediaQuery(theme.breakpoints.down("md"));
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

    // A plain wheel over the canvas is meant to scroll the *page* (see the
    // ReactFlow props below), which can look like nothing happened if the
    // user expected it to zoom -- this hint tells them how to actually zoom.
    // Not needed in full screen, where plain wheel zooms directly again.
    const [showScrollHint, setShowScrollHint] = useState(false);
    const scrollHintTimeoutRef = useRef(null);

    useEffect(() => () => clearTimeout(scrollHintTimeoutRef.current), []);

    // The slider's position is *derived* from zoomPct (set by onMove below,
    // which React Flow fires for every viewport change regardless of
    // source: drag, wheel, pinch, the +/- buttons, fitView, or this slider
    // itself) rather than tracked as its own independent state -- that's
    // what keeps it in sync with every other way of zooming for free, and
    // rules out a feedback loop entirely: MUI's Slider only fires onChange
    // from real user interaction, never from its `value` prop changing
    // programmatically, so re-deriving this on every zoomPct update can
    // never itself trigger another onChange.
    const zoomSliderValue = zoomToSliderValue(zoomPct / 100);
    const zoomSliderRafRef = useRef(null);
    useEffect(() => () => cancelAnimationFrame(zoomSliderRafRef.current), []);

    // rAF-throttled (MUI fires onChange many times per drag gesture) and
    // deliberately instant (no duration passed to zoomTo) -- animating a
    // transition on every intermediate drag tick would fight the user's own
    // in-progress drag and feel laggy rather than direct.
    const handleZoomSliderChange = (_, value) => {
      cancelAnimationFrame(zoomSliderRafRef.current);
      zoomSliderRafRef.current = requestAnimationFrame(() => {
        // zoomTo() with no target point zooms around the current viewport
        // center (it delegates to d3-zoom's scaleTo, which defaults to the
        // pane's center when no point is given) -- the same center-
        // preserving behavior the +/- buttons already get from zoomIn/
        // zoomOut, so dragging the slider doesn't drift the viewport.
        rfInstanceRef.current?.zoomTo(sliderValueToZoom(value));
      });
    };

    const handleCanvasWheel = (e) => {
      if (isFullscreen || e.ctrlKey || e.metaKey) return;
      setShowScrollHint(true);
      clearTimeout(scrollHintTimeoutRef.current);
      scrollHintTimeoutRef.current = setTimeout(() => setShowScrollHint(false), SCROLL_HINT_DURATION_MS);
    };

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
        onWheel={handleCanvasWheel}
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
            minZoom={MIN_ZOOM}
            maxZoom={MAX_ZOOM}
            proOptions={{ hideAttribution: true }}
            colorMode={theme.palette.mode}
            // Outside full screen: a plain wheel does neither zoom nor pan
            // (zoomOnScroll/panOnScroll both false) and preventScrolling is
            // false, so React Flow's own wheel handler lets the event fall
            // through uninterrupted -- it bubbles to the page, which scrolls
            // normally instead of being trapped over the canvas. Ctrl/Cmd+
            // wheel (and trackpad pinch, which browsers report as a wheel
            // event with ctrlKey set) still zooms regardless of zoomOnScroll
            // here: React Flow's own zoomActivationKeyCode handling takes
            // over whenever that key is held, independent of this prop --
            // confirmed directly from @xyflow/system's source
            // (xypanzoom/filter.js's `zoomActivationKeyPressed || zoomOnScroll`
            // and the wheel handler's `!event.ctrlKey` check), not just from
            // the public docs. In full screen there's no page to scroll
            // underneath, so plain wheel goes back to zooming directly.
            zoomOnScroll={isFullscreen}
            panOnScroll={false}
            zoomOnPinch
            zoomActivationKeyCode={["Control", "Meta"]}
            preventScrolling={isFullscreen}
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

        {(isFullscreen || !isNarrowViewport) && (
          <Box
            // React Flow's own helper classes: "nodrag"/"nopan" stop a drag
            // that starts on this panel from panning the canvas underneath
            // it, "nowheel" stops React Flow's own wheel handling from
            // engaging here. Our *own* page-scroll wheel handler is on an
            // ancestor Box though (plain DOM bubbling, unrelated to React
            // Flow's internal class-based filtering) so it's stopped
            // separately below via stopPropagation.
            className="nodrag nopan nowheel"
            onWheel={(e) => e.stopPropagation()}
            sx={{
              position: "absolute",
              left: 10,
              // Stacked directly above React Flow's own Controls panel
              // (bottom-left, ~10px inset, 3 stacked 26px buttons = ~78px
              // tall by default with showInteractive={false}), same width/
              // alignment/background so it reads as part of the same
              // control stack.
              bottom: 10 + 78 + 8,
              zIndex: 5,
              width: 26,
              height: 112,
              py: 1.5,
              display: "flex",
              justifyContent: "center",
              borderRadius: 1,
              background: theme.palette.background.paper,
              border: 1,
              borderColor: "divider",
              boxShadow: 1,
            }}
          >
            <Slider
              orientation="vertical"
              min={0}
              max={100}
              value={zoomSliderValue}
              onChange={handleZoomSliderChange}
              aria-label="Zoom"
              getAriaValueText={(value) => `${Math.round(sliderValueToZoom(value) * 100)}%`}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${Math.round(sliderValueToZoom(value) * 100)}%`}
              size="small"
              sx={{ height: "100%" }}
            />
          </Box>
        )}

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

        <Fade in={showScrollHint} timeout={{ enter: 150, exit: 400 }}>
          <Box
            sx={{
              position: "absolute",
              top: 8,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 5,
              px: 1.5,
              py: 0.5,
              borderRadius: 1,
              background: theme.palette.background.paper,
              border: 1,
              borderColor: "divider",
              fontSize: 12,
              color: "text.secondary",
              pointerEvents: "none",
              boxShadow: 1,
            }}
          >
            Use {isMacPlatform() ? "⌘" : "Ctrl"} + scroll to zoom
          </Box>
        </Fade>
      </Box>
    );
  }
);

VisualizerCanvas.displayName = "VisualizerCanvas";

export default VisualizerCanvas;
