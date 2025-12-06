# Portfolio Website

## Overview

A personal portfolio website with an integrated contact form backend. The application features a static frontend built with HTML, CSS, and vanilla JavaScript, complemented by a Node.js/Express backend that handles contact form submissions and stores them in a PostgreSQL database.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Static Site Design**
- The frontend is built using vanilla HTML, CSS, and JavaScript without any frameworks
- Single-page application (SPA) behavior achieved through scroll-based section navigation
- Responsive design using CSS custom properties (CSS variables) for theming
- Mobile-first approach with hamburger menu toggle for smaller screens

**Styling Approach**
- Uses Poppins font family from Google Fonts for consistent typography
- Color scheme defined via CSS variables for easy theme management
- BoxIcons library integrated for iconography
- Sticky header implementation that activates on scroll

**Client-Side Functionality**
- Scroll-based navigation highlighting for active sections
- Mobile menu toggle functionality
- Asynchronous form submission using Fetch API to prevent page reloads
- Form validation handled client-side before server submission

### Backend Architecture

**Server Framework**
- Express.js used as the web server framework
- Serves static files from the root directory
- RESTful API endpoint for contact form submissions
- CORS enabled for cross-origin requests

**Request Handling**
- JSON and URL-encoded body parsing middleware
- Cache control headers set to prevent caching issues in development environments
- Static file serving from parent directory relative to server location

### Data Storage

**PostgreSQL Database**
- Direct PostgreSQL connection using `pg` library (no ORM)
- Connection pool pattern for efficient database connections
- Flexible connection configuration supporting multiple environment variable naming conventions

**Database Schema**
- Single `contacts` table with the following structure:
  - `id`: Auto-incrementing primary key
  - `full_name`: Contact's full name (VARCHAR 100)
  - `email`: Contact's email address (VARCHAR 100)
  - `mobile`: Optional phone number (VARCHAR 20)
  - `subject`: Optional message subject (VARCHAR 200)
  - `message`: Main message content (TEXT)
  - `created_at`: Timestamp of submission (auto-generated)

**Data Persistence Strategy**
- Automatic table creation on server startup if not exists
- No migration system implemented
- Direct SQL queries rather than query builder or ORM

### Configuration Management

**Environment Variables**
- Uses `dotenv` for environment configuration
- Supports multiple naming conventions for database credentials (PGUSER/DB_USER, etc.)
- Fallback to DATABASE_URL for Replit-style deployments
- Default values provided for local development

## External Dependencies

### Frontend Libraries
- **BoxIcons** (v2.1.4 & v3.0.4): Icon library for UI elements
- **Google Fonts**: Poppins font family for typography

### Backend Packages
- **express** (^4.21.2): Web application framework
- **pg** (^8.16.3): PostgreSQL client for Node.js
- **cors** (^2.8.5): Cross-Origin Resource Sharing middleware
- **dotenv** (^17.2.3): Environment variable management

### Development Tools
- **nodemon** (^3.0.2): Development server with auto-restart on file changes

### Database
- **PostgreSQL**: Primary database for storing contact form submissions
- Connection supports both direct credentials and connection string formats
- Compatible with Replit's managed PostgreSQL service