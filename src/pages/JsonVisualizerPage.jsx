import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Box, Typography, Tabs, Tab, useMediaQuery, Snackbar, IconButton, Tooltip } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import KeyboardDoubleArrowLeftIcon from "@mui/icons-material/KeyboardDoubleArrowLeft";
import KeyboardDoubleArrowRightIcon from "@mui/icons-material/KeyboardDoubleArrowRight";
import JsonEditor from "../components/JsonEditor";
import VisualizerMenuBar from "../components/visualizer/VisualizerMenuBar";
import VisualizerCanvas from "../components/visualizer/VisualizerCanvas";
import VisualizerStatusBar from "../components/visualizer/VisualizerStatusBar";
import NodeDetailModal from "../components/visualizer/NodeDetailModal";
import { validateAndFormatJSON, EMPTY_INPUT_MESSAGE } from "../utils/jsonUtils";
import { jsonToGraph, filterCollapsedGraph, searchGraphNodes, DEFAULT_MAX_NODES } from "../utils/jsonGraph";
import { layoutGraph } from "../utils/jsonGraphLayout";
import usePageTitle from "../hooks/usePageTitle";

const EMPTY_INPUT_ERROR = { message: EMPTY_INPUT_MESSAGE };
const EMPTY_BASE_GRAPH = { nodes: [], edges: [], nodeCount: 0, truncated: false };
const DEBOUNCE_MS = 500;

// Floor for the workspace height on very short windows -- below this the
// editor/graph panes and status bar stop being usable, so we'd rather let
// the page scroll a little than shrink further.
const MIN_WORKSPACE_HEIGHT = 420;

// Shown on first load so the graph is visible immediately instead of an
// empty "paste your JSON" state -- mirrors jsoncrack.com's default sample.
const SAMPLE_JSON = JSON.stringify(
  {
    id: 1,
    name: "Ada Lovelace",
    active: true,
    address: {
      city: "London",
      country: "UK",
    },
    skills: ["JavaScript", "React", "Node.js"],
    projects: [
      { name: "Analytical Engine", year: 1843 },
      { name: "Notes on the Engine", year: 1843 },
    ],
  },
  null,
  2
);

// JSON Visualizer: Monaco editor on one side, an interactive node-graph
// (React Flow + elkjs layout) on the other. Follows the same lifted-state
// + debounced-derive-output pattern as JsonFormatterPage/JsonDiffPage, but
// scoped to its own page component (not src/App.js state) since it's
// self-contained to this one route.
const JsonVisualizerPage = ({ title, description }) => {
  usePageTitle(title);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [input, setInput] = useState(SAMPLE_JSON);
  const [rootValue, setRootValue] = useState(null);
  const [baseGraph, setBaseGraph] = useState(EMPTY_BASE_GRAPH);
  const [positionedGraph, setPositionedGraph] = useState({ nodes: [], edges: [] });
  const [error, setError] = useState(null);
  const [sizeBytes, setSizeBytes] = useState(0);
  const [liveTransform, setLiveTransform] = useState(true);
  const [collapsedIds, setCollapsedIds] = useState(new Set());
  const [direction, setDirection] = useState("RIGHT");
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);
  const [mobileTab, setMobileTab] = useState("editor");
  const [dropError, setDropError] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isEditorCollapsed, setIsEditorCollapsed] = useState(false);
  const [isGraphFullscreen, setIsGraphFullscreen] = useState(false);
  const [workspaceHeight, setWorkspaceHeight] = useState(MIN_WORKSPACE_HEIGHT);

  const debounceRef = useRef(null);
  const canvasRef = useRef(null);
  const layoutRequestRef = useRef(0);
  const editorPanelRef = useRef(null);
  const workspaceRef = useRef(null);

  // Size the workspace (menu bar + split panes + status bar) to exactly
  // fill the viewport below it -- like jsoncrack.com/editor -- instead of a
  // fixed minHeight, so the status bar is never pushed below the fold. A
  // fixed px height (rather than e.g. `calc(100vh - 220px)`) is the most
  // robust option here: the offset above the workspace isn't a constant --
  // it depends on the header's actual rendered height and whether the page
  // title/description wraps to more lines at a given width -- so measuring
  // the real DOM offset is the only way to get an exact fit at every
  // viewport size, rather than a guessed constant that's wrong as soon as
  // content wraps differently. `useLayoutEffect` (not `useEffect`) runs the
  // first measurement before the browser paints, so the workspace never
  // flashes at the wrong height on load.
  useLayoutEffect(() => {
    const updateWorkspaceHeight = () => {
      const el = workspaceRef.current;
      if (!el || typeof window === "undefined") return;
      const rect = el.getBoundingClientRect();
      // rect.top is relative to the *current* scroll position; adding
      // scrollY reconstructs the workspace's offset from the top of the
      // document, which is what "fits the viewport below it" actually
      // means (and keeps the computed height stable regardless of
      // whatever the current scroll position happens to be).
      const documentTop = rect.top + window.scrollY;
      const available = window.innerHeight - documentTop;
      setWorkspaceHeight(Math.max(MIN_WORKSPACE_HEIGHT, Math.floor(available)));
    };

    updateWorkspaceHeight();
    // Custom webfonts (JetBrains Mono / Inter) can still be loading at
    // first paint and shift the title/description's wrapped height once
    // they do -- re-measure once they're confirmed ready, in addition to
    // the synchronous first pass above.
    document.fonts?.ready?.then(updateWorkspaceHeight).catch(() => {});

    window.addEventListener("resize", updateWorkspaceHeight);
    return () => window.removeEventListener("resize", updateWorkspaceHeight);
  }, []);

  // Input editor always mirrors exactly what the user typed; only the
  // debounced graph is derived from it, so the input is never rewritten
  // out from under the user while they're typing (same guarantee as
  // JsonFormatterPage's debounce).
  const runTransform = (raw) => {
    if (!raw.trim()) {
      setBaseGraph(EMPTY_BASE_GRAPH);
      setRootValue(null);
      setError(EMPTY_INPUT_ERROR);
      setSizeBytes(0);
      return;
    }

    const result = validateAndFormatJSON(raw);
    if (!result.valid) {
      setBaseGraph(EMPTY_BASE_GRAPH);
      setRootValue(null);
      setError(result.error);
      setSizeBytes(new Blob([raw]).size);
      return;
    }

    const parsed = JSON.parse(raw);
    const graph = jsonToGraph(parsed, { maxNodes: DEFAULT_MAX_NODES });
    setRootValue(parsed);
    setBaseGraph(graph);
    setError(null);
    setSizeBytes(new Blob([raw]).size);
  };

  // Transform the sample JSON once on mount so the graph renders immediately
  // instead of waiting on the debounce (which only fires from user typing).
  useEffect(() => {
    runTransform(input);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // On mobile, both tab panes are always mounted but the inactive one sits
  // behind display:none, so React Flow's own on-mount fitView runs against
  // a zero-size container and leaves the viewport zoomed out in a corner.
  // Re-fit whenever the Graph tab actually becomes visible.
  useEffect(() => {
    if (!isMobile || mobileTab !== "graph") return;
    // A single rAF isn't enough -- React Flow tracks its container size via
    // ResizeObserver, which hasn't necessarily fired yet by the next frame
    // after the display:none -> flex toggle, so an immediate fitView() can
    // still compute against a stale zero-size container. A short delay lets
    // the observer catch up.
    const id = setTimeout(() => canvasRef.current?.fitView(), 150);
    return () => clearTimeout(id);
  }, [isMobile, mobileTab]);

  // Same "fitView needs the container's new size to actually land" story as
  // the mobile tab effect above, but for collapsing/expanding the editor
  // panel: the graph pane's width changes (grows when the editor collapses,
  // shrinks back when it expands), so re-fit shortly after so the graph
  // keeps looking intentionally framed instead of off-center.
  const refitGraphSoon = () => {
    setTimeout(() => canvasRef.current?.fitView(), 150);
  };

  // react-resizable-panels drives collapse state itself (including
  // snapping to collapsed when the handle is dragged past minSize) -- these
  // callbacks just mirror that into React state for the rail UI/icon below,
  // they don't drive the collapse themselves.
  const handleEditorPanelCollapse = () => {
    setIsEditorCollapsed(true);
    refitGraphSoon();
  };
  const handleEditorPanelExpand = () => {
    setIsEditorCollapsed(false);
    refitGraphSoon();
  };

  const handleToggleEditorCollapse = () => {
    const panel = editorPanelRef.current;
    if (!panel) return;
    if (panel.isCollapsed()) panel.expand();
    else panel.collapse();
  };

  // Optional Ctrl/Cmd+B shortcut for the collapse toggle -- only acts when
  // the keydown target is outside the Monaco editor itself, so it can never
  // intercept or fight any key handling Monaco does internally.
  useEffect(() => {
    if (isMobile) return undefined;

    const handleKeyDown = (e) => {
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== "b") return;
      if (e.target?.closest?.(".monaco-editor")) return;
      e.preventDefault();
      handleToggleEditorCollapse();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobile]);

  const handleInputChange = (val) => {
    setInput(val);
    if (!liveTransform) return;

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runTransform(val), DEBOUNCE_MS);
  };

  const handleTransformNow = () => {
    clearTimeout(debounceRef.current);
    runTransform(input);
  };

  const handleToggleLiveTransform = (checked) => {
    setLiveTransform(checked);
    clearTimeout(debounceRef.current);
    if (checked) runTransform(input);
  };

  // Re-run layout (off-thread-ish via elkjs, async) whenever the parsed
  // graph, collapse state, or layout direction changes -- never on
  // unrelated re-renders (e.g. opening the node modal), and never from
  // typing directly (that only updates `input`).
  useEffect(() => {
    const filtered = filterCollapsedGraph(baseGraph, collapsedIds);

    // Always bump the request id first, even on the early-return path below
    // -- otherwise a still-in-flight layoutGraph() promise from a *previous*
    // non-empty graph keeps the request id it captured, its guard check
    // passes once it resolves, and it overwrites the just-cleared graph
    // with stale positioned nodes (e.g. sample JSON loads, async layout
    // kicks off, user immediately types invalid JSON -- the old graph could
    // flash back in once the stale promise settles).
    const requestId = ++layoutRequestRef.current;

    // Skip the async elkjs round trip entirely when there's nothing to lay
    // out (initial mount, empty input, invalid JSON) -- avoids a pending
    // microtask outliving a quick successive state change.
    if (filtered.nodes.length === 0) {
      setPositionedGraph({ nodes: [], edges: [] });
      return;
    }

    layoutGraph(filtered.nodes, filtered.edges, { direction }).then((positionedNodes) => {
      if (layoutRequestRef.current !== requestId) return; // a newer request superseded this one
      setPositionedGraph({ nodes: positionedNodes, edges: filtered.edges });
    });
  }, [baseGraph, collapsedIds, direction]);

  const handleToggleCollapse = (id) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandableNodeIds = useMemo(
    () => new Set(baseGraph.edges.map((e) => e.source)),
    [baseGraph.edges]
  );

  const handleExpandAll = () => setCollapsedIds(new Set());
  const handleCollapseAll = () => setCollapsedIds(new Set(expandableNodeIds));

  const handleNew = () => {
    clearTimeout(debounceRef.current);
    setInput("");
    setBaseGraph(EMPTY_BASE_GRAPH);
    setRootValue(null);
    setError(null);
    setCollapsedIds(new Set());
    setSelectedNodeId(null);
    setSearchTerm("");
    setSizeBytes(0);
  };

  const handleImportFile = (content) => {
    setInput(content);
    clearTimeout(debounceRef.current);
    runTransform(content);
  };

  // Drag-and-drop a file straight onto the editor pane, mirroring the
  // "Import file" button in VisualizerMenuBar (non-JSON content still loads
  // -- the status bar below reports the parse error, same as a bad paste).
  const handleEditorDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleEditorDragLeave = () => setIsDragOver(false);

  const handleEditorDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => handleImportFile(reader.result);
    reader.onerror = () => {
      setDropError(`Could not read "${file.name}" — the file may be unreadable or too large.`);
    };
    reader.readAsText(file);
  };

  const handleDownload = () => {
    if (!input.trim()) return;
    const result = validateAndFormatJSON(input);
    const text = result.valid ? result.formatted : input;
    const url = URL.createObjectURL(new Blob([text], { type: "application/json;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "data.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const matchIds = useMemo(
    () => searchGraphNodes(positionedGraph.nodes, searchTerm),
    [positionedGraph.nodes, searchTerm]
  );
  const searchMatchIds = useMemo(() => new Set(matchIds), [matchIds]);
  const activeMatchId = matchIds[activeMatchIndex] || null;

  useEffect(() => {
    setActiveMatchIndex(0);
    if (matchIds.length > 0) {
      canvasRef.current?.centerOnNode(matchIds[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const handleSearchNext = () => {
    if (matchIds.length === 0) return;
    const next = (activeMatchIndex + 1) % matchIds.length;
    setActiveMatchIndex(next);
    canvasRef.current?.centerOnNode(matchIds[next]);
  };

  const handleSearchPrev = () => {
    if (matchIds.length === 0) return;
    const next = (activeMatchIndex - 1 + matchIds.length) % matchIds.length;
    setActiveMatchIndex(next);
    canvasRef.current?.centerOnNode(matchIds[next]);
  };

  const selectedNode = useMemo(
    () => positionedGraph.nodes.find((n) => n.id === selectedNodeId) || null,
    [positionedGraph.nodes, selectedNodeId]
  );

  const editorPane = (
    <Box
      onDragOver={handleEditorDragOver}
      onDragLeave={handleEditorDragLeave}
      onDrop={handleEditorDrop}
      sx={{
        flex: 1,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        outline: isDragOver ? "2px dashed" : "none",
        outlineColor: "primary.main",
        outlineOffset: -4,
        // Stays mounted (not unmounted) while the editor panel is collapsed,
        // so Monaco's model/undo stack survives -- visibility:hidden (rather
        // than unmounting) keeps it out of the tab order and accessibility
        // tree too, on top of the opaque rail overlay already covering it
        // visually.
        visibility: isEditorCollapsed ? "hidden" : "visible",
      }}
    >
      <JsonEditor
        value={input}
        onChange={handleInputChange}
        errorLine={error?.line ?? null}
        headerAction={
          // Omitted (rather than just visually hidden) once collapsed -- the
          // editor pane stays mounted underneath the rail overlay for
          // content/undo-state preservation, so without this check a
          // "Collapse editor" button that's covered and unreachable by
          // sighted users would still sit in the keyboard tab order.
          !isMobile &&
          !isEditorCollapsed && (
            <Tooltip title="Collapse editor">
              <IconButton size="small" onClick={handleToggleEditorCollapse} aria-label="Collapse editor">
                <KeyboardDoubleArrowLeftIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )
        }
      />
    </Box>
  );

  const graphPane = (
    <Box sx={{ flex: 1, height: "100%", display: "flex", flexDirection: "column", minHeight: 0 }}>
      <VisualizerCanvas
        ref={canvasRef}
        graph={positionedGraph}
        direction={direction}
        collapsedIds={collapsedIds}
        onToggleCollapse={handleToggleCollapse}
        onNodeActivate={setSelectedNodeId}
        searchMatchIds={searchMatchIds}
        activeMatchId={activeMatchId}
        onFullscreenChange={setIsGraphFullscreen}
      />
    </Box>
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <Typography variant="h5" component="h2" sx={{ fontWeight: 700 }}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 720 }}>
          {description}
        </Typography>
      )}

      <Box
        ref={workspaceRef}
        sx={{
          flexShrink: 0,
          height: workspaceHeight,
          display: "flex",
          flexDirection: "column",
          border: 1,
          borderColor: "divider",
          borderRadius: 1,
          overflow: "hidden",
        }}
      >
        <VisualizerMenuBar
          onNew={handleNew}
          onImportFile={handleImportFile}
          onDownload={handleDownload}
          canDownload={!!input.trim()}
          direction={direction}
          onDirectionChange={setDirection}
          onExpandAll={handleExpandAll}
          onCollapseAll={handleCollapseAll}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          matchCount={matchIds.length}
          activeMatchIndex={activeMatchIndex}
          onSearchNext={handleSearchNext}
          onSearchPrev={handleSearchPrev}
          onZoomIn={() => canvasRef.current?.zoomIn()}
          onZoomOut={() => canvasRef.current?.zoomOut()}
          onFitView={() => canvasRef.current?.fitView()}
        />

        {isMobile && (
          <Tabs value={mobileTab} onChange={(e, v) => setMobileTab(v)} variant="fullWidth">
            <Tab label="Editor" value="editor" />
            <Tab label="Graph" value="graph" />
          </Tabs>
        )}

        <Box sx={{ flex: 1, display: "flex", minHeight: 0 }}>
          {isMobile ? (
            <>
              <Box sx={{ display: mobileTab === "editor" ? "flex" : "none", flex: 1, minHeight: 0 }}>
                {editorPane}
              </Box>
              <Box sx={{ display: mobileTab === "graph" ? "flex" : "none", flex: 1, minHeight: 0 }}>
                {graphPane}
              </Box>
            </>
          ) : (
            <PanelGroup
              direction="horizontal"
              style={{ flexGrow: 1, flexShrink: 1, flexBasis: 0, minHeight: 0, height: "auto" }}
            >
              <Panel
                ref={editorPanelRef}
                defaultSize={42}
                minSize={20}
                collapsible
                collapsedSize={4}
                onCollapse={handleEditorPanelCollapse}
                onExpand={handleEditorPanelExpand}
              >
                <Box sx={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", minHeight: 0 }}>
                  {editorPane}
                  {isEditorCollapsed && (
                    <Box
                      sx={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 2,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        pt: 1.5,
                        gap: 1.5,
                        bgcolor: "background.paper",
                        borderRight: 1,
                        borderColor: "divider",
                      }}
                    >
                      <Tooltip title="Expand editor" placement="right">
                        <IconButton size="small" onClick={handleToggleEditorCollapse} aria-label="Expand editor">
                          <KeyboardDoubleArrowRightIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Typography
                        variant="caption"
                        sx={{
                          writingMode: "vertical-rl",
                          transform: "rotate(180deg)",
                          color: "text.secondary",
                          letterSpacing: 0.5,
                          userSelect: "none",
                        }}
                      >
                        Input JSON
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Panel>
              <PanelResizeHandle
                style={{
                  width: 6,
                  cursor: "col-resize",
                  background: theme.palette.divider,
                }}
              />
              <Panel defaultSize={58} minSize={25}>
                {graphPane}
              </Panel>
            </PanelGroup>
          )}
        </Box>

        <VisualizerStatusBar
          error={error}
          nodeCount={baseGraph.nodeCount}
          truncated={baseGraph.truncated}
          sizeBytes={sizeBytes}
          liveTransform={liveTransform}
          onToggleLiveTransform={handleToggleLiveTransform}
          onTransformNow={handleTransformNow}
        />
      </Box>

      <NodeDetailModal
        open={!!selectedNode}
        node={selectedNode}
        rootValue={rootValue}
        onClose={() => setSelectedNodeId(null)}
        // The browser only presents the full-screen element (and its
        // descendants) while the graph canvas is full screen -- redirect
        // the Dialog's portal there so it's still visible; falls back to
        // the Modal's normal document.body root the rest of the time.
        container={isGraphFullscreen ? canvasRef.current?.getFullscreenContainer?.() : undefined}
      />

      <Snackbar
        open={!!dropError}
        onClose={() => setDropError(null)}
        autoHideDuration={5000}
        message={dropError ? `❌ ${dropError}` : ""}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Box>
  );
};

export default JsonVisualizerPage;
