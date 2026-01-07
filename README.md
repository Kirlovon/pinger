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

### Quick Start with Docker Compose (Recommended)

The easiest way to deploy with persistent storage:

```sh
# Start the application
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the application
docker-compose down
```

The SQLite database will be stored in `./data/pinger.db` on your host machine and will persist across container restarts and redeployments.

Visit `http://localhost:3000` to access the application.

### Docker Compose Configuration

Enable HTTP Basic Authentication by editing `docker-compose.yml`:

```yaml
environment:
  - ACCESS_USERNAME=admin
  - ACCESS_PASSWORD=secret
```

Then restart: `docker-compose restart`

### Manual Docker Commands

```sh
# Build the Docker image
docker build -t pinger .

# Run with ephemeral database (data lost on container restart)
docker run -p 3000:3000 pinger

# Run with persistent database (recommended)
docker run -p 3000:3000 -v $(pwd)/data:/app/data pinger

# Run with authentication
docker run -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -e ACCESS_USERNAME=admin \
  -e ACCESS_PASSWORD=secret \
  pinger
```

### Volume Mounting

The database file is stored at `/app/data/pinger.db` inside the container. To persist data across redeployments:

- **Linux/macOS**: `-v $(pwd)/data:/app/data`
- **Windows (PowerShell)**: `-v ${PWD}/data:/app/data`
- **Windows (CMD)**: `-v %cd%/data:/app/data`

The `data` directory on your host machine will contain:
- `pinger.db` - SQLite database file
- `pinger.db-journal` - SQLite journal file (temporary)

These files will persist across container restarts, updates, and redeployments.

## License

MIT
