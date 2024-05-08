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
    APP_ID = os.environ["BOT_ID"]
    APP_PASSWORD = os.environ["BOT_PASSWORD"]
    AAD_APP_CLIENT_ID = os.environ["AAD_APP_CLIENT_ID"]
    AAD_APP_CLIENT_SECRET = os.environ["AAD_APP_CLIENT_SECRET"]
    AAD_APP_OAUTH_AUTHORITY_HOST = os.environ["AAD_APP_OAUTH_AUTHORITY_HOST"]
    AAD_APP_TENANT_ID = os.environ["AAD_APP_TENANT_ID"]
    BOT_DOMAIN = os.environ["BOT_DOMAIN"]
