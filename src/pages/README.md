# ATMO Pages Documentation

Comprehensive documentation for all pages in the ATMO frontend application, detailing features, functionality, and user interactions.

## 📱 **Page Overview**

The ATMO application consists of 6 main pages, each serving specific productivity and knowledge management functions:

1. **Dashboard** (`/`) - Main hub and command center
2. **Digital Brain** (`/digital-brain`) - AI-powered insights and analytics
3. **Daily Road** (`/daily-road`) - Daily planning and wellness tracking
4. **Knowledge Organizer** (`/knowledge-organiser`) - Project and knowledge management
5. **Project View** (`/project/:id`) - Detailed project management
6. **Profile** (`/profile`) - User settings and preferences

---

## 🏠 **Dashboard Page** (`/`)

**File**: `src/pages/Index.tsx`  
**Component**: `DashboardLayout`  
**Purpose**: Main application hub providing overview of all productivity metrics and quick access to key features.

### **Layout Structure**
- **Left Panel**: AI chat interface with ATMO Sphere
- **Center Panel**: Interactive dashboard cards with key metrics
- **Right Panel**: Daily snapshot and wellness indicators
- **Interactive Divider**: Draggable panel resizing

### **Key Features**
- **Responsive Design**: Adapts to all screen sizes with mobile-first approach
- **Real-time Updates**: Live data synchronization across all components
- **AI Integration**: ATMO Sphere assistant with voice recognition
- **Quick Actions**: Fast access to create projects, tasks, and knowledge items

### **Components Used**
- `DashboardLayout` - Main layout orchestrator
- `SphereChat` - AI assistant interface
- `DailySnapshot` - Daily metrics and progress
- `AtmoCard` - Branded card components
- `InteractiveDivider` - Resizable panel divider

### **State Management**
- `DailyMapCtx` - Daily planning context
- `SidebarContext` - Navigation state
- Voice recognition hooks for AI interaction

---

## 🧠 **Digital Brain Page** (`/digital-brain`)

**File**: `src/pages/DigitalBrain.tsx`  
**Purpose**: AI-powered command center with advanced analytics, knowledge visualization, and intelligent insights.

### **4-Card Dashboard Layout**

#### **Card 1: AI Insights** (Orange)
- **Personal/Projects Toggle**: Switch between insight modes
- **Tag Filtering**: Filter insights by categories
- **Interactive Items**: Clickable insights with actions
- **Real-time Updates**: Dynamic insight generation

#### **Card 2: Knowledge Albums** (Purple)
- **Album Management**: Create, edit, and organize knowledge albums
- **Drag & Drop**: Intuitive knowledge item organization
- **Search Functionality**: Real-time search across albums
- **Visual Organization**: Card-based album display

#### **Card 3: Obsidian Knowledge Graph** (Blue)
- **Cosmic Theme**: Dark space background with twinkling stars
- **4 Main Categories**: Personal, Projects, Inspo, Health
- **Interactive Nodes**: Draggable nodes with hover effects
- **Expandable View**: Wide modal (90vw x 70vh) with full controls
- **ATMO Branding**: Professional header and footer

#### **Card 4: Analytics & Scheduler** (Gold)
- **Task Scheduling**: Advanced calendar with drag-and-drop
- **Event Management**: Create, edit, and manage events
- **Time Blocking**: Visual time management
- **Progress Analytics**: Task completion metrics

### **Advanced Features**
- **Voice Interface**: Full ATMO Sphere integration
- **AI Chat**: Contextual AI assistance
- **Real-time Sync**: Live updates across all cards
- **Export Capabilities**: Data export and sharing
- **Responsive Design**: Optimized for all devices

### **State Management**
- **Local State**: Card-specific interactions and UI state
- **Global Stores**: Integration with all Zustand stores
- **Real-time Updates**: WebSocket-ready architecture

---

## 🛣️ **Daily Road Page** (`/daily-road`)

**File**: `src/pages/DailyRoad.tsx`  
**Purpose**: Personalized daily planning interface with wellness integration and voice interaction.

### **Left Column: Daily Planning**
- **Daily Progress**: Visual progress tracking with wellness indicators
- **Project Lists**: Active project overview with task management
- **Wellness Button**: Quick access to wellness tracking
- **Progress Metrics**: Real-time completion percentages

### **Right Column: Voice Interface**
- **ATMO Sphere**: Large interactive AI assistant
- **Voice Recognition**: Full voice command support
- **Visual Feedback**: Animated listening indicators
- **Stop Controls**: Easy voice mode termination

### **Wellness Integration**
- **Daily Wellness Popup**: Comprehensive wellness tracking
- **Health Metrics**: Physical and mental health indicators
- **Progress Tracking**: Wellness goal monitoring
- **Habit Integration**: Daily habit tracking

### **Key Features**
- **Responsive Layout**: Adapts to mobile and desktop
- **Voice-First Design**: Optimized for voice interaction
- **Wellness Focus**: Holistic productivity approach
- **Real-time Updates**: Live progress synchronization

### **Components Used**
- `DailyProgress` - Progress visualization
- `ProjectsList` - Active project display
- `VoiceModeUI` - Voice interface
- `DailyWellnessPopup` - Wellness tracking modal

---

## 📚 **Knowledge Organizer Page** (`/knowledge-organiser`)

**File**: `src/pages/NewPage.tsx`  
**Purpose**: Comprehensive project and knowledge management interface with advanced organization tools.

### **Main Content Area**
- **Project Grid**: Visual project cards with drag-and-drop
- **Search Interface**: Advanced search with real-time filtering
- **Create Actions**: Quick project and knowledge item creation
- **Bulk Operations**: Multi-select and batch actions

### **Knowledge Sidebar**
- **Filterable Items**: Advanced filtering by type, source, tags
- **Association Tools**: Link knowledge items to projects
- **Drag & Drop**: Intuitive item management
- **Quick Actions**: Edit, delete, and organize items

### **Advanced Features**
- **Real-time Search**: Instant filtering and search results
- **Association Dialog**: Advanced item linking interface
- **Drag & Drop**: Full drag-and-drop support
- **CRUD Operations**: Complete create, read, update, delete functionality
- **Toast Notifications**: User feedback for all actions

### **Layout Components**
- `KnowledgeOrganizerLayout` - Main layout structure
- `KnowledgeItemsSidebar` - Sidebar with filtering
- `AssociationDialog` - Item linking interface
- `ProjectForm` - Project creation and editing

### **State Integration**
- **PersonasStore**: Centralized CRUD operations
- **ProjectsStore**: Project data access
- **KnowledgeItemsStore**: Knowledge item management
- **Real-time Sync**: Live updates across components

---

## 📋 **Project View Page** (`/project/:id`)

**File**: `src/pages/ProjectView.tsx`  
**Purpose**: Detailed project management with comprehensive goal, task, and milestone tracking.

### **Project Header**
- **Editable Fields**: Inline editing for project details
- **Progress Indicators**: Visual progress tracking
- **Action Buttons**: Quick access to common actions
- **Breadcrumb Navigation**: Easy navigation back to organizer

### **Goals & Tasks Section**
- **Hierarchical Display**: Goals with nested tasks
- **Progress Tracking**: Visual completion indicators
- **Inline Editing**: Quick task and goal updates
- **Priority Management**: Visual priority indicators

### **Milestones Section**
- **Milestone Cards**: Visual milestone representation
- **Progress Tracking**: Completion status and dates
- **Drag & Drop**: Milestone reordering
- **Quick Actions**: Create, edit, delete milestones

### **Knowledge Integration**
- **Project Knowledge**: Associated knowledge items
- **Drag & Drop**: Link knowledge to projects
- **Search & Filter**: Find relevant knowledge items
- **Context Awareness**: Project-specific knowledge

### **Advanced Features**
- **Real-time Updates**: Live synchronization
- **Comprehensive CRUD**: Full data management
- **Error Handling**: Robust error management
- **Toast Notifications**: User feedback
- **Responsive Design**: Mobile-optimized interface

### **Layout Structure**
- `ProjectViewLayout` - Main project layout
- `KnowledgeItemsSidebar` - Project knowledge sidebar
- `MilestoneCard` - Milestone visualization
- `HorizontalScrollGrid` - Scrollable content areas

---

## 👤 **Profile Page** (`/profile`)

**File**: `src/pages/Profile.tsx`  
**Purpose**: User profile management, settings, and application preferences.

### **Profile Information**
- **Personal Details**: Name, email, avatar management
- **Preferences**: Application settings and customization
- **Account Settings**: Security and privacy options
- **Integration Status**: Connected services overview

### **Settings Sections**
- **Appearance**: Theme and display preferences
- **Notifications**: Alert and notification settings
- **Privacy**: Data and privacy controls
- **Integrations**: External service connections

### **Key Features**
- **Profile Editing**: Comprehensive profile management
- **Settings Management**: Application configuration
- **Integration Setup**: External service connections (UI ready)
- **Data Export**: User data export capabilities

---

## 🔄 **Navigation & Routing**

### **Route Structure**
```tsx
<Routes>
  <Route path="/" element={<Index />} />
  <Route path="/digital-brain" element={<DigitalBrain />} />
  <Route path="/daily-road" element={<DailyRoad />} />
  <Route path="/knowledge-organiser" element={<NewPage />} />
  <Route path="/project/:id" element={<ProjectView />} />
  <Route path="/profile" element={<Profile />} />
  <Route path="*" element={<NotFound />} />
</Routes>
```

### **Navigation Components**
- `NavSidebar` - Main navigation sidebar
- `AppLayout` - Layout wrapper with navigation
- `SidebarProvider` - Navigation state management

### **Responsive Behavior**
- **Desktop**: Full sidebar navigation
- **Mobile**: Collapsible navigation drawer
- **Tablet**: Adaptive navigation based on screen size

---

## 🎨 **Design Consistency**

### **Layout Patterns**
- **Card-based Design**: Consistent AtmoCard usage
- **Responsive Grids**: CSS Grid and Flexbox layouts
- **Interactive Elements**: Hover states and animations
- **Loading States**: Skeleton loaders and progress indicators

### **Color Scheme**
- **Primary**: Blue (#3B82F6) for navigation and primary actions
- **Secondary**: Orange (#F59E0B) for highlights and accents
- **Success**: Green (#10B981) for positive actions
- **Warning**: Purple (#8B5CF6) for important information

### **Typography**
- **Font Family**: Work Sans throughout
- **Hierarchy**: Consistent heading and text scales
- **Readability**: Proper contrast and spacing

---

## 🔧 **Technical Implementation**

### **State Management**
- **Zustand Stores**: Centralized state management
- **React Context**: Component-level state sharing
- **Local State**: Component-specific UI state

### **Performance Optimization**
- **Code Splitting**: Route-based code splitting
- **Lazy Loading**: Component lazy loading
- **Memoization**: React.memo and useMemo optimization
- **Virtual Scrolling**: Large list optimization

### **Error Handling**
- **Error Boundaries**: Component-level error catching
- **Toast Notifications**: User-friendly error messages
- **Fallback UI**: Graceful degradation
- **Retry Mechanisms**: Automatic retry for failed operations

---

## 📱 **Mobile Responsiveness**

### **Breakpoints**
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### **Mobile Optimizations**
- **Touch Interactions**: Optimized for touch devices
- **Swipe Gestures**: Natural mobile interactions
- **Responsive Typography**: Scalable text sizes
- **Mobile Navigation**: Drawer-based navigation

---

*Each page is designed to provide a seamless, productive experience while maintaining consistency with ATMO's design language and user experience principles.*
