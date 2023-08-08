import subprocess


def ci():
    subprocess.run(["poetry", "check"])
    subprocess.run(["poetry", "run", "lint"])
    subprocess.run(["poetry", "run", "test"])
    subprocess.run(["poetry", "build"])
