# ratelimit.py - small in-memory sliding-window limiter (single uvicorn process).
import time
from collections import defaultdict, deque
from fastapi import HTTPException, Request

def client_ip(request: Request) -> str:
    # Behind Caddy (and possibly Cloudflare) the socket peer is the proxy.
    h = request.headers
    ip = h.get("cf-connecting-ip") or h.get("x-forwarded-for", "").split(",")[0].strip()
    return ip or (request.client.host if request.client else "?")

class RateLimiter:
    def __init__(self, limit: int, window: int):
        self.limit, self.window = limit, window
        self.hits: dict[str, deque] = defaultdict(deque)

    def _prune(self, key: str, now: float) -> deque:
        q = self.hits[key]
        while q and q[0] <= now - self.window:
            q.popleft()
        if not q:
            del self.hits[key]
            return deque()
        return q

    def check(self, request: Request):
        """Raise 429 if this client is already over the limit."""
        key = client_ip(request)
        if len(self._prune(key, time.time())) >= self.limit:
            raise HTTPException(429, "Too many attempts, try again later")
        return key

    def hit(self, key: str):
        self.hits[key].append(time.time())
