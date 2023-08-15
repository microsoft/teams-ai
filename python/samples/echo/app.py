"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

import uvicorn

from echo.bot import config
from echo.api import api

if __name__ == "__main__":
    uvicorn.run(api, port=config.port)
