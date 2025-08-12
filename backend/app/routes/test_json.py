"""
Test endpoint to verify JSON responses are working
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

class TestResponse(BaseModel):
    message: str
    test_data: dict

@router.get("/test-json")
async def test_json_response():
    """Simple test endpoint that returns JSON"""
    return TestResponse(
        message="JSON response working correctly",
        test_data={
            "number": 123,
            "string": "test",
            "boolean": True,
            "array": [1, 2, 3],
            "nested": {
                "key": "value"
            }
        }
    )

@router.get("/test-error")
async def test_error_response():
    """Test endpoint that returns an error"""
    raise HTTPException(
        status_code=400,
        detail="This is a test error message"
    )