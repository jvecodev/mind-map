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
  Handle,
  Position,
  EdgeLabelRenderer,
  BaseEdge,
  getStraightPath,
} from "reactflow"
import "reactflow/dist/style.css"
import { Plus, Trash, ZoomIn, ZoomOut, Maximize, Minimize, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface TopicNodeProps {
  data: {
    label: string;
    onNodeLabelChange: (newLabel: string) => void;
    onAddChild: () => void;
    onDelete: () => void;
  };
  isConnectable: boolean;
}

const TopicNode = ({ data, isConnectable }: TopicNodeProps) => {
  return (
    <div>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-indigo-500 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-indigo-500 border-2 border-white"
      />
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-indigo-500 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-indigo-500 border-2 border-white"
      />

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
    </div>
  )
}

import { EdgeProps, MarkerType } from "reactflow";

const CustomEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style = {},
  data,
  markerEnd,
  selected,
}: EdgeProps & { data?: { onDelete: (id: string) => void } }) => {
  const [edgePath, labelX, labelY] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  })

  return (
    <>
      <path
        id={id + "-hitbox"}
        d={edgePath}
        fill="none"
        strokeWidth={20}
        stroke="transparent"
        strokeOpacity={0}
        style={{ cursor: "pointer" }}
      />

      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeWidth: selected ? 3 : 2,
          stroke: selected ? "#ff9500" : style.stroke || "#6366f1",
        }}
      />

      <path
        id={id + "-hover"}
        d={edgePath}
        fill="none"
        strokeWidth={4}
        stroke="#ff9500"
        strokeOpacity={0}
        style={{
          cursor: "pointer",
          transition: "stroke-opacity 0.2s",
        }}
        className="hover:stroke-opacity-30"
      />

      {selected && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
              background: "white",
              borderRadius: "50%",
              zIndex: 1000,
            }}
            className="nodrag nopan"
          >
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="destructive" className="h-6 w-6" onClick={() => data.onDelete(id)}>
                    <X className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Remover conexão</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}


const nodeTypes = {
  topic: TopicNode,
}


const edgeTypes = {
  custom: CustomEdge,
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
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)


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

  const deleteEdge = useCallback(
    (edgeId: string) => {
      setEdges((eds) => eds.filter((edge) => edge.id !== edgeId))
      setSelectedEdge(null)
    },
    [setEdges],
  )

  const onConnect = useCallback(
    (params: Connection | Edge) => {

      const edge = {
        ...params,
        type: "custom",
        animated: true,
        data: {
          onDelete: (id: string) => deleteEdge(id),
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#6366f1",
        },
        style: { stroke: "#6366f1", strokeWidth: 2 },
      }
      setEdges((eds) => addEdge(edge as Edge, eds))
    },
    [setEdges, deleteEdge],
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
        type: "custom",
        animated: true,
        data: {
          onDelete: deleteEdge,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#6366f1",
        },
        style: { stroke: "#6366f1", strokeWidth: 2 },
      }

      setNodes((nds) => [...nds, newNode])
      setEdges((eds) => [...eds, newEdge])
    },
    [nodes, setNodes, setEdges, handleNodeLabelChange, deleteEdge],
  )


  const deleteNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((node) => node.id !== nodeId))
      setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId))
      if (selectedNode === nodeId) {
        setSelectedNode(null)
      }
    },
    [setNodes, setEdges, selectedNode],
  )


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

  // Handle zoom controls
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


  const onNodeClick = (_: React.MouseEvent, node: { id: string }) => {
    setSelectedNode(node.id)
    setSelectedEdge(null)
  }


  const onEdgeClick = (_: React.MouseEvent, edge: Edge) => {
    setSelectedEdge(edge.id)
    setSelectedNode(null)
  }


  const onPaneClick = () => {
    setSelectedNode(null)
    setSelectedEdge(null)
  }

  const onKeyDown = (event: React.KeyboardEvent) => {

    if ((event.key === "Delete" || event.key === "Backspace") && selectedEdge) {
      deleteEdge(selectedEdge)
    }
  }

  return (
    <div ref={reactFlowWrapper} className="w-full h-full" tabIndex={0} onKeyDown={onKeyDown}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        minZoom={0.2}
        maxZoom={4}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        defaultEdgeOptions={{
          type: "custom",
          animated: true,
          data: {
            onDelete: deleteEdge,
          },
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
          <div className="flex flex-col p-2 bg-white border rounded-md shadow-sm">
            <div className="mb-2 text-sm font-medium">Como usar:</div>
            <ol className="pl-5 mb-2 text-xs text-muted-foreground list-decimal">
              <li>Clique e arraste a partir de um ponto azul (handle)</li>
              <li>Solte sobre outro ponto azul para criar uma conexão</li>
              <li>Clique em uma conexão para selecioná-la</li>
              <li>Clique no botão X ou pressione Delete para remover</li>
            </ol>
            <div className="p-1 text-xs text-indigo-600 bg-indigo-50 rounded">
              Dica: Passe o mouse sobre as conexões para destacá-las
            </div>
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
