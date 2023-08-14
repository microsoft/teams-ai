"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

import subprocess
from pathlib import Path


def check():
    for e in Path("./packages").glob("*"):
        if e.is_dir():
            print("------ " + e.name + " ------")
            subprocess.run(["poetry", "check"], cwd=e.absolute()).check_returncode()
