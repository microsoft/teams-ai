"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

import subprocess
from pathlib import Path


def clean():
    for e in Path("./packages").glob("*"):
        if e.is_dir():
            print("------ " + e.name + " ------")
            subprocess.run(["poetry", "run", "clean"], cwd=e.absolute()).check_returncode()
