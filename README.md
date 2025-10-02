# ATMO - AI-Powered Productivity Platform (Frontend MVP)

**ATMO** is a cutting-edge AI-driven productivity platform that transforms how you manage projects, tasks, knowledge, and personal growth. This frontend-only MVP showcases the complete user interface and experience without backend dependencies.

## 🌟 **Key Features**

### 🧠 **Digital Brain Dashboard**
- **AI-Powered Insights**: Intelligent recommendations and pattern recognition
- **Obsidian-Style Knowledge Graph**: Interactive cosmic visualization of your knowledge universe
- **Real-time Analytics**: Live productivity metrics and progress tracking
- **Voice Interface**: ATMO Sphere AI assistant with voice recognition
- **Scheduler Integration**: Advanced task and event management

### 🚀 **Project Management**
- **Comprehensive Project Views**: Detailed project management with goals, tasks, and milestones
- **Knowledge Integration**: Link knowledge items to projects for context-aware productivity
- **Progress Tracking**: Visual progress indicators and completion metrics
- **Collaborative Features**: Team management and task assignment (UI ready)

### 📚 **Knowledge Organization**
- **Intelligent Knowledge Graph**: 4 main categories (Personal, Projects, Inspo, Health) with sub-nodes
- **Drag & Drop Interface**: Intuitive knowledge item management
- **Search & Filter**: Advanced filtering and search capabilities
- **AI-Powered Connections**: Automatic relationship mapping between knowledge items

### 🎯 **Personal Productivity**
- **Daily Road Map**: Personalized daily planning and task management
- **Wellness Integration**: Health and wellness tracking with progress indicators
- **Goal Management**: Hierarchical goal setting with milestone tracking
- **Habit Tracking**: Daily habit monitoring and streak management

## 📱 **Pages & Features**

### **Dashboard (`/`)** - Main Hub
- **Left Panel**: AI chat interface with ATMO Sphere
- **Center**: Interactive dashboard cards with key metrics
- **Right Panel**: Daily snapshot and wellness indicators
- **Features**: Responsive layout, draggable dividers, real-time updates

### **Digital Brain (`/digital-brain`)** - Command Center
- **4-Card Layout**: AI Insights, Knowledge Albums, Obsidian Knowledge Graph, Analytics
- **Interactive Elements**: Expandable cards, filtering, search functionality
- **AI Integration**: Intelligent insights and recommendations
- **Scheduler**: Advanced calendar and task scheduling

### **Daily Road (`/daily-road`)** - Daily Planning
- **Daily Progress**: Visual progress tracking with wellness integration
- **Project Lists**: Active project overview with task management
- **Voice Interface**: Full voice interaction mode with ATMO Sphere
- **Wellness Popup**: Comprehensive wellness tracking and insights

### **Knowledge Organizer (`/knowledge-organiser`)** - Knowledge Management
- **Project Grid**: Visual project cards with drag-and-drop functionality
- **Knowledge Sidebar**: Filterable knowledge items with association tools
- **Search Interface**: Advanced search with real-time filtering
- **CRUD Operations**: Full create, read, update, delete functionality

### **Project View (`/project/:id`)** - Detailed Project Management
- **Project Details**: Comprehensive project information and editing
- **Goals & Tasks**: Hierarchical task management with goal alignment
- **Milestones**: Project milestone tracking and management
- **Knowledge Integration**: Project-specific knowledge item management

### **Profile (`/profile`)** - User Management
- **Personal Information**: User profile and preferences
- **Settings**: Application configuration and customization
- **Integrations**: External service connections (UI ready)

## 🎨 **Obsidian-Style Knowledge Graph**

### **Cosmic Theme**
- **Dark Space Background**: Radial gradient with twinkling stars animation
- **Glowing Nodes**: Category-colored nodes with drop-shadow effects
- **Animated Connections**: Pulsing connections between related items
- **Interactive Elements**: Hover effects, drag-and-drop, pan & zoom

### **Four Main Categories**
1. **👤 Personal** (Blue) - Life Goals, Daily Habits, Self Development, Relationships, Finance
2. **🚀 Projects** (Green) - ATMO Platform, Startup Ideas, Learning Projects, Side Projects, Collaborations
3. **✨ Inspo** (Orange) - Quotes, Books, Articles, Videos, Inspiring People
4. **🌱 Health** (Purple) - Fitness, Nutrition, Mental Health, Sleep, Medical

### **Interactive Features**
- **Draggable Nodes**: Move nodes in both compact and expanded views
- **Pan & Zoom**: Smooth navigation with mouse wheel and controls
- **Node Selection**: Click nodes for detailed information panels
- **Wide Modal**: Professional 90vw x 70vh expanded view with ATMO branding

## 🛠 **Technology Stack**

### **Frontend Framework**
- **React 18** with TypeScript for type-safe development
- **Vite** for lightning-fast build tooling and hot reload
- **TailwindCSS** for utility-first styling and responsive design

### **UI Components**
- **Radix UI** for accessible, unstyled component primitives
- **Lucide React** for consistent iconography
- **Custom Atomic Design System** with 150+ components

### **State Management**
- **Zustand** for lightweight, scalable state management
- **React Query** for server state management and caching
- **Context API** for component-level state sharing

### **Development Tools**
- **TypeScript** for static type checking and better DX
- **ESLint** for code quality and consistency
- **PostCSS** for CSS processing and optimization

## 🚀 **Quick Start**

```bash
# Clone the repository
git clone [repository-url]
cd frontend_extracted

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

**Development Server**: `http://localhost:3000`

## 📁 **Project Structure**

```
src/
├── components/           # UI Components (Atomic Design)
│   ├── atoms/           # Basic building blocks (50+ components)
│   ├── molecules/       # Component combinations (36+ components)
│   ├── organisms/       # Complex UI sections (14+ components)
│   ├── layouts/         # Page layout components
│   ├── knowledge/       # Knowledge Graph components
│   ├── scheduler/       # Calendar and scheduling components
│   └── ui/              # Shadcn/ui components (20+ components)
├── pages/               # Application pages and routes
├── stores/              # Zustand state management stores
├── hooks/               # Custom React hooks
├── models/              # TypeScript type definitions (30+ models)
├── mocks/               # Demo data and mock services
├── utils/               # Utility functions and helpers
├── context/             # React context providers
└── types/               # Global type definitions
```

## 🎨 **Design System**

### **Color Palette**
- **Primary**: Blue (#3B82F6) for main actions and navigation
- **Secondary**: Orange (#F59E0B) for highlights and accents
- **Success**: Green (#10B981) for positive actions
- **Warning**: Purple (#8B5CF6) for important information
- **Background**: Dark theme with cosmic gradients

### **Typography**
- **Font Family**: Work Sans for clean, modern readability
- **Scale**: Consistent type scale from 12px to 48px
- **Weight**: 300-700 range for proper hierarchy

### **Spacing & Layout**
- **Grid System**: 8px base unit for consistent spacing
- **Border Radius**: 8px standard, 12px for cards
- **Shadows**: Layered shadow system for depth
- **Animations**: Smooth transitions and micro-interactions

## 🔧 **Component Architecture**

### **Atomic Design Principles**
- **Atoms**: Basic UI elements (buttons, inputs, icons)
- **Molecules**: Simple component groups (search bars, cards)
- **Organisms**: Complex UI sections (headers, sidebars)
- **Templates**: Page-level layouts and structures
- **Pages**: Complete user interfaces with data

### **Key Components**
- **AtmoCard**: Branded card component with variants
- **SphereChat**: AI assistant interface with voice support
- **ObsidianKnowledgeGraph**: Interactive knowledge visualization
- **SchedulerView**: Advanced calendar and task management
- **DashboardLayout**: Responsive dashboard framework

## 📊 **State Management**

### **Store Architecture**
- **PersonasStore**: Centralized user data and CRUD operations
- **ProjectsStore**: Project management and data access
- **TasksStore**: Task management with real-time updates
- **GoalsStore**: Goal tracking and milestone management
- **KnowledgeItemsStore**: Knowledge item organization
- **WellnessStore**: Health and wellness data tracking

### **Data Flow**
```
PersonasStore (Single Source of Truth)
    ↓
Individual Stores (Data Access & Views)
    ↓
Components (UI Rendering & Interactions)
    ↓
User Actions (State Updates)
```

## 🎯 **Features Demonstrated**

### **AI Integration**
- **ATMO Sphere**: Intelligent AI assistant with voice recognition
- **Smart Insights**: Pattern recognition and productivity recommendations
- **Automated Connections**: AI-powered knowledge relationship mapping
- **Predictive Analytics**: Intelligent task and goal suggestions

### **Interactive Elements**
- **Drag & Drop**: Intuitive item management and organization
- **Real-time Updates**: Live data synchronization across components
- **Voice Interface**: Full voice interaction capabilities
- **Responsive Design**: Seamless experience across all devices

### **Data Visualization**
- **Progress Tracking**: Visual progress indicators and charts
- **Knowledge Graphs**: Interactive network visualizations
- **Analytics Dashboard**: Comprehensive productivity metrics
- **Wellness Indicators**: Health and wellness progress tracking

## 🔮 **Mock Data & Services**

### **Demo Data Includes**
- **Sample Projects**: Pre-configured projects with tasks and goals
- **Knowledge Items**: Example knowledge base with categorization
- **User Profiles**: Demo user data with preferences
- **Calendar Events**: Sample events and scheduling data
- **Wellness Data**: Mock health and wellness metrics

### **Mock Services**
- **Authentication**: Simulated login and user management
- **PocketBase**: Mock database operations and data persistence
- **External APIs**: Simulated third-party service integrations
- **Voice Recognition**: Mock voice processing and responses

## 🚧 **Development Status**

### **✅ Completed Features**
- Complete UI component library with atomic design
- All major pages and navigation
- Obsidian-style Knowledge Graph with cosmic theme
- AI assistant interface with voice support
- Project and task management systems
- Responsive design and mobile optimization

### **🔄 In Progress**
- Enhanced AI integration and insights
- Advanced analytics and reporting
- Real-time collaboration features
- Extended knowledge graph functionality

### **📋 Planned Features**
- Backend integration with authentication
- Real data persistence and synchronization
- Advanced AI capabilities and machine learning
- Extended third-party integrations

## 🎓 **Learning & Documentation**

### **Component Documentation**
Each component includes comprehensive documentation with:
- **Purpose**: What the component does
- **Props**: Available properties and configurations
- **Usage**: Code examples and implementation guides
- **Styling**: Customization options and variants

### **Architecture Guides**
- **State Management**: Zustand store patterns and best practices
- **Component Design**: Atomic design implementation
- **Styling System**: TailwindCSS configuration and utilities
- **Performance**: Optimization techniques and considerations

## 🤝 **Contributing**

### **Development Guidelines**
- **TypeScript**: Maintain strict type safety
- **Component Structure**: Follow atomic design principles
- **State Management**: Use Zustand patterns consistently
- **Styling**: Utilize TailwindCSS utilities and design system
- **Testing**: Write comprehensive tests for components and logic

### **Code Standards**
- **ESLint**: Follow configured linting rules
- **Prettier**: Maintain consistent code formatting
- **Naming**: Use descriptive, consistent naming conventions
- **Documentation**: Document all components and complex logic

## 📄 **License**

This project is part of the ATMO platform development and is proprietary software. All rights reserved.

---

**ATMO** - Transforming productivity through AI-powered intelligence and beautiful, intuitive design. Experience the future of personal and professional productivity management.

🌟 **Ready to explore your productivity cosmos?** Start the development server and visit `http://localhost:3000`