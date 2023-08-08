"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

import subprocess


def test():
    subprocess.run(["poetry", "run", "pytest"])
