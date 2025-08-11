"""API Usage Tracker for Sunny Platform"""
from datetime import datetime
from typing import Dict, Any
import json
import os

class APIUsageTracker:
    """Track Anthropic API usage and costs"""
    
    def __init__(self):
        self.usage_file = "api_usage_log.json"
        self.current_session = {
            "start_time": datetime.now().isoformat(),
            "total_tokens": 0,
            "total_requests": 0,
            "estimated_cost": 0.0
        }
        self.load_history()
    
    def load_history(self):
        """Load usage history from file"""
        if os.path.exists(self.usage_file):
            try:
                with open(self.usage_file, 'r') as f:
                    self.history = json.load(f)
            except:
                self.history = {"daily": {}, "total": {"tokens": 0, "cost": 0.0}}
        else:
            self.history = {"daily": {}, "total": {"tokens": 0, "cost": 0.0}}
    
    def track_usage(self, tokens_used: int, model: str = "claude-3-5-sonnet-20241022"):
        """Track API usage and calculate cost"""
        # Pricing: $3 per million input, $15 per million output
        # Estimate 30% input, 70% output
        input_tokens = int(tokens_used * 0.3)
        output_tokens = int(tokens_used * 0.7)
        
        input_cost = (input_tokens / 1_000_000) * 3.00
        output_cost = (output_tokens / 1_000_000) * 15.00
        total_cost = input_cost + output_cost
        
        # Update session
        self.current_session["total_tokens"] += tokens_used
        self.current_session["total_requests"] += 1
        self.current_session["estimated_cost"] += total_cost
        
        # Update daily history
        today = datetime.now().strftime("%Y-%m-%d")
        if today not in self.history["daily"]:
            self.history["daily"][today] = {"tokens": 0, "requests": 0, "cost": 0.0}
        
        self.history["daily"][today]["tokens"] += tokens_used
        self.history["daily"][today]["requests"] += 1
        self.history["daily"][today]["cost"] += total_cost
        
        # Update total
        self.history["total"]["tokens"] += tokens_used
        self.history["total"]["cost"] += total_cost
        
        # Save to file
        self.save_history()
        
        # Log for debugging
        print(f"DEBUG USAGE: Tracked {tokens_used} tokens, cost: ${total_cost:.4f}")
        print(f"DEBUG USAGE: Session total: {self.current_session['total_tokens']} tokens, ${self.current_session['estimated_cost']:.2f}")
        
        return {
            "tokens_used": tokens_used,
            "cost_estimate": f"${total_cost:.4f}",
            "session_total": f"${self.current_session['estimated_cost']:.2f}",
            "daily_total": f"${self.history['daily'][today]['cost']:.2f}"
        }
    
    def save_history(self):
        """Save usage history to file"""
        try:
            with open(self.usage_file, 'w') as f:
                json.dump(self.history, f, indent=2)
        except Exception as e:
            print(f"DEBUG ERROR: Failed to save usage history: {e}")
    
    def get_summary(self) -> Dict[str, Any]:
        """Get usage summary"""
        today = datetime.now().strftime("%Y-%m-%d")
        daily_stats = self.history["daily"].get(today, {"tokens": 0, "requests": 0, "cost": 0.0})
        
        return {
            "session": {
                "tokens": self.current_session["total_tokens"],
                "requests": self.current_session["total_requests"],
                "cost": f"${self.current_session['estimated_cost']:.2f}"
            },
            "today": {
                "tokens": daily_stats["tokens"],
                "requests": daily_stats["requests"],
                "cost": f"${daily_stats['cost']:.2f}"
            },
            "all_time": {
                "tokens": self.history["total"]["tokens"],
                "cost": f"${self.history['total']['cost']:.2f}"
            },
            "model": "claude-3-5-sonnet-20241022",
            "pricing": "$3/M input, $15/M output"
        }

# Global tracker instance
usage_tracker = APIUsageTracker()