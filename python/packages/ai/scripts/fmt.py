"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

import subprocess


def fmt():
    subprocess.run(["poetry", "run", "black", "teams", "scripts", "tests"], check=True)
    subprocess.run(["poetry", "run", "isort", "teams", "scripts", "tests"], check=True)
