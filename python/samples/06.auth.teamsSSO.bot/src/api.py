"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.

Description: initialize the api and route incoming messages
to our app
"""
from http import HTTPStatus

from aiohttp import web
from botbuilder.core.integration import aiohttp_error_middleware

from bot import app

routes = web.RouteTableDef()


@routes.post("/api/messages")
async def on_messages(req: web.Request) -> web.Response:
    res = await app.process(req)

    if res is not None:
        return res

    return web.Response(status=HTTPStatus.OK)

@routes.get("/auth-start.html")
async def on_auth_start(req: web.Request) -> web.FileResponse:
    return web.FileResponse(path="./public/auth-start.html")

@routes.get("/auth-end.html")
async def on_auth_end(req: web.Request) -> web.FileResponse:
    return web.FileResponse(path="./public/auth-end.html")

api = web.Application(middlewares=[aiohttp_error_middleware])
api.add_routes(routes)
