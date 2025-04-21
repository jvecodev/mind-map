"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  ReactFlowProvider,
  Panel,
  useReactFlow,
  type Connection,
  type Edge,
  EdgeMarkerType,
  ConnectionMode,
  MarkerType,
} from "reactflow"
import "reactflow/dist/style.css"
import { Plus, Trash, ZoomIn, ZoomOut, Maximize, Minimize, Link } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Toggle } from "@/components/ui/toggle"

interface TopicNodeProps {
  data: {
    label: string;
    onNodeLabelChange: (newLabel: string) => void;
    onAddChild: () => void;
    onDelete: () => void;
  };
}

const TopicNode = ({ data }: TopicNodeProps) => {
  return (
    <div className="relative">
      <Card className="min-w-[180px] p-4 border-2 shadow-md transition-all duration-300 hover:shadow-lg">
        <div className="flex flex-col gap-2">
          <Input
            value={data.label}
            onChange={(e) => data.onNodeLabelChange(e.target.value)}
            className="font-medium text-center bg-transparent border-none focus-visible:ring-1"
          />
          <div className="flex justify-center gap-2 mt-2">
            <Button
              size="sm"
              variant="outline"
              className="flex items-center gap-1 px-2 py-1 h-7"
              onClick={data.onAddChild}
            >
              <Plus className="w-3 h-3" /> Subtopic
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex items-center gap-1 px-2 py-1 h-7 text-red-500 hover:text-red-600"
              onClick={data.onDelete}
            >
              <Trash className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </Card>
      {/* Handles for connections - these are the connection points */}
      <div
        className="absolute top-1/2 left-0 w-3 h-3 bg-indigo-500 rounded-full -translate-x-1/2 -translate-y-1/2 border-2 border-white"
        style={{ zIndex: 1000 }}
      />
      <div
        className="absolute top-1/2 right-0 w-3 h-3 bg-indigo-500 rounded-full translate-x-1/2 -translate-y-1/2 border-2 border-white"
        style={{ zIndex: 1000 }}
      />
      <div
        className="absolute top-0 left-1/2 w-3 h-3 bg-indigo-500 rounded-full -translate-x-1/2 -translate-y-1/2 border-2 border-white"
        style={{ zIndex: 1000 }}
      />
      <div
        className="absolute bottom-0 left-1/2 w-3 h-3 bg-indigo-500 rounded-full -translate-x-1/2 translate-y/1/2 border-2 border-white"
        style={{ zIndex: 1000 }}
      />
    </div>
  )
}

// Node types definition
const nodeTypes = {
  topic: TopicNode,
}

export default function MindMap() {
  return (
    <div className="w-full h-screen bg-white">
      <ReactFlowProvider>
        <MindMapContent />
      </ReactFlowProvider>
    </div>
  )
}

function MindMapContent() {
  const reactFlowWrapper = useRef<HTMLDivElement | null>(null)
  const reactFlowInstance = useReactFlow()

  const initialNodes = [
    {
      id: "1",
      type: "topic",
      data: { label: "Tópico Principal" },
      position: { x: 250, y: 5 },
    },
  ]

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [connectionMode, setConnectionMode] = useState(false)

  const handleNodeLabelChange = useCallback(
    (nodeId: string, newLabel: string) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                label: newLabel,
              },
            }
          }
          return node
        }),
      )
    },
    [setNodes],
  )

  const onConnect = useCallback(
    (params: Connection | Edge) => {
      const edge = {
        ...params,
        animated: true,
          type: MarkerType.ArrowClosed,
        markerEnd: {
          type: "arrowclosed",
          color: "#6366f1",
        } as EdgeMarkerType, 
        style: { stroke: "#6366f1", strokeWidth: 2 },
      }
      setEdges((eds) => addEdge(edge, eds))
    },
    [setEdges],
  )

  const addChildNode = useCallback(
    (parentId: string) => {
      const parentNode = nodes.find((node) => node.id === parentId)
      if (!parentNode) return

      const newNodeId = `${Date.now()}`
      const newNode = {
        id: newNodeId,
        type: "topic",
        data: {
          label: "Novo Subtópico",
          onNodeLabelChange: (newLabel: string) => handleNodeLabelChange(newNodeId, newLabel),
          onAddChild: () => addChildNode(newNodeId),
          onDelete: () => deleteNode(newNodeId),
        },
        position: {
          x: parentNode.position.x + Math.random() * 100,
          y: parentNode.position.y + 100,
        },
      }

      const newEdge = {
        id: `e${parentId}-${newNodeId}`,
        source: parentId,
        target: newNodeId,
        animated: true,
        type: "default",
        markerEnd: {
          type: "arrowclosed",
          color: "#6366f1",
        } as EdgeMarkerType,
        style: { stroke: "#6366f1", strokeWidth: 2 },
      }

      setNodes((nds) => [...nds, newNode])
      setEdges((eds) => [...eds, newEdge])
    },
    [nodes, setNodes, setEdges, handleNodeLabelChange],
  )

  // Delete a node and its connected edges
  const deleteNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((node) => node.id !== nodeId))
      setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId))
    },
    [setNodes, setEdges],
  )

  // Add a new main topic
  const addMainTopic = useCallback(() => {
    const newNodeId = `${Date.now()}`
    const newNode = {
      id: newNodeId,
      type: "topic",
      data: {
        label: "Novo Tópico",
        onNodeLabelChange: (newLabel: string) => handleNodeLabelChange(newNodeId, newLabel),
        onAddChild: () => addChildNode(newNodeId),
        onDelete: () => deleteNode(newNodeId),
      },
      position: {
        x: Math.random() * 300 + 100,
        y: Math.random() * 100,
      },
    }

    setNodes((nds) => [...nds, newNode])
  }, [setNodes, addChildNode, deleteNode, handleNodeLabelChange])

  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          onNodeLabelChange: (newLabel: string) => handleNodeLabelChange(node.id, newLabel),
          onAddChild: () => addChildNode(node.id),
          onDelete: () => deleteNode(node.id),
        },
      })),
    )
  }, [])

  const zoomIn = () => {
    reactFlowInstance.zoomIn()
  }

  const zoomOut = () => {
    reactFlowInstance.zoomOut()
  }

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (reactFlowWrapper.current && reactFlowWrapper.current.requestFullscreen) {
        reactFlowWrapper.current.requestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
    setIsFullscreen(!isFullscreen)
  }

  // Toggle connection mode
  const toggleConnectionMode = () => {
    setConnectionMode(!connectionMode)
  }

  // Handle node selection
  const onNodeClick = (_: React.MouseEvent, node: { id: string }) => {
    setSelectedNode(node.id)
  }

  // Handle pane click (deselect)
  const onPaneClick = () => {
    setSelectedNode(null)
  }

  return (
    <div ref={reactFlowWrapper} className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.2}
        connectionMode={ConnectionMode.Loose}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        defaultEdgeOptions={{
          animated: true,
          type: "default",
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: "#6366f1",
          },
          style: { stroke: "#6366f1", strokeWidth: 2 },
        }}
      >
        <Background color="#aaa" gap={16} />
        <Controls showInteractive={false} />
        <MiniMap
          nodeStrokeColor={(n) => {
            return n.id === selectedNode ? "#6366f1" : "#555"
          }}
          nodeColor={(n) => {
            return n.id === selectedNode ? "#e0e7ff" : "#f9fafb"
          }}
        />

        <Panel position="top-left" className="flex flex-col gap-2">
          <Button onClick={addMainTopic} className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> Adicionar Tópico
          </Button>
          <div className="flex items-center gap-2 p-2 bg-white border rounded-md shadow-sm">
            <Toggle
              pressed={connectionMode}
              onPressedChange={toggleConnectionMode}
              className={`${connectionMode ? "bg-indigo-100 text-indigo-600" : ""}`}
            >
              <Link className="w-4 h-4 mr-1" />
              Modo Conexão
            </Toggle>
            <span className="text-xs text-muted-foreground">
              {connectionMode
                ? "Clique e arraste de um ponto azul para outro nó"
                : "Ative para criar conexões entre nós"}
            </span>
          </div>
        </Panel>

        <Panel position="bottom-right" className="flex gap-2">
          <Button size="sm" variant="outline" onClick={zoomIn} className="p-2">
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={zoomOut} className="p-2">
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={toggleFullscreen} className="p-2">
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </Button>
        </Panel>
      </ReactFlow>
    </div>
  )
}
