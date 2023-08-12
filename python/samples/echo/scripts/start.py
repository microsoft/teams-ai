"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

import subprocess


def start():
    subprocess.run(["poetry", "run", "python", "echo/main.py"], check=False)
