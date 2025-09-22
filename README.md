# ATMO - Frontend-Only Demo

This is a **frontend-only** version of the ATMO web application, containing all UI components, pages, and visual functionality without any authentication or server dependencies.

## What's Included

✅ **Complete UI Components** - All 118+ React components using atomic design
✅ **All Pages** - Dashboard, Profile, Calendar, Knowledge Organizer, Project View
✅ **Visual Design System** - TailwindCSS with ATMO's design specification
✅ **Interactive Features** - Responsive layout, animations, state management
✅ **Mock Data** - Sample data to demonstrate functionality

## What's Removed

❌ **Authentication** - No login, signup, or user management
❌ **External APIs** - No PocketBase, DigitalBrain, or third-party integrations  
❌ **Server Dependencies** - No backend services required
❌ **Real Data Persistence** - All data is mock/demo data

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

The app will run at `http://localhost:5173` and show the complete ATMO interface with demo data.

## Project Structure

```
src/
├── components/          # UI components (atoms, molecules, organisms, layouts)
├── pages/              # Main application pages
├── stores/             # Zustand state management
├── hooks/              # Custom React hooks
├── models/             # TypeScript models
├── mocks/              # Demo data
├── utils/              # Utility functions
└── context/            # React contexts
```

## Features Demonstrated

### Dashboard Page (`/`)
- Left panel with AI chat interface
- Right panel with daily snapshot and wellness cards
- Responsive layout with draggable divider

### Knowledge Organizer (`/knowledge-organiser`)
- Project management interface
- Task and goal tracking
- Interactive project cards

### Profile Page (`/profile`)
- User profile management
- Settings and preferences
- Personal information display

### Calendar Page (`/calendar`)
- Calendar view with events
- Task scheduling interface
- Time management tools

## Technology Stack

- **React 18** with TypeScript
- **Vite** for build tooling
- **TailwindCSS** for styling
- **Radix UI** for accessible components
- **Zustand** for state management
- **React Router** for navigation
- **Lucide React** for icons

## Design System

Following ATMO's design specification:
- **Colors**: Black/gray base with orange (#E85002) accents
- **Typography**: Inter font family
- **Spacing**: 8px grid system
- **Components**: 16px border radius, consistent styling

## Development Notes

This is a **demonstration version** showing the complete ATMO frontend without any backend dependencies. All data is mocked and no real user accounts or data persistence exists.

To see the full application with authentication and real data, refer to the complete ATMO project.
