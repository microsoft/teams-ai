"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

import subprocess
import sys


def lint():
    result = subprocess.run(["poetry", "run", "pylint", "teams", "scripts", "tests"], check=False)
    exit_code = result.returncode
    # Check if there is any fatal or error message
    # Other level of messages will not fail lint
    if exit_code & 1 or exit_code & 2:
        sys.exit(exit_code)
