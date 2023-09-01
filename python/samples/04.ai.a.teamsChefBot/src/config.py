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
    AZURE_OPENAI_KEY = os.environ["AZURE_OPENAI_KEY"]
    AZURE_OPENAI_ENDPOINT = os.environ["AZURE_OPENAI_ENDPOINT"]
    AZURE_OPENAI_MODEL_DEPLOYMENT_NAME = os.environ[
        "AZURE_OPENAI_MODEL_DEPLOYMENT_NAME"
    ]
