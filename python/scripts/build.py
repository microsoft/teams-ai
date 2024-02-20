"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

import subprocess
from pathlib import Path


for e in Path("./packages").glob("*"):
    if e.is_dir():
        print("------ Package[" + e.name + "] ------")
        subprocess.run(["poetry", "build"], cwd=e.absolute(), check=True)
