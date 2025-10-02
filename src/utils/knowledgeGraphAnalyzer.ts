// Knowledge Graph Analysis Utilities

interface GraphNode {
  id: string;
  type: 'project' | 'task' | 'goal' | 'knowledge' | 'persona' | 'integration';
  label: string;
  connections: string[];
  metadata: Record<string, any>;
}

interface GraphConnection {
  id: string;
  from: string;
  to: string;
  type: 'contains' | 'supports' | 'informs' | 'assigned' | 'related';
  strength: number;
}

interface GraphAnalysis {
  totalNodes: number;
  totalConnections: number;
  nodesByType: Record<string, number>;
  averageConnections: number;
  mostConnectedNodes: Array<{ id: string; label: string; connections: number }>;
  isolatedNodes: Array<{ id: string; label: string }>;
  clusters: Array<{ nodes: string[]; strength: number }>;
}

interface AIInsight {
  type: string;
  message: string;
  action?: () => void;
  actionLabel?: string;
  priority: 'low' | 'medium' | 'high';
}

export const analyzeKnowledgeGraph = (
  nodes: GraphNode[],
  connections: GraphConnection[],
  userContext?: {
    activeProjects: number;
    overdueTasks: number;
    completedGoals: number;
  }
): Promise<AIInsight[]> => {
  return new Promise((resolve) => {
    // Simulate AI analysis delay
    setTimeout(() => {
      const insights: AIInsight[] = [];

      // Basic graph metrics
      const totalNodes = nodes.length;
      const totalConnections = connections.length;
      const nodesByType = nodes.reduce((acc, node) => {
        acc[node.type] = (acc[node.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Connection analysis
      const connectionCounts = nodes.map(node => ({
        id: node.id,
        label: node.label,
        connections: node.connections.length
      }));

      const averageConnections = connectionCounts.reduce((sum, node) => sum + node.connections, 0) / totalNodes;
      const mostConnectedNodes = connectionCounts
        .sort((a, b) => b.connections - a.connections)
        .slice(0, 3);
      
      const isolatedNodes = connectionCounts.filter(node => node.connections === 0);

      // Generate insights based on analysis
      
      // 1. Overall structure insights
      if (totalNodes > 0) {
        insights.push({
          type: 'Structure',
          message: `Your knowledge graph contains ${totalNodes} entities with ${totalConnections} relationships.`,
          priority: 'low'
        });
      }

      // 2. Connection density insights
      if (averageConnections < 2) {
        insights.push({
          type: 'Opportunity',
          message: 'Your knowledge items have few connections. Consider linking related projects and tasks.',
          priority: 'medium'
        });
      } else if (averageConnections > 5) {
        insights.push({
          type: 'Pattern',
          message: 'High connectivity detected. Your knowledge graph shows strong relationships between entities.',
          priority: 'low'
        });
      }

      // 3. Isolated nodes insights
      if (isolatedNodes.length > 0) {
        insights.push({
          type: 'Recommendation',
          message: `${isolatedNodes.length} items are not connected to any projects. Consider organizing them.`,
          priority: 'medium'
        });
      }

      // 4. Most connected nodes insights
      if (mostConnectedNodes.length > 0) {
        const topNode = mostConnectedNodes[0];
        insights.push({
          type: 'Hub',
          message: `"${topNode.label}" is your most connected entity with ${topNode.connections} relationships.`,
          priority: 'low'
        });
      }

      // 5. Type distribution insights
      const projectCount = nodesByType.project || 0;
      const taskCount = nodesByType.task || 0;
      const goalCount = nodesByType.goal || 0;
      const knowledgeCount = nodesByType.knowledge || 0;

      if (taskCount > projectCount * 5) {
        insights.push({
          type: 'Balance',
          message: 'You have many tasks relative to projects. Consider consolidating or creating new projects.',
          priority: 'medium'
        });
      }

      if (knowledgeCount > 0 && knowledgeCount < projectCount) {
        insights.push({
          type: 'Knowledge',
          message: 'Consider adding more knowledge items to support your projects.',
          priority: 'low'
        });
      }

      // 6. User context insights
      if (userContext) {
        if (userContext.overdueTasks > 0) {
          insights.push({
            type: 'Alert',
            message: `${userContext.overdueTasks} tasks are overdue. Focus on completing these first.`,
            priority: 'high'
          });
        }

        if (userContext.activeProjects > 5) {
          insights.push({
            type: 'Focus',
            message: 'You have many active projects. Consider prioritizing or pausing some.',
            priority: 'medium'
          });
        }

        if (userContext.completedGoals > 0) {
          insights.push({
            type: 'Achievement',
            message: `Great job! You've completed ${userContext.completedGoals} goals recently.`,
            priority: 'low'
          });
        }
      }

      // 7. Workflow insights
      const activeTasks = nodes.filter(node => 
        node.type === 'task' && node.metadata?.status === 'in_progress'
      ).length;

      const activeProjects = nodes.filter(node => 
        node.type === 'project' && node.metadata?.status === 'active'
      ).length;

      if (activeTasks === 0 && activeProjects > 0) {
        insights.push({
          type: 'Action',
          message: 'You have active projects but no tasks in progress. Consider starting some tasks.',
          priority: 'medium'
        });
      }

      // 8. Time-based insights
      const highPriorityTasks = nodes.filter(node => 
        node.type === 'task' && node.metadata?.priority === 'high'
      ).length;

      if (highPriorityTasks > 3) {
        insights.push({
          type: 'Priority',
          message: `${highPriorityTasks} high-priority tasks detected. Consider focusing on these first.`,
          priority: 'high'
        });
      }

      // Sort insights by priority
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      insights.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

      resolve(insights.slice(0, 5)); // Return top 5 insights
    }, 1500); // Simulate AI processing time
  });
};

export const calculateNodePosition = (
  item: any,
  type: string,
  index: number,
  total: number,
  centerX: number = 150,
  centerY: number = 100
) => {
  const radiusMap = {
    project: 80,
    goal: 60,
    task: 40,
    knowledge: 70,
    persona: 30,
    integration: 50
  };

  const radius = radiusMap[type as keyof typeof radiusMap] || 50;
  const angle = (index / total) * 2 * Math.PI;
  
  // Add some randomness to avoid perfect circles
  const randomOffset = (Math.random() - 0.5) * 20;
  
  return {
    x: centerX + (radius + randomOffset) * Math.cos(angle),
    y: centerY + (radius + randomOffset) * Math.sin(angle)
  };
};

export const calculateConnectionStrength = (
  fromNode: GraphNode,
  toNode: GraphNode
): number => {
  // Base strength
  let strength = 1;

  // Increase strength based on node types
  if (fromNode.type === 'project' && toNode.type === 'task') {
    strength = 2; // Strong project-task relationship
  } else if (fromNode.type === 'goal' && toNode.type === 'project') {
    strength = 3; // Very strong goal-project relationship
  } else if (fromNode.type === 'knowledge' && toNode.type === 'project') {
    strength = 1.5; // Moderate knowledge-project relationship
  }

  // Adjust based on metadata
  if (fromNode.metadata?.priority === 'high' || toNode.metadata?.priority === 'high') {
    strength += 0.5;
  }

  if (fromNode.metadata?.status === 'active' || toNode.metadata?.status === 'active') {
    strength += 0.3;
  }

  return Math.min(strength, 4); // Cap at 4
};

export const detectClusters = (nodes: GraphNode[], connections: GraphConnection[]): Array<{ nodes: string[]; strength: number }> => {
  const clusters: Array<{ nodes: string[]; strength: number }> = [];
  const visited = new Set<string>();

  // Simple clustering based on connection density
  nodes.forEach(node => {
    if (visited.has(node.id)) return;

    const cluster = [node.id];
    const queue = [node.id];
    visited.add(node.id);

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const connectedNodes = connections
        .filter(conn => conn.from === currentId || conn.to === currentId)
        .map(conn => conn.from === currentId ? conn.to : conn.from)
        .filter(id => !visited.has(id));

      connectedNodes.forEach(id => {
        if (!visited.has(id)) {
          visited.add(id);
          cluster.push(id);
          queue.push(id);
        }
      });
    }

    if (cluster.length > 1) {
      const strength = connections
        .filter(conn => cluster.includes(conn.from) && cluster.includes(conn.to))
        .reduce((sum, conn) => sum + conn.strength, 0) / cluster.length;

      clusters.push({ nodes: cluster, strength });
    }
  });

  return clusters.sort((a, b) => b.strength - a.strength);
};
