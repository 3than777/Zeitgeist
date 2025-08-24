from typing import Dict, Any, List
from datetime import datetime

def format_price(price: float) -> str:
    """Format price with appropriate decimal places"""
    if price >= 1000:
        return f"${price:,.0f}"
    elif price >= 100:
        return f"${price:.2f}"
    else:
        return f"${price:.4f}"

def format_percentage(value: float) -> str:
    """Format percentage with sign"""
    sign = "+" if value >= 0 else ""
    return f"{sign}{value:.2f}%"

def format_large_number(value: int) -> str:
    """Format large numbers with K/M/B suffixes"""
    if value >= 1_000_000_000:
        return f"{value / 1_000_000_000:.1f}B"
    elif value >= 1_000_000:
        return f"{value / 1_000_000:.1f}M"
    elif value >= 1_000:
        return f"{value / 1_000:.1f}K"
    else:
        return str(value)

def format_options_summary(options_data: Dict[str, Any]) -> str:
    """Format options data into readable summary"""
    lines = []
    lines.append(f"Put/Call Ratio: {options_data.get('put_call_ratio', 0):.2f}")
    lines.append(f"Total Volume: {format_large_number(options_data.get('total_volume', 0))}")
    lines.append(f"Open Interest: {format_large_number(options_data.get('open_interest', 0))}")
    
    if 'iv_rank' in options_data:
        lines.append(f"IV Rank: {options_data['iv_rank']:.0f}%")
    
    return "\n".join(lines)