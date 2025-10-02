# ATMO Knowledge Graph Components

A comprehensive collection of knowledge graph visualizations for ATMO, featuring the signature **Obsidian-Style Knowledge Graph** - a cosmic-themed, interactive visualization that serves as ATMO's intelligent command center and knowledge universe explorer.

## 🌌 **ObsidianKnowledgeGraph** - Primary Component

The flagship knowledge visualization component featuring an Obsidian-inspired cosmic theme with full interactivity and ATMO branding. **Currently active** in the Digital Brain dashboard.

### **🎨 Cosmic Visual Design**
- **Dark Space Background**: Radial gradient from deep blue (#0f1419) to black with twinkling stars
- **Animated Stars**: Multi-layered star field with gentle twinkling animation (20s cycle)
- **Glowing Nodes**: Category-colored nodes with dynamic drop-shadow effects
- **Smooth Animations**: Cubic-bezier transitions and hover effects
- **CSS Classes**: `.knowledge-graph-cosmic`, `.main-node`, `.sub-node`, `.connection-line`

### **🎯 Four Main Categories**
1. **👤 Personal** (Blue #3B82F6)
   - 🎯 Life Goals, ⚡ Daily Habits, 📈 Self Development, 💝 Relationships, 💰 Finance
2. **🚀 Projects** (Green #10B981)
   - 🧠 ATMO Platform, 💡 Startup Ideas, 📚 Learning Projects, 🔧 Side Projects, 🤝 Collaborations
3. **✨ Inspo** (Orange #F59E0B)
   - 💭 Quotes, 📖 Books, 📄 Articles, 🎥 Videos, 🌟 Inspiring People
4. **🌱 Health** (Purple #8B5CF6)
   - 💪 Fitness, 🥗 Nutrition, 🧘 Mental Health, 😴 Sleep, 🏥 Medical

### **🖱️ Interactive Features**
- **Draggable Nodes**: Move main and sub-nodes in both compact and expanded views
- **Pan & Zoom**: Smooth navigation with mouse wheel and toolbar controls
- **Node Selection**: Click nodes for detailed information panels with node details
- **Hover Effects**: Enhanced glows and scaling on hover with label display
- **Context Awareness**: Smart positioning and relationship visualization
- **Instructions Panel**: Built-in user guidance for interactions

### **📐 Layout Modes**

#### **Compact View** (Card Format)
- **Container**: AtmoCard with blue variant and hover effects
- **Viewbox**: 600x500 coordinate system
- **Node Sizes**: Main nodes (25px radius), sub-nodes (8px radius)
- **Interactions**: Basic drag, hover, and expand functionality
- **Sub-nodes**: 60px radius around main nodes
- **Expand Overlay**: "Click to explore cosmos" hover message

#### **Expanded View** (Wide Modal)
- **Dimensions**: 90vw x 70vh (wide format, not full screen)
- **Background**: Fixed black/90 overlay with cosmic theme
- **Viewbox**: Dynamic with pan/zoom support (1200x600 base)
- **Node Sizes**: Main nodes (30px radius), sub-nodes (12px radius)
- **Enhanced Interactions**: Full drag, pan, zoom, and selection
- **Sub-nodes**: 120px radius for better visibility
- **Controls**: Zoom in/out, reset view, close modal in header

### **🎨 ATMO Branding Integration**
- **Header**: Gradient background (blue-900/20 to purple-900/20) with ATMO logo
- **Title**: "ATMO Knowledge Cosmos" with Brain icon
- **Footer**: Branded footer with node counts and "Powered by ATMO" with blue square
- **Colors**: Consistent with ATMO design system
- **Typography**: Work Sans font family throughout
- **Info Panel**: Floating node details panel with ATMO styling

### **🔧 Technical Implementation**
- **State Management**: Local React state for interactions and UI
- **Node Positioning**: Automatic positioning with manual override via drag
- **Event Handling**: Mouse events for drag, pan, zoom, and selection
- **Performance**: Optimized with useCallback and useMemo hooks
- **Responsive**: Adapts to different screen sizes and devices

## Legacy Components

### **EnhancedKnowledgeGraph** - Advanced Data Integration

### 🔗 **Real-time Data Integration**
- **Zustand Store Integration**: Connects to all ATMO stores (projects, tasks, goals, personas, knowledge items, integrations)
- **Live Updates**: Automatically refreshes when underlying data changes
- **Centralized Data**: Uses PersonasStore as the single source of truth

### 🧠 **Intelligent Node Generation**
- **Dynamic Nodes**: Automatically generates nodes from real user data
- **Smart Positioning**: Intelligent positioning algorithms based on relationships
- **Adaptive Sizing**: Node sizes reflect importance and connection count
- **Type-based Coloring**: Different colors for projects, tasks, goals, knowledge items, personas

### 🔗 **Smart Connection Mapping**
- **Relationship Detection**: Automatically maps relationships between entities
- **Connection Types**: Different connection types (contains, supports, informs, assigned)
- **Animated Connections**: Active tasks and projects show animated connections
- **Strength Calculation**: Connection strength based on relationship importance

### 🎯 **Interactive Features**
- **Node Interactions**: Click to view details, right-click for context menu
- **Pan & Zoom**: Smooth pan and zoom functionality in expanded view
- **Hover Effects**: Rich hover states with node information
- **Context Menus**: Action menus for each node type

### 🔍 **Advanced Search & Filtering**
- **Text Search**: Search across node labels and descriptions
- **Type Filters**: Filter by node type (project, task, goal, etc.)
- **Status Filters**: Filter by status (active, completed, paused)
- **Priority Filters**: Filter by priority levels
- **Real-time Filtering**: Instant results as you type

### 🤖 **AI-Powered Insights**
- **Pattern Recognition**: Identifies patterns in your productivity data
- **Recommendations**: Suggests improvements and optimizations
- **Alerts**: Highlights overdue tasks and bottlenecks
- **Achievement Recognition**: Celebrates completed goals and milestones
- **ATMO Sphere Integration**: AI chat interface for graph exploration

### 📱 **Responsive Design**
- **Compact View**: Beautiful preview in dashboard card
- **Expanded Modal**: Full-screen graph exploration
- **Mobile Friendly**: Responsive design for all screen sizes
- **Touch Support**: Touch gestures for mobile interaction

## Components

### `EnhancedKnowledgeGraph`
Main component that renders both compact and expanded views.

**Props:**
- `className?: string` - Additional CSS classes

**Features:**
- Compact card view with preview
- Expandable modal with full functionality
- Real-time data binding
- AI insights panel

### `KnowledgeGraphDemo`
Demo component showcasing the knowledge graph functionality.

## Utilities

### `knowledgeGraphAnalyzer.ts`
Comprehensive analysis utilities for the knowledge graph.

**Functions:**
- `analyzeKnowledgeGraph()` - Generates AI insights from graph data
- `calculateNodePosition()` - Intelligent node positioning
- `calculateConnectionStrength()` - Connection strength calculation
- `detectClusters()` - Cluster detection algorithm

## Data Flow

```
Zustand Stores → Enhanced Knowledge Graph → AI Analyzer → Insights
     ↓                      ↓                    ↓           ↓
  Real Data         Node Generation      Pattern Analysis  User Actions
```

## Usage

### **Primary Implementation** (Current)
```tsx
import { ObsidianKnowledgeGraph } from '@/components/knowledge/ObsidianKnowledgeGraph';

function MyComponent() {
  return <ObsidianKnowledgeGraph className="w-full h-full" />;
}
```

### **In Digital Brain Dashboard**
```tsx
// Currently integrated in DigitalBrain.tsx as Card 3
<ObsidianKnowledgeGraph className="w-full h-full overflow-hidden" />
```

### **Alternative Implementations**
```tsx
// Enhanced version with real data integration
import { EnhancedKnowledgeGraph } from '@/components/knowledge/EnhancedKnowledgeGraph';

// Simple fallback version
import { SimpleKnowledgeGraph } from '@/components/knowledge/SimpleKnowledgeGraph';

// Demo component
import { KnowledgeGraphDemo } from '@/components/knowledge/KnowledgeGraphDemo';
```

## Node Types

### 🚀 **Project Nodes**
- **Color**: Blue (#3B82F6)
- **Size**: Based on task/goal count and priority
- **Connections**: To tasks, goals, knowledge items
- **Metadata**: Status, progress, priority, dates

### ✓ **Task Nodes**
- **Color**: Green (#10B981)
- **Size**: Based on priority and estimated hours
- **Connections**: To projects, goals, personas
- **Metadata**: Status, priority, due date, completion

### 🎯 **Goal Nodes**
- **Color**: Purple (#8B5CF6)
- **Size**: Based on milestone count
- **Connections**: To projects, tasks
- **Metadata**: Status, progress, target date

### 📚 **Knowledge Nodes**
- **Color**: Orange (#F59E0B)
- **Size**: Based on project associations
- **Connections**: To projects
- **Metadata**: Type, source, tags, dates

### 👤 **Persona Nodes**
- **Color**: Red (#EF4444)
- **Size**: Fixed (represents user)
- **Connections**: To all projects
- **Metadata**: IAM, onboarding status

## Connection Types

### Contains (Blue)
- Project → Task relationships
- Strong connections (strength: 2)
- Animated when task is in progress

### Supports (Purple)
- Goal → Project relationships
- Very strong connections (strength: 3)
- Animated when project is active

### Informs (Orange)
- Knowledge → Project relationships
- Moderate connections (strength: 1.5)
- Static connections

### Assigned (Red)
- Persona → Project relationships
- Strong connections (strength: 2)
- Animated when project is active

## AI Insights Types

### 📊 **Structure Insights**
- Node and connection counts
- Graph density analysis
- Connectivity patterns

### 🎯 **Recommendations**
- Isolated node suggestions
- Connection opportunities
- Organization improvements

### ⚠️ **Alerts**
- Overdue tasks
- Bottlenecks
- Priority conflicts

### 🏆 **Achievements**
- Completed goals
- Milestone progress
- Productivity patterns

### 🔍 **Patterns**
- Workflow analysis
- Time distribution
- Focus areas

## Styling

The component uses Tailwind CSS with custom animations defined in `index.css`:

```css
.animate-pulse-soft {
  animation: pulse-soft 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.graph-node {
  transition: all 0.3s ease;
  cursor: pointer;
}

.graph-connection.animated {
  animation: connection-pulse 2s ease-in-out infinite;
}
```

## Performance

- **Optimized Rendering**: Uses React.memo and useMemo for performance
- **Efficient Updates**: Only re-renders when data actually changes
- **Debounced Search**: Prevents excessive filtering operations
- **Lazy Loading**: Insights generated on demand

## Accessibility

- **Keyboard Navigation**: Full keyboard support
- **Screen Reader**: Proper ARIA labels and descriptions
- **High Contrast**: Sufficient color contrast ratios
- **Focus Management**: Clear focus indicators

## Future Enhancements

- **Export Functionality**: Save graph as image or data
- **Collaborative Features**: Shared knowledge graphs
- **Advanced Clustering**: Machine learning-based clustering
- **Time-based Views**: Historical graph evolution
- **Integration APIs**: Connect to external tools

## Dependencies

- React 18+
- Zustand (state management)
- Lucide React (icons)
- Tailwind CSS (styling)
- TypeScript (type safety)

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

When contributing to the Enhanced Knowledge Graph:

1. **Follow TypeScript**: Maintain strict type safety
2. **Test Interactions**: Verify all node interactions work
3. **Performance**: Ensure smooth animations and rendering
4. **Accessibility**: Test with screen readers and keyboard navigation
5. **Mobile**: Test on various screen sizes

## Troubleshooting

### Graph Not Updating
- Check Zustand store subscriptions
- Verify data flow from PersonasStore
- Check console for subscription errors

### Poor Performance
- Check for unnecessary re-renders
- Verify useMemo dependencies
- Consider reducing node/connection count

### Missing Insights
- Verify AI analyzer is working
- Check network connectivity
- Review insight generation logic

---

*The Enhanced Knowledge Graph represents the next evolution of ATMO's knowledge management, providing users with an intelligent, interactive view of their entire productivity ecosystem.*
