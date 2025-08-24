from typing import Dict, Any
from datetime import datetime
import time
from contextlib import contextmanager

class MetricsCollector:
    """Simple metrics collector"""
    def __init__(self):
        self.metrics = {
            "requests": 0,
            "errors": 0,
            "latencies": [],
            "api_calls": {
                "polygon": 0,
                "openai": 0
            }
        }
    
    def increment_requests(self):
        self.metrics["requests"] += 1
    
    def increment_errors(self):
        self.metrics["errors"] += 1
    
    def increment_api_call(self, service: str):
        if service in self.metrics["api_calls"]:
            self.metrics["api_calls"][service] += 1
    
    def add_latency(self, latency: float):
        self.metrics["latencies"].append(latency)
        # Keep only last 1000 latencies
        if len(self.metrics["latencies"]) > 1000:
            self.metrics["latencies"] = self.metrics["latencies"][-1000:]
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get current metrics"""
        latencies = self.metrics["latencies"]
        avg_latency = sum(latencies) / len(latencies) if latencies else 0
        
        return {
            "total_requests": self.metrics["requests"],
            "total_errors": self.metrics["errors"],
            "error_rate": self.metrics["errors"] / max(1, self.metrics["requests"]),
            "average_latency_ms": avg_latency * 1000,
            "api_calls": self.metrics["api_calls"],
            "timestamp": datetime.now().isoformat()
        }

# Global metrics collector
metrics = MetricsCollector()

@contextmanager
def measure_latency():
    """Context manager to measure execution time"""
    start = time.time()
    yield
    latency = time.time() - start
    metrics.add_latency(latency)