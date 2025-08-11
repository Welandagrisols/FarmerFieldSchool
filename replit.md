# Farm Layout Planner

## Overview

Farm Layout Planner is a comprehensive web application that allows users to design and manage farm layouts through an interactive grid-based interface with professional surveying capabilities. Users can create detailed farm projects with owner information, GPS coordinates, crop planning, and layout visualization. The application includes a professional surveyor tool for precise land measurement, distance calculation, and boundary mapping. Users can create multiple farm projects, add plots with customizable properties, conduct professional surveys, and manage all data through a unified dashboard with persistent database storage.

## Recent Changes (August 2025)

✓ **Farm Creation System Fully Operational** - Fixed create farm modal to properly connect to backend API
✓ **Database Integration Complete** - All farm data now saves to PostgreSQL database instead of localStorage  
✓ **Enhanced User Experience** - Added form validation, loading states, and proper error handling
✓ **API Connectivity Verified** - Backend Express server successfully handling all CRUD operations
✓ **Baseline Data Collection Working** - Users can add seasonal agricultural data for productivity tracking
✓ **Project Dashboard Functional** - Users can view, manage, and navigate between multiple farm projects

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Components**: Radix UI primitives with shadcn/ui component library for consistent design
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation for type-safe form handling

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **API Design**: RESTful APIs with JSON responses
- **Middleware**: Custom logging middleware for API request tracking
- **Error Handling**: Centralized error handling with proper HTTP status codes
- **Development**: Hot module replacement and development server integration with Vite

### Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Schema**: Well-defined database schema with farms and plots tables
- **Local Development**: In-memory storage implementation for development/testing
- **Production**: Neon Database serverless PostgreSQL for production deployment

### Authentication and Authorization
- **Current State**: Basic placeholder authentication UI (not fully implemented)
- **Session Management**: Express sessions with PostgreSQL session store (connect-pg-simple)
- **Future Implementation**: Ready for integration with authentication providers

### Component Architecture
- **Modular Design**: Reusable UI components with clear separation of concerns
- **Drag and Drop**: Custom implementation for plot positioning on grid
- **Modal System**: Centralized modal management for farm and plot creation
- **Grid System**: Dynamic grid rendering with customizable cell sizes
- **Color System**: Predefined color schemes for plot categorization
- **Surveyor Tool**: Professional canvas-based surveying interface with measurement capabilities
- **Project Management**: Comprehensive dashboard for managing multiple farm projects

### Development Workflow
- **Build Process**: Separate build configurations for client and server
- **Type Safety**: Shared TypeScript types between client and server
- **Development Tools**: Comprehensive development setup with hot reloading
- **Code Organization**: Clear separation between client, server, and shared code

## External Dependencies

### UI and Styling
- **@radix-ui/react-***: Headless UI primitives for accessible components
- **tailwindcss**: Utility-first CSS framework for styling
- **class-variance-authority**: Utility for creating component variants
- **lucide-react**: Icon library for consistent iconography

### Data Management
- **@tanstack/react-query**: Data fetching and caching library
- **drizzle-orm**: Type-safe SQL ORM for database operations
- **drizzle-zod**: Integration between Drizzle ORM and Zod validation
- **@neondatabase/serverless**: Serverless PostgreSQL client for Neon Database

### Development Tools
- **vite**: Fast build tool and development server
- **@replit/vite-plugin-***: Replit-specific development plugins
- **tsx**: TypeScript execution for Node.js development
- **esbuild**: Fast JavaScript bundler for production builds

### Form and Validation
- **react-hook-form**: Performant forms with easy validation
- **@hookform/resolvers**: Validation resolvers for React Hook Form
- **zod**: TypeScript-first schema validation library

### Routing and Navigation
- **wouter**: Minimalist routing library for React applications

### Database and Sessions
- **connect-pg-simple**: PostgreSQL session store for Express sessions
- **pg**: PostgreSQL client library for Node.js