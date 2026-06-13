from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class FrustratedCustomer(BaseModel):
    id: str
    name: str
    phone: str
    last_message: str
    time: str

class AnalyticsDashboardResponse(BaseModel):
    total_inbound: int
    total_outbound_ai: int
    ai_handling_rate: float
    sentiment_breakdown: List[Dict[str, Any]]
    attention_required: List[FrustratedCustomer]
