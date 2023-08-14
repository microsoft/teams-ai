"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.

Description: initialize the api and route incoming messages
to our app
"""

import uvicorn
from app import adapter, app, config
from botbuilder.schema import Activity
from fastapi import FastAPI, Request, Response

api = FastAPI()


@api.post("/api/messages")
async def on_message(req: Request, res: Response):
    body = await req.json()
    activity = Activity().deserialize(body)
    auth_header = req.headers["Authorization"] if "Authorization" in req.headers else ""
    response = await adapter.process_activity(activity, auth_header, app.on_turn)

    if response:
        res.status_code = response.status
        return response.body

    return None


if __name__ == "__main__":
    uvicorn.run("echo.main:api", port=config.port)
