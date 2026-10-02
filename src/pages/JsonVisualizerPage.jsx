import React, { useEffect, useMemo, useRef, useState } from "react";
import { Box, Typography, Tabs, Tab, useMediaQuery, Snackbar } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
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

  const debounceRef = useRef(null);
  const canvasRef = useRef(null);
  const layoutRequestRef = useRef(0);

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
      }}
    >
      <JsonEditor value={input} onChange={handleInputChange} errorLine={error?.line ?? null} />
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
        sx={{
          flex: 1,
          minHeight: { xs: 480, md: 600 },
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
              <Panel defaultSize={42} minSize={20}>
                {editorPane}
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
