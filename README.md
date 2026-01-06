![Pinger Logo](./static/preview.webp)

# Pinger

A lightweight SvelteKit application that monitors URLs by periodically pinging them and tracking their response times and status codes in real-time.

## Features

- **Automated Monitoring**: Pings all registered URLs every 5 seconds
- **Response Tracking**: Records status codes and response times
- **Real-time Updates**: Live dashboard with server-sent events
- **SQLite Storage**: Persistent data using Prisma ORM
- **Optional Auth**: HTTP Basic Authentication support
- **Modern Stack**: Built with SvelteKit 2, Svelte 5 (runes), and Tailwind CSS 4

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm/pnpm/yarn

### Installation

```sh
# Install dependencies
npm install

# Initialize database
npx prisma migrate dev

# Start development server
npm run dev
```

Visit `http://localhost:5173` to access the application.

## Configuration

### Environment Variables

Create a `.env` file in the project root (optional):

```env
# SQLite Database URL
DATABASE_URL="file:./data.db"

# Optional HTTP Basic Authentication
ACCESS_USERNAME=admin
ACCESS_PASSWORD=secret
```

## Development

```sh
npm run dev              # Start dev server
npm run build            # Production build
npm run preview          # Preview production build
npm test                 # Run tests
npx prisma studio        # Visual database browser
npx prisma migrate dev   # Create database migrations
```

## Docker Deployment

### Build and Run with Docker

```sh
# Build the Docker image
docker build -t pinger .

# Run with ephemeral database (data lost on container restart)
docker run -p 3000:3000 pinger

# Run with persistent database (recommended)
docker run -p 3000:3000 -v $(pwd)/data:/app/data pinger

# Run with environment variables for authentication
docker run -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -e ACCESS_USERNAME=admin \
  -e ACCESS_PASSWORD=secret \
  pinger
```

### Using Docker Compose

Create a `docker-compose.yml` file:

```yaml
version: '3.8'

services:
  pinger:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
    environment:
      - ACCESS_USERNAME=admin
      - ACCESS_PASSWORD=secret
    restart: unless-stopped
```

Then run:

```sh
docker-compose up -d
```

Visit `http://localhost:3000` to access the application.

### Volume Mounting
The database file is stored in `/app/data/data.db` inside the container. To persist data across container restarts:
- **Linux/macOS**: `-v $(pwd)/data:/app/data`
- **Windows (PowerShell)**: `-v ${PWD}/data:/app/data`
- **Windows (CMD)**: `-v %cd%/data:/app/data`

The `data` directory will be created automatically on your host machine if it doesn't exist.

## License

MIT
