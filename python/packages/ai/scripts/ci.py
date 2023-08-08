"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

import subprocess


def ci():
    subprocess.run(["poetry", "check"]).check_returncode()
    subprocess.run(["poetry", "run", "lint"]).check_returncode()
    subprocess.run(["poetry", "run", "test"]).check_returncode()
    subprocess.run(["poetry", "build"]).check_returncode()
