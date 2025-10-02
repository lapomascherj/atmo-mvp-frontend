# ATMO Components Documentation

Comprehensive documentation for all UI components in the ATMO frontend application, organized using atomic design principles.

## 🏗️ **Architecture Overview**

ATMO follows **Atomic Design** methodology, creating a scalable and maintainable component system:

```
Atoms → Molecules → Organisms → Templates → Pages
```

### **Component Statistics**
- **Atoms**: 50+ basic building blocks
- **Molecules**: 36+ component combinations  
- **Organisms**: 14+ complex UI sections
- **Layouts**: 6+ page layout templates
- **Specialized**: 25+ domain-specific components
- **UI Components**: 20+ Shadcn/ui components

---

## ⚛️ **Atoms** (`src/components/atoms/`)

Basic building blocks that cannot be broken down further without losing functionality.

### **Core UI Elements**

#### **Button.tsx**
- **Purpose**: Primary action component with multiple variants
- **Variants**: default, destructive, outline, secondary, ghost, link
- **Sizes**: default, sm, lg, icon
- **Features**: Loading states, disabled states, icon support

#### **Input.tsx** 
- **Purpose**: Text input with validation and styling
- **Features**: Error states, placeholder text, icon integration
- **Variants**: Standard, search, password

#### **Card.tsx**
- **Purpose**: Container component for content grouping
- **Features**: Header, content, footer sections
- **Styling**: Consistent shadows and borders

### **Interactive Elements**

#### **SphereChat.tsx** ⭐
- **Purpose**: ATMO's signature AI assistant interface
- **Features**: Voice recognition, animated states, size variants
- **Props**: `size`, `isActive`, `isListening`, `voiceSupported`
- **Animations**: Pulsing, listening indicators, hover effects

#### **ThemeToggle.tsx**
- **Purpose**: Dark/light theme switching
- **Features**: Smooth transitions, system preference detection
- **Integration**: Works with next-themes provider

#### **FlowerOfLife.tsx**
- **Purpose**: Sacred geometry visualization component
- **Features**: Animated sacred geometry patterns
- **Use Cases**: Meditation, wellness, spiritual content

### **Data Display**

#### **Avatar.tsx**
- **Purpose**: User profile image display
- **Features**: Fallback initials, size variants, status indicators
- **Sizes**: sm, md, lg, xl

#### **Badge.tsx**
- **Purpose**: Status and category indicators
- **Variants**: default, secondary, destructive, outline
- **Use Cases**: Status labels, tags, notifications

#### **Progress.tsx**
- **Purpose**: Progress indication and completion tracking
- **Features**: Animated progress bars, percentage display
- **Variants**: Linear, circular (planned)

### **Navigation & Layout**

#### **AppSidebar.tsx**
- **Purpose**: Main application navigation sidebar
- **Features**: Collapsible, responsive, active state indicators
- **Integration**: Works with SidebarContext

#### **PageHeader.tsx**
- **Purpose**: Consistent page header component
- **Features**: Title, subtitle, action buttons
- **Props**: `title`, `subTitle`, `actions`

#### **InteractiveDivider.tsx**
- **Purpose**: Draggable panel divider for resizable layouts
- **Features**: Smooth dragging, position persistence
- **Use Cases**: Dashboard panels, sidebar resizing

### **Feedback & Status**

#### **LoadingScreen.tsx**
- **Purpose**: Full-screen loading state
- **Features**: ATMO branding, animated indicators
- **Variants**: Full screen, inline

#### **ErrorBoundary.tsx**
- **Purpose**: Error catching and graceful degradation
- **Features**: Error reporting, retry mechanisms, fallback UI
- **Integration**: Wraps entire application

#### **Toast.tsx**
- **Purpose**: Notification and feedback messages
- **Features**: Auto-dismiss, action buttons, positioning
- **Variants**: success, error, warning, info

---

## 🧬 **Molecules** (`src/components/molecules/`)

Simple groups of atoms functioning together as a unit.

### **Core Molecules**

#### **AtmoCard.tsx** ⭐
- **Purpose**: ATMO's signature card component
- **Variants**: default, orange, purple, gold, blue
- **Features**: Hover effects, glow animations, glass morphism
- **Props**: `variant`, `hover`, `glow`, `className`

#### **GetCenteredCard.tsx**
- **Purpose**: Centered content card with responsive behavior
- **Features**: Auto-centering, responsive sizing
- **Use Cases**: Modals, focused content areas

### **Form Components**

#### **ProjectForm.tsx**
- **Purpose**: Comprehensive project creation and editing
- **Features**: Validation, auto-save, rich text editing
- **Fields**: Name, description, goals, milestones, knowledge items

#### **AssociationDialog.tsx**
- **Purpose**: Link knowledge items to projects
- **Features**: Search, filter, multi-select, drag & drop
- **Integration**: Works with PersonasStore

### **Data Display**

#### **StatsSection.tsx**
- **Purpose**: Statistical data visualization
- **Features**: Animated counters, progress indicators
- **Use Cases**: Dashboard metrics, progress tracking

#### **MilestoneCard.tsx**
- **Purpose**: Project milestone visualization
- **Features**: Progress tracking, date management, status indicators
- **Actions**: Edit, complete, delete

### **Navigation**

#### **NavSidebar.tsx**
- **Purpose**: Main application navigation
- **Features**: Active states, icons, responsive behavior
- **Integration**: React Router, SidebarContext

#### **KnowledgeItemsSidebar.tsx**
- **Purpose**: Knowledge item management sidebar
- **Features**: Filtering, search, drag & drop, associations
- **Modes**: organizer, project-specific

### **Interactive Elements**

#### **ToolCard.tsx**
- **Purpose**: Integration and tool connection cards
- **Features**: Connection status, toggle actions, branding
- **Use Cases**: External service integrations

#### **Toaster.tsx**
- **Purpose**: Toast notification container
- **Features**: Positioning, stacking, auto-dismiss
- **Integration**: Works with toast hooks

---

## 🦠 **Organisms** (`src/components/organisms/`)

Complex UI components composed of groups of molecules and atoms.

### **Layout Organisms**

#### **DashboardLayout.tsx** ⭐
- **Purpose**: Main dashboard layout orchestrator
- **Features**: Responsive panels, interactive dividers, state management
- **Sections**: Left panel (AI), center (cards), right (wellness)
- **Props**: `userName`

#### **DailySnapshot.tsx**
- **Purpose**: Daily productivity overview
- **Features**: Progress tracking, wellness indicators, quick actions
- **Data**: Tasks, goals, wellness metrics

### **Specialized Organisms**

#### **Sonner.tsx**
- **Purpose**: Advanced toast notification system
- **Features**: Rich notifications, actions, persistence
- **Integration**: Sonner library wrapper

---

## 🏗️ **Layouts** (`src/components/layouts/`)

Page-level layout templates providing consistent structure.

### **Layout Components**

#### **BaseLayout.tsx**
- **Purpose**: Base layout template with navigation
- **Features**: Responsive design, sidebar integration
- **Use Cases**: Standard pages with navigation

#### **KnowledgeOrganizerLayout.tsx**
- **Purpose**: Knowledge management layout
- **Features**: Sidebar integration, responsive behavior
- **Sections**: Main content, knowledge sidebar

#### **ProjectViewLayout.tsx**
- **Purpose**: Detailed project management layout
- **Features**: Project-specific sidebar, responsive design
- **Sections**: Project details, knowledge integration

#### **CenterColumn.tsx**, **LeftColumn.tsx**, **RightColumn.tsx**
- **Purpose**: Dashboard column layouts
- **Features**: Responsive behavior, content organization
- **Use Cases**: Dashboard panel organization

---

## 🌌 **Knowledge Components** (`src/components/knowledge/`)

Specialized components for knowledge visualization and management.

### **Primary Components**

#### **ObsidianKnowledgeGraph.tsx** ⭐
- **Purpose**: Cosmic-themed interactive knowledge visualization
- **Features**: 4 main categories, draggable nodes, pan/zoom
- **Theme**: Dark space with twinkling stars
- **Layout**: Compact card + wide modal (90vw x 70vh)

#### **EnhancedKnowledgeGraph.tsx**
- **Purpose**: Data-driven knowledge graph with AI insights
- **Features**: Real-time data integration, AI analysis
- **Integration**: All Zustand stores, PersonasStore

#### **SimpleKnowledgeGraph.tsx**
- **Purpose**: Fallback knowledge graph for stability
- **Features**: Basic visualization, reliable rendering
- **Use Cases**: Error recovery, simple demonstrations

### **Supporting Components**

#### **KnowledgeCraftCard.tsx**
- **Purpose**: Legacy 3D knowledge visualization
- **Features**: 3D rendering, force-directed layout
- **Status**: Replaced by ObsidianKnowledgeGraph

#### **KnowledgeGraphDemo.tsx**
- **Purpose**: Demonstration component with instructions
- **Features**: Usage examples, feature showcase
- **Use Cases**: Documentation, testing

---

## 📅 **Scheduler Components** (`src/components/scheduler/`)

Calendar and scheduling functionality components.

### **Scheduler Components**

#### **SchedulerView.tsx**
- **Purpose**: Advanced calendar and task scheduling
- **Features**: Drag & drop, time blocking, event management
- **Integration**: Task and event stores

#### **EventCard.tsx**
- **Purpose**: Individual event visualization
- **Features**: Editing, status management, time display
- **Actions**: Edit, delete, complete

#### **TimeRuler.tsx**
- **Purpose**: Time scale visualization
- **Features**: Hour markers, time navigation
- **Use Cases**: Calendar views, scheduling

#### **MonthPicker.tsx**
- **Purpose**: Month navigation component
- **Features**: Month/year selection, navigation arrows
- **Integration**: Calendar state management

#### **EditEventModal.tsx**
- **Purpose**: Event creation and editing interface
- **Features**: Form validation, time selection, recurrence
- **Fields**: Title, description, time, location, attendees

---

## 🎨 **UI Components** (`src/components/ui/`)

Shadcn/ui components adapted for ATMO design system.

### **Core UI Components**
- **dialog.tsx** - Modal dialogs and overlays
- **select.tsx** - Dropdown selection components
- **form.tsx** - Form handling and validation
- **scroll-area.tsx** - Custom scrollbar styling
- **separator.tsx** - Visual content separation
- **switch.tsx** - Toggle switches and controls
- **tooltip.tsx** - Contextual help and information
- **radio-group.tsx** - Radio button groups
- **textarea.tsx** - Multi-line text input
- **sonner.tsx** - Toast notification system

---

## 🎯 **Component Usage Patterns**

### **Atomic Design Implementation**

```tsx
// Atoms - Basic building blocks
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';

// Molecules - Component combinations
import { AtmoCard } from '@/components/molecules/AtmoCard';
import { ProjectForm } from '@/components/molecules/ProjectForm';

// Organisms - Complex sections
import { DashboardLayout } from '@/components/organisms/DashboardLayout';

// Usage in pages
function MyPage() {
  return (
    <DashboardLayout userName="User">
      <AtmoCard variant="blue">
        <ProjectForm onSubmit={handleSubmit} />
      </AtmoCard>
    </DashboardLayout>
  );
}
```

### **Component Composition**

```tsx
// Building complex interfaces from simple components
function ComplexFeature() {
  return (
    <AtmoCard variant="purple" hover glow>
      <div className="p-6">
        <PageHeader 
          title="Feature Title" 
          subTitle="Description" 
        />
        <StatsSection metrics={data} />
        <Button variant="default" size="lg">
          Take Action
        </Button>
      </div>
    </AtmoCard>
  );
}
```

### **State Integration**

```tsx
// Components with state management
function DataDrivenComponent() {
  const { projects, loading } = useProjectsStore();
  const { user } = useAuth();
  
  if (loading) return <LoadingScreen />;
  
  return (
    <div>
      {projects.map(project => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
```

---

## 🎨 **Design System Integration**

### **Color Variants**
- **Blue** (#3B82F6) - Primary actions, navigation
- **Green** (#10B981) - Success states, projects
- **Orange** (#F59E0B) - Highlights, inspiration
- **Purple** (#8B5CF6) - Special features, health
- **Red** (#EF4444) - Errors, urgent items

### **Spacing System**
- **Base Unit**: 8px (0.5rem)
- **Component Padding**: 16px (1rem)
- **Card Padding**: 24px (1.5rem)
- **Section Spacing**: 32px (2rem)

### **Typography Scale**
- **Headings**: 48px, 36px, 24px, 18px, 16px
- **Body Text**: 16px (base), 14px (small)
- **Captions**: 12px, 10px

### **Animation Principles**
- **Duration**: 150ms (fast), 300ms (standard), 500ms (slow)
- **Easing**: cubic-bezier(0.4, 0, 0.2, 1)
- **Hover States**: Scale, opacity, color transitions
- **Loading States**: Skeleton loaders, progress indicators

---

## 🔧 **Development Guidelines**

### **Component Creation**
1. **Start with Atoms** - Build basic functionality first
2. **Compose Molecules** - Combine atoms for specific use cases
3. **Build Organisms** - Create complex, reusable sections
4. **Design Templates** - Layout components for pages
5. **Implement Pages** - Complete user interfaces

### **Best Practices**
- **TypeScript**: Strict typing for all props and state
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support
- **Performance**: React.memo, useMemo, useCallback optimization
- **Testing**: Unit tests for logic, integration tests for interactions
- **Documentation**: JSDoc comments for all public APIs

### **Naming Conventions**
- **Components**: PascalCase (e.g., `AtmoCard`)
- **Props**: camelCase (e.g., `isActive`)
- **Files**: PascalCase matching component name
- **Directories**: camelCase (e.g., `atoms`, `molecules`)

---

*The ATMO component system provides a comprehensive, scalable foundation for building consistent, accessible, and performant user interfaces while maintaining the unique ATMO design language and user experience.*
