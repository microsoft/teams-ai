"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

import subprocess
from pathlib import Path


for e in Path("./packages").glob("*"):
    if e.is_dir():
        print("------ Package[" + e.name + "] ------")
        subprocess.run(["poetry", "run", "lint"], cwd=e.absolute(), check=True)

for e in Path("./samples").glob("*"):
    if e.is_dir():
        print("------ Samples[" + e.name + "] ------")
        subprocess.run(["pylint", "src"], cwd=e.absolute(), check=True)
        subprocess.run(["mypy", "-p", "src"], cwd=e.absolute(), check=True)