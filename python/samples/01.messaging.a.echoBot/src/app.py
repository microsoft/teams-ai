"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from api import api
from config import Config

if __name__ == "__main__":
    api.run(host="localhost", port=Config.PORT)
