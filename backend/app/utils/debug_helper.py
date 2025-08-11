import asyncio
import functools
import time
from datetime import datetime
from typing import Any, Dict

def debug(category: str, description: str, **kwargs: Any) -> None:
    """Universal debug logging with enhanced categories"""
    timestamp = datetime.now().strftime("%H:%M:%S.%f")[:-3]
    metrics = ", ".join([f"{k}: {v}" for k, v in kwargs.items()])
    metrics_str = f" - {metrics}" if metrics else ""
    print(f"DEBUG {category}: {description}{metrics_str} [{timestamp}]")

def debug_decorator(category: str = None):
    """Automatic function entry/exit debugging"""
    def decorator(func):
        @functools.wraps(func)
        async def async_wrapper(*args, **kwargs):
            cat = category or "ENTRY/EXIT"
            func_name = func.__name__
            debug(cat, f"Entering {func_name}", args_count=len(args), kwargs_count=len(kwargs))
            start_time = time.time()
            try:
                result = await func(*args, **kwargs)
                duration = (time.time() - start_time) * 1000
                debug(cat, f"Exiting {func_name}", duration_ms=f"{duration:.2f}", success=True)
                return result
            except Exception as e:
                duration = (time.time() - start_time) * 1000
                debug("ERROR", f"Exception in {func_name}: {str(e)}", duration_ms=f"{duration:.2f}")
                raise
        
        @functools.wraps(func)
        def sync_wrapper(*args, **kwargs):
            cat = category or "ENTRY/EXIT"
            func_name = func.__name__
            debug(cat, f"Entering {func_name}", args_count=len(args), kwargs_count=len(kwargs))
            start_time = time.time()
            try:
                result = func(*args, **kwargs)
                duration = (time.time() - start_time) * 1000
                debug(cat, f"Exiting {func_name}", duration_ms=f"{duration:.2f}", success=True)
                return result
            except Exception as e:
                duration = (time.time() - start_time) * 1000
                debug("ERROR", f"Exception in {func_name}: {str(e)}", duration_ms=f"{duration:.2f}")
                raise
        
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper
    return decorator

def debug_api(operation: str, **kwargs: Any) -> None:
    debug("API", operation, **kwargs)

def debug_auth(operation: str, **kwargs: Any) -> None:
    debug("AUTH", operation, **kwargs)

def debug_claude(operation: str, **kwargs: Any) -> None:
    debug("CLAUDE", operation, **kwargs)

def debug_client(operation: str, **kwargs: Any) -> None:
    debug("CLIENT", operation, **kwargs)

def debug_google(operation: str, **kwargs: Any) -> None:
    debug("GOOGLE", operation, **kwargs)

def debug_proposal(operation: str, **kwargs: Any) -> None:
    debug("PROPOSAL", operation, **kwargs)

def debug_session(operation: str, **kwargs: Any) -> None:
    debug("SESSION", operation, **kwargs)