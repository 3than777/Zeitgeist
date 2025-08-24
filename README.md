# Zeitgeist - AI Stock Forecaster

An AI-powered stock prediction service that analyzes options data using Polygon.io and generates predictions using OpenAI GPT models.

## Features

- Real-time stock price predictions based on options flow analysis
- Integration with Polygon.io for market data
- AI-powered analysis using OpenAI GPT-4
- RESTful API with FastAPI
- Docker support for easy deployment
- Comprehensive test coverage

## Quick Start

### Prerequisites

- Python 3.11+
- Polygon.io API key
- OpenAI API key

### Installation

1. Clone the repository
2. Copy `.env.example` to `.env` and add your API keys:
   ```bash
   cp .env.example .env
   ```

3. Install dependencies:
   ```bash
   make install
   ```

### Running Locally

```bash
make run
```

The API will be available at `http://localhost:8000`
API documentation: `http://localhost:8000/api/v1/docs`

### Running with Docker

```bash
docker-compose up
```

## API Endpoints

- `POST /api/v1/predictions/predict` - Generate a prediction for a stock
- `GET /api/v1/predictions/predict/{ticker}` - Quick prediction for a ticker
- `POST /api/v1/predictions/batch-predict` - Batch predictions for multiple tickers
- `GET /api/v1/health/` - Health check

## Testing

Run tests with coverage:
```bash
make test
```

## Deployment

The project includes configurations for:
- Railway (railway.json)
- Render (render.yaml)
- Fly.io (fly.toml)
- Docker/Kubernetes

## Project Structure

- `app/` - Main application code
  - `api/` - API endpoints
  - `services/` - Business logic services
  - `models/` - Data models
  - `core/` - Core utilities
- `tests/` - Test suite
- `deployment/` - Deployment configurations
- `docker/` - Docker files

## License

MIT
