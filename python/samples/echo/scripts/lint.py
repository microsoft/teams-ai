"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

import subprocess


def lint():
    subprocess.run(["poetry", "run", "pylint", "teams", "scripts", "tests"], check=True)
