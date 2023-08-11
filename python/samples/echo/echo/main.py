import uvicorn
from fastapi import FastAPI, Request, Response
from botbuilder.schema import Activity

from app import app, config, adapter

api = FastAPI()

@api.post("/api/messages")
async def on_message(req: Request, res: Response):
    body = await req.json()
    activity = Activity().deserialize(body)
    auth_header = req.headers["Authorization"] if "Authorization" in req.headers else ""
    response = await adapter.process_activity(
        activity,
        auth_header,
        app.on_turn
    )

    if response:
        res.status_code = response.status
        return response.body
    
    return None

if __name__ == "__main__":
    uvicorn.run("echo.main:api", port=config.port)
