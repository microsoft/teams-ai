"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

import uvicorn

from src.api import api
from src.bot import config

if __name__ == "__main__":
    uvicorn.run(api, port=config.port)
