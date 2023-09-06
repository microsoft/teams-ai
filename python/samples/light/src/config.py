"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

import os


class Config:
    """Bot Configuration"""

    port = 3978
    app_id = os.environ.get("MicrosoftAppId", "")
    app_password = os.environ.get("MicrosoftAppPassword", "")
    open_ai_key = os.environ.get("OpenAIKey", "")
