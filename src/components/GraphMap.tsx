import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  MarkerType,
  ReactFlow,
  ReactFlowProvider,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  useReactFlow,
} from '@xyflow/react';
import type { Node, Edge } from '@xyflow/react';
import dagre from 'dagre';
import type { RepoGraph, GraphNode } from '../lib/graph';
import type { RepoMap } from '../lib/analyze';
import { LANG_COLORS, formatBytes } from '../lib/analyze';
import { ExternalLink, MapPin, ChevronLeft, ChevronRight, X } from 'lucide-react';

const NODE_WIDTH = 210;
const NODE_HEIGHT = 120;
const GROUP_HEADER = 34;
const GROUP_PAD = 16;
const EDGE_CAP = 400;

type GraphMapProps = { map: RepoMap; graph: RepoGraph; dark: boolean };

function FileNode({ data, selected }: { data: { node: GraphNode; selected: boolean; highlighted: boolean }; selected: boolean }) {
  const node = data.node;
  const isSelected = data.selected ?? selected;
  const isHighlighted = data.highlighted ?? false;
  const langColor = LANG_COLORS[node.language] ?? '#8a949e';
  const isEntry = node.kind === 'entry';
  const isHub = node.kind === 'hub';
  const isBig = node.kind === 'big';
  const endpoint = node.isEndpoint;

  return (
    <div
      className={`rounded-[14px] border p-3 bg-raised transition-all duration-200 cursor-pointer ${
        isSelected
          ? 'ring-2 ring-accent border-accent bg-accent-soft shadow-[0_4px_12px_rgb(60_40_110/0.12),0_2px_4px_rgb(43_28_23/0.05)]'
          : isHighlighted
          ? 'ring-1 ring-accent/60 border-accent/60'
          : 'border-line-strong shadow-[0_1px_2px_rgb(60_40_110/0.07),0_1px_1px_rgb(43_28_23/0.04)] hover:border-accent/60 hover:shadow-[0_4px_12px_rgb(60_40_110/0.1),0_2px_4px_rgb(43_28_23/0.04)]'
      }`}
      style={{ width: NODE_WIDTH, height: NODE_HEIGHT }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') { /* handled by React Flow onNodeClick */ } }}
    >
      {/* Invisible handles: React Flow needs handle anchors to draw edges
          between nodes. The layout flows top-to-bottom (dagre TB), so the
          target is at the top and the source at the bottom. */}
      <Handle type="target" position={Position.Top} style={{ opacity: 0, pointerEvents: 'none' }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0, pointerEvents: 'none' }} />
      <div className="flex items-start gap-2 mb-1">
        <span className="h-2 w-2 rounded-full" style={{ background: langColor }} />
        {endpoint && (
          <span className="text-[10px] font-bold text-accent uppercase tracking-tighter px-1.5 py-0.5 rounded-full bg-accent-soft">
            endpoint
          </span>
        )}
      </div>
      <div className="font-mono text-[12px] font-semibold text-ink truncate" title={node.label}>
        {node.label}
      </div>
      <p className="text-[11px] text-muted line-clamp-2 mt-1">{node.description}</p>
      <div className="mt-auto flex items-center justify-between pt-2 border-t border-line/50">
        <span className="text-[10px] uppercase tracking-wider text-faint">{node.language}</span>
        <div className="flex gap-1">
          {isEntry && <span className="text-[10px] font-bold bg-ink text-paper px-1.5 py-0.5 rounded-full">ENTRY</span>}
          {isHub && <span className="text-[10px] font-bold bg-warn/10 text-warn border border-warn/30 px-1.5 py-0.5 rounded-full">HUB</span>}
          {isBig && <span className="text-[10px] font-bold bg-bad/10 text-bad border border-bad/30 px-1.5 py-0.5 rounded-full">BIG</span>}
        </div>
      </div>
    </div>
  );
}

function GroupNode({ data }: { data: { label: string; count: number } }) {
  return (
    <div className="h-full w-full rounded-[20px] border border-violet-200 bg-violet-50/70 px-3 pt-2 pb-1 dark:border-[#3d3460] dark:bg-[#241d3d]/70">
      <div className="flex items-center gap-2">
        <span className="font-display text-[14px] font-semibold tracking-tight text-ink">{data.label}</span>
        <span className="rounded-full border border-line-strong bg-raised px-2 py-0.5 text-[11px] font-semibold text-muted shadow-sm">
          {data.count} files
        </span>
      </div>
    </div>
  );
}

function GraphMapInner({ map, graph, dark }: GraphMapProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [tourStep, setTourStep] = useState(0);
  const [tourActive, setTourActive] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const reactFlowInstance = useReactFlow();
  const nodeTypes = useMemo(() => ({ fileNode: FileNode, groupNode: GroupNode }), []);

  const baseLayout = useMemo(() => {
    const { nodes: graphNodes, edges: graphEdges } = graph;
    if (graphNodes.length === 0) return { nodes: [] as Node[], edges: [] as Edge[] };

    const degreeMap = new Map<string, number>();
    for (const e of graphEdges) {
      degreeMap.set(e.from, (degreeMap.get(e.from) ?? 0) + 1);
      degreeMap.set(e.to, (degreeMap.get(e.to) ?? 0) + 1);
    }
    const cappedEdges = [...graphEdges]
      .sort((a, b) => {
        const da = (degreeMap.get(a.from) ?? 0) + (degreeMap.get(a.to) ?? 0);
        const db = (degreeMap.get(b.from) ?? 0) + (degreeMap.get(b.to) ?? 0);
        return db - da;
      })
      .slice(0, EDGE_CAP);

    const partNodes = new Map<string, GraphNode[]>();
    for (const n of graphNodes) {
      const arr = partNodes.get(n.partId) ?? [];
      arr.push(n);
      partNodes.set(n.partId, arr);
    }

    const sortedParts = [...partNodes.entries()].sort((a, b) => {
      const aEntry = a[1].some(n => n.kind === 'entry');
      const bEntry = b[1].some(n => n.kind === 'entry');
      if (aEntry !== bEntry) return aEntry ? -1 : 1;
      return b[1].length - a[1].length;
    });

    const partLayouts = new Map<string, { groupWidth: number; groupHeight: number; childPositions: Map<string, { x: number; y: number }> }>();
    let maxPartWidth = 200;

    for (const [partId, nodes] of sortedParts) {
      const g = new dagre.graphlib.Graph();
      g.setGraph({ rankdir: 'TB', nodesep: 28, ranksep: 44, marginx: 24, marginy: 24 });
      g.setDefaultEdgeLabel(() => ({}));

      const nodeSet = new Set(nodes.map(n => n.id));
      const partEdges = cappedEdges.filter(e => nodeSet.has(e.from) && nodeSet.has(e.to));

      for (const n of nodes) {
        g.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
      }
      for (const e of partEdges) {
        g.setEdge(e.from, e.to);
      }

      dagre.layout(g);

      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const n of nodes) {
        const pos = g.node(n.id);
        if (pos) {
          minX = Math.min(minX, pos.x - NODE_WIDTH / 2);
          minY = Math.min(minY, pos.y - NODE_HEIGHT / 2);
          maxX = Math.max(maxX, pos.x + NODE_WIDTH / 2);
          maxY = Math.max(maxY, pos.y + NODE_HEIGHT / 2);
        }
      }

      let groupWidth = Math.max(maxX - minX + 2 * GROUP_PAD, 200);
      let groupHeight = Math.max(maxY - minY + GROUP_HEADER + 2 * GROUP_PAD, 150);
      let childPositions = new Map(
        nodes.map(n => {
          const pos = g.node(n.id);
          // dagre gives CENTRE coordinates; React Flow positions nodes by
          // their TOP-LEFT corner, so subtract half the node size.
          return [n.id, { x: (pos?.x ?? 0) - NODE_WIDTH / 2 - minX + GROUP_PAD, y: (pos?.y ?? 0) - NODE_HEIGHT / 2 - minY + GROUP_HEADER + GROUP_PAD }];
        })
      );

      // A part with many unconnected files (e.g. 200 test files) makes
      // dagre put them all in one rank, exploding the group to tens of
      // thousands of px wide. Fall back to a compact grid for such parts
      // so every group stays roughly square and the whole map stays
      // readable. Nodes are ordered hubs-first so the important files
      // sit at the top-left of the grid.
      const MAX_GROUP_WIDTH = 1000;
      if (groupWidth > MAX_GROUP_WIDTH) {
        const ordered = [...nodes].sort((a, b) => b.degree - a.degree);
        const cols = Math.min(5, Math.ceil(Math.sqrt(ordered.length)));
        const gapX = 24;
        const gapY = 20;
        groupWidth = cols * NODE_WIDTH + (cols - 1) * gapX + 2 * GROUP_PAD;
        const rows = Math.ceil(ordered.length / cols);
        groupHeight = rows * NODE_HEIGHT + (rows - 1) * gapY + GROUP_HEADER + 2 * GROUP_PAD;
        childPositions = new Map(
          ordered.map((n, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            return [n.id, { x: GROUP_PAD + col * (NODE_WIDTH + gapX), y: GROUP_HEADER + GROUP_PAD + row * (NODE_HEIGHT + gapY) }];
          })
        );
      }

      partLayouts.set(partId, {
        groupWidth,
        groupHeight,
        childPositions,
      });

      maxPartWidth = Math.max(maxPartWidth, groupWidth);
    }

    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const partCols = Math.ceil(Math.sqrt(sortedParts.length));
    const partGap = 60;
    // Row heights: each row is as tall as its tallest group, so groups in
    // the same row never overlap vertically.
    const rowHeights: number[] = [];
    sortedParts.forEach(([partId], i) => {
      const row = Math.floor(i / partCols);
      const h = partLayouts.get(partId)!.groupHeight;
      rowHeights[row] = Math.max(rowHeights[row] ?? 0, h);
    });
    const rowTops: number[] = [];
    rowHeights.reduce((acc, h, r) => {
      rowTops[r] = acc;
      return acc + h + partGap;
    }, 0);

    sortedParts.forEach(([partId, partNodeList], i) => {
      const col = i % partCols;
      const row = Math.floor(i / partCols);
      const layout = partLayouts.get(partId)!;
      const groupX = col * (maxPartWidth + partGap);
      const groupY = rowTops[row];

      nodes.push({
        id: `group-${partId}`,
        type: 'groupNode',
        position: { x: groupX, y: groupY },
        data: { label: partId === '' ? 'Project root' : partId, count: partNodeList.length },
        width: layout.groupWidth,
        height: layout.groupHeight,
        className: 'group-node',
      });

      for (const n of partNodeList) {
        const pos = layout.childPositions.get(n.id);
        nodes.push({
          id: n.id,
          type: 'fileNode',
          position: { x: pos?.x ?? 0, y: pos?.y ?? 0 },
          parentId: `group-${partId}`,
          data: { node: n, selected: false, highlighted: false },
          width: NODE_WIDTH,
          height: NODE_HEIGHT,
        });
      }
    });

    for (const e of cappedEdges) {
      edges.push({
        id: `e-${e.from}-${e.to}`,
        source: e.from,
        target: e.to,
        animated: false,
      });
    }

    return { nodes, edges, entryPartId: sortedParts[0]?.[0] ?? '' };
  }, [graph]);

  const [nodes, setNodes, onNodesChange] = useNodesState(baseLayout.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(baseLayout.edges);

  useEffect(() => {
    setNodes(nds =>
      nds.map(n => {
        const isSelected = n.id === selectedNodeId;
        const isHighlighted = selectedNodeId ? edges.some(e => (e.source === selectedNodeId && e.target === n.id) || (e.target === selectedNodeId && e.source === n.id)) || n.id === selectedNodeId : false;
        return {
          ...n,
          data: { ...n.data, selected: isSelected, highlighted: isHighlighted },
        };
      })
    );
  }, [selectedNodeId, edges, setNodes]);

  useEffect(() => {
    setEdges(eds =>
      eds.map(e => {
        const isActive =
          e.source === selectedNodeId ||
          e.target === selectedNodeId ||
          e.source === hoveredNodeId ||
          e.target === hoveredNodeId;
        return {
          ...e,
          style: {
            stroke: isActive ? (dark ? '#a996f5' : '#6a52d9') : (dark ? '#4d4272' : '#b9aee8'),
            strokeWidth: isActive ? 2 : 1.5,
            opacity: isActive ? 1 : 0.9,
          },
          animated: isActive,
          markerEnd: MarkerType.Arrow,
        };
      })
    );
  }, [selectedNodeId, hoveredNodeId, dark, setEdges]);

  // Initial view: centre on the entry part (the part holding the entry
  // point) at a readable zoom, instead of fitting all ~150 nodes at once,
  // which would shrink every card to a dot. "Fit view" still fits all.
  useEffect(() => {
    const entryNodes = nodes
      .filter(n => n.parentId === `group-${baseLayout.entryPartId}`)
      .map(n => ({ id: n.id }));
    if (entryNodes.length > 0) {
      reactFlowInstance.fitView({ nodes: entryNodes, padding: 0.25, maxZoom: 0.85, duration: 0 });
    } else {
      reactFlowInstance.fitView({ padding: 0.1, duration: 0 });
    }
  }, [reactFlowInstance]);

  const searchMatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return graph.nodes.filter(
      n => n.label.toLowerCase().includes(q) || n.description.toLowerCase().includes(q)
    );
  }, [searchQuery, graph.nodes]);

  const selectedFile = useMemo(() => {
    if (!selectedNodeId) return null;
    return map.files.find(f => f.path === selectedNodeId) ?? null;
  }, [selectedNodeId, map.files]);

  const selectedGraphNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return graph.nodes.find(n => n.id === selectedNodeId) ?? null;
  }, [selectedNodeId, graph.nodes]);

  const onNodeClick = useCallback((id: string) => {
    setSelectedNodeId(id);
    setPanelOpen(true);
    reactFlowInstance.fitView({ nodes: [{ id }], duration: 300, maxZoom: 1.2 });
  }, [reactFlowInstance]);

  const onNodeMouseEnter = useCallback((id: string) => {
    setHoveredNodeId(id);
  }, []);

  const onNodeMouseLeave = useCallback(() => {
    setHoveredNodeId(null);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setHoveredNodeId(null);
    setPanelOpen(false);
  }, []);

  const onSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const onSearchEnter = useCallback(() => {
    const match = searchMatches[0];
    if (match) {
      setSelectedNodeId(match.id);
      setPanelOpen(true);
      reactFlowInstance.fitView({ nodes: [{ id: match.id }], duration: 300, maxZoom: 1.2 });
    }
  }, [searchMatches, reactFlowInstance]);

  const onFitView = useCallback(() => {
    reactFlowInstance.fitView({ padding: 0.1, duration: 500 });
  }, [reactFlowInstance]);

  const onTourStart = useCallback(() => {
    setTourActive(true);
    setTourStep(0);
  }, []);

  const onTourPrev = useCallback(() => {
    setTourStep(prev => Math.max(prev - 1, 0));
  }, []);

  const onTourNext = useCallback(() => {
    const next = tourStep + 1;
    if (next < map.startHere.length) {
      setTourStep(next);
      const step = map.startHere[next];
      const node = graph.nodes.find(n => n.id === step.path);
      if (node) {
        setSelectedNodeId(node.id);
        setPanelOpen(true);
        reactFlowInstance.fitView({ nodes: [{ id: node.id }], duration: 300, maxZoom: 1.2 });
      } else {
        setSelectedNodeId(null);
        reactFlowInstance.fitView({ padding: 0.1, duration: 300 });
      }
    }
  }, [tourStep, map.startHere, graph.nodes, reactFlowInstance]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-accent" />
            <h3 className="text-base font-semibold text-ink">Dependency graph</h3>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onFitView} className="shrink-0 whitespace-nowrap rounded-full border border-line-strong bg-raised px-3.5 py-1.5 text-sm font-semibold text-ink shadow-sm hover:bg-accent-soft transition-colors">
              Fit view
            </button>
            <button onClick={onTourStart} className="shrink-0 whitespace-nowrap rounded-full border border-line-strong bg-raised px-3.5 py-1.5 text-sm font-semibold text-ink shadow-sm hover:bg-accent-soft transition-colors">
              Start tour
            </button>
          </div>
        </div>

        <div className="relative mt-3">
          <input
            value={searchQuery}
            onChange={onSearchChange}
            onKeyDown={(e) => { if (e.key === 'Enter') onSearchEnter(); }}
            placeholder="Search files or descriptions…"
            className="input w-full"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-faint hover:text-ink">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {tourActive && map.startHere.length > 0 && (
          <div className="panel mt-3 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-faint">
                  Start here — step {tourStep + 1} of {map.startHere.length}
                </p>
                <p className="text-sm font-semibold text-ink">{map.startHere[tourStep].path}</p>
                <p className="text-sm text-muted">{map.startHere[tourStep].reason}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={tourStep === 0}
                  onClick={onTourPrev}
                  className="rounded-full border border-line-strong bg-raised px-2.5 py-1 text-sm text-ink shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent-soft transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={onTourNext}
                  className="rounded-full bg-ink px-2.5 py-1 text-sm font-bold text-paper hover:opacity-90 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="mt-2 h-1.5 bg-violet-100 dark:bg-[#332a5e] rounded-full overflow-hidden">
              <div
                className="h-full bg-accent transition-all duration-300"
                style={{ width: `${((tourStep + 1) / map.startHere.length) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        <div className="flex-1 min-h-0 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={(_, node) => onNodeClick(node.id)}
            onNodeMouseEnter={(_, node) => onNodeMouseEnter(node.id)}
            onNodeMouseLeave={onNodeMouseLeave}
            onPaneClick={onPaneClick}
            panOnScroll={true}
            minZoom={0.05}
            fitView
            fitViewOptions={{ padding: 0.12, maxZoom: 1 }}
            defaultEdgeOptions={{ markerEnd: MarkerType.Arrow }}
            className="w-full h-full"
          >
            <Background
              variant={dark ? BackgroundVariant.Cross : BackgroundVariant.Dots}
              gap={dark ? 16 : 24}
              size={dark ? 1 : 2}
              color={dark ? '#3d3460' : '#ddd3f5'}
            />
            <Controls />
            {/* Minimap only on tablet/desktop — at 360px it covers the nodes.
                Styled explicitly: group boxes render faint, files in the
                accent colour, on a bordered card — otherwise it renders as
                a washed-out grey smudge overlapping the graph. */}
            <div className="hidden sm:block">
              <MiniMap
                pannable={false}
                zoomable={false}
                position="bottom-right"
                nodeColor={(node) =>
                  node.type === 'groupNode'
                    ? 'rgba(201,188,255,0.4)'
                    : dark ? '#a996f5' : '#6a52d9'
                }
                nodeStrokeColor={(node) =>
                  node.type === 'groupNode'
                    ? 'rgba(122,100,224,0.6)'
                    : dark ? '#a996f5' : '#6a52d9'
                }
                bgColor={dark ? '#171226' : '#fffdf8'}
                maskColor={dark ? 'rgba(23,18,38,0.55)' : 'rgba(255,253,248,0.5)'}
                style={{
                  width: 168,
                  height: 112,
                  borderRadius: 14,
                  border: `1px solid ${dark ? '#4d4272' : '#d9ccd5'}`,
                  overflow: 'hidden',
                }}
              />
            </div>
          </ReactFlow>
        </div>
        {panelOpen && selectedFile && selectedGraphNode && (
          <aside className="md:w-96 border-l border-line-strong bg-paper shadow-[0_18px_40px_rgb(60_40_110/0.16)] flex flex-col h-full">
            <div className="p-4 border-b border-line flex items-center justify-between">
              <button onClick={() => setPanelOpen(false)} className="rounded-full text-faint hover:text-ink hover:bg-accent-soft p-1.5">
                <span className="sr-only">Close detail</span>
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto">
              <div className="flex items-start gap-3 mb-3">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ background: LANG_COLORS[selectedFile.language] ?? '#8a949e' }} />
                <div>
                  <h3 className="font-mono text-sm font-semibold text-ink truncate">{selectedFile.name}</h3>
                  <p className="text-[12px] text-muted truncate" title={selectedFile.path}>{selectedFile.path}</p>
                </div>
              </div>
              <p className="text-sm text-muted mb-4">{selectedFile.description}</p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <span className="w-20 text-muted">Language</span>
                  <span className="text-ink">{selectedFile.language}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="w-20 text-muted">Size</span>
                  <span className="text-ink">{formatBytes(selectedFile.size)}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="w-20 text-muted">In / Out</span>
                  <span className="text-ink">{selectedGraphNode.inDegree} / {selectedGraphNode.outDegree}</span>
                </div>
                {selectedFile.imports.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-faint mb-1">Imports</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedFile.imports.map(i => (
                        <code key={i} className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs text-ink">{i}</code>
                      ))}
                    </div>
                  </div>
                )}
                {selectedFile.exports.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-faint mb-1">Provides</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedFile.exports.map(e => (
                        <code key={e} className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs text-ink">{e}</code>
                      ))}
                    </div>
                  </div>
                )}
                {selectedFile.size > 500_000 && (
                  <div className="mt-3 p-3 rounded-md bg-bad/5 border border-bad/20">
                    <p className="text-sm text-bad">Large file warning — {formatBytes(selectedFile.size)}</p>
                  </div>
                )}
                <a
                  href={`https://github.com/${map.meta.fullName}/blob/${map.meta.defaultBranch}/${selectedFile.path}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 flex items-center gap-1.5 text-sm text-accent hover:underline"
                >
                  <ExternalLink className="h-4 w-4" /> View on GitHub
                </a>
              </div>
            </div>
          </aside>
        )}
      </div>

      <div className="px-4 pt-2 pb-4 overflow-x-auto">
        <div className="flex gap-2">
          {graph.partOrder.map(partId => {
            const part = map.parts.find(p => p.id === partId);
            if (!part) return null;
            const isHighlighted = selectedNodeId && map.files.some(f => f.path === selectedNodeId && f.dir.split('/')[0] === partId);
            return (
              <button
                key={partId}
                onClick={() => {
                  const partNodes = map.files.filter(f => f.dir.split('/')[0] === partId);
                  if (partNodes.length > 0) {
                    setSelectedNodeId(partNodes[0].path);
                    setPanelOpen(true);
                    reactFlowInstance.fitView({ nodes: [{ id: partNodes[0].path }], duration: 300, maxZoom: 1.2 });
                  }
                }}
                className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-semibold shadow-sm transition-colors ${
                  isHighlighted
                    ? 'bg-ink border-ink text-paper'
                    : 'bg-raised border-line-strong text-ink hover:bg-accent-soft'
                }`}
              >
                <span className="h-2 w-2 rounded-full shrink-0" style={{ background: LANG_COLORS[part.files[0]?.language ?? ''] ?? '#8a949e' }} />
                {part.name} ({part.files.length})
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function GraphMap(props: GraphMapProps) {
  return (
    <ReactFlowProvider>
      <GraphMapInner {...props} />
    </ReactFlowProvider>
  );
}
