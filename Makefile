.PHONY: help install run test lint format clean docker-build docker-run

help:
	@echo "Available commands:"
	@echo "  install    Install dependencies"
	@echo "  run        Run local server"
	@echo "  test       Run tests"
	@echo "  lint       Run linters"
	@echo "  format     Format code"
	@echo "  clean      Clean cache files"

install:
	pip install -r requirements.txt
	pip install -r requirements-dev.txt
	pre-commit install

run:
	uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

run-prod:
	uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4

test:
	pytest tests/ -v --cov=app --cov-report=html

lint:
	ruff check app/ tests/
	black --check app/ tests/

format:
	black app/ tests/
	ruff check --fix app/ tests/

docker-build:
	docker build -t stock-forecaster .

docker-run:
	docker run -p 8000:8000 --env-file .env.local stock-forecaster

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	rm -rf .pytest_cache .coverage htmlcov/