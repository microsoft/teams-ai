"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

import subprocess


def fmt():
    subprocess.run([
        "poetry", "run", "yapf", ".", "--recursive", "--in-place",
        "--parallel", "--print-modified"
    ])
