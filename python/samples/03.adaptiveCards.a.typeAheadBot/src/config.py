"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

import os

from dotenv import load_dotenv

load_dotenv()


class Config:
    """Bot Configuration"""

    PORT = 3978
    BOT_ID = os.environ["BOT_ID"]
    BOT_PASSWORD = os.environ["BOT_PASSWORD"]
