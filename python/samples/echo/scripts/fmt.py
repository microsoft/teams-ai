"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

import subprocess


def fmt():
    subprocess.run(["poetry", "run", "black", "echo", "scripts", "tests"], check=True)
    subprocess.run(["poetry", "run", "isort", "echo", "scripts", "tests"], check=True)
