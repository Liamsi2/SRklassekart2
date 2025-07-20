# Classroom Seating Manager

## Overview

The Classroom Seating Manager (Klasseromsplanlegger) is a simplified web-based application designed to help teachers manage classroom seating arrangements. It features a clean Norwegian interface with essential student management and random seating generation capabilities. The application uses a fixed classroom layout matching the original design provided by the user.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Type**: Single-page application (SPA)
- **Technology**: Vanilla JavaScript with ES6+ classes
- **Pattern**: Module-based architecture with manager classes
- **Styling**: CSS with responsive design and print-specific styles
- **Internationalization**: Built-in language switching between Norwegian and English

### Core Components
The application follows a simplified modular design with core manager classes:
- **App.js**: Main application controller and initialization
- **Student Manager**: Handles student data and CRUD operations
- **Seating Manager**: Handles seating arrangement generation and display
- **Storage Manager**: Manages local storage persistence
- **History Manager**: Provides undo/redo functionality (background only)

### Data Storage
- **Primary Storage**: Browser localStorage
- **Data Format**: JSON serialization
- **Persistence**: Automatic saving of all changes
- **Structure**: Organized into sections (students, constraints, layouts, history, settings)

## Key Components

### Student Management
- Add and delete students
- Drag-and-drop student assignment to seats
- Simple student list management

### Layout System
- **Fixed Layout**: Default classroom layout with left (2x4), middle (3x3), and right (2x4) sections
- Layout matches original provided design with proper spacing

### Seating Algorithm
- **Random**: Random seat assignment only
- Manual drag-and-drop placement
- Click to clear occupied seats

### History and Undo/Redo
- Background history tracking
- Undo/redo functionality with keyboard shortcuts
- History kept in storage but not displayed in UI

## Data Flow

1. **Initialization**: App loads saved data from localStorage
2. **Student Management**: Students are added/edited and automatically saved
3. **Layout Selection**: User selects classroom layout type
4. **Constraint Definition**: Users define seating constraints
5. **Seating Generation**: Algorithm generates seating based on selected method
6. **History Tracking**: All changes are tracked for undo/redo
7. **Export/Print**: Users can export data or print seating arrangements

## External Dependencies

### CDN Dependencies
- **Font Awesome 6.4.0**: Icon library for UI elements
- **Source**: `https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css`

### Browser APIs
- **localStorage**: For data persistence
- **File API**: For import/export functionality
- **Print API**: For printing seating arrangements

## Deployment Strategy

### Static Hosting
- **Type**: Static web application
- **Requirements**: Any web server capable of serving static files
- **Files**: HTML, CSS, JavaScript assets
- **Configuration**: No server-side configuration required

### Browser Compatibility
- **Target**: Modern browsers with ES6+ support
- **Features**: Uses modern JavaScript features (classes, arrow functions, template literals)
- **Storage**: Requires localStorage support
- **Print**: Includes print-specific CSS for physical seating charts

### Language
- **Norwegian Only**: Application uses Norwegian language exclusively
- **No Language Switching**: Language selection removed per user request

### Recent Updates (July 2025)
- **Enhanced Custom Layout Creator**: Now uses drag-and-drop with invisible grid for automatic alignment
- **Improved Image Export**: Saves seating chart with TAVLE and Grupperom labels positioned on the sides
- **Simplified Interface**: Removed header title and undo/redo functionality for cleaner design
- **Grid-Based Designer**: Custom layouts use adjustable dimensions (15x10 default) with draggable desk placement
- **Layout Management**: Save and switch between multiple custom classroom arrangements

The application is designed to be completely self-contained with no backend dependencies, making it easy to deploy on any static hosting platform or run locally in a browser.