"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

import subprocess
from pathlib import Path


def ci():
    for e in Path("./packages").glob("*"):
        if e.is_dir():
            print("------ " + e.name + " ------")
            subprocess.run(["poetry", "run", "ci"], cwd=e.absolute()).check_returncode()
