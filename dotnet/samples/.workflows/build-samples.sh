#!/bin/bash

## Build all the samples ##

# Sets the current working directory to the "samples/" directory
cd "$(dirname "$0")" || exit
cd .. || exit

SAMPLE_FOLDER=""
USE_LOCAL_PACKAGE=true

# if "-s" option is provided, it will only build specified sample
while getopts 'ds:' opt; do
  case $opt in
    s)
      arg=$OPTARG
      SAMPLE_FOLDER=$OPTARG
      echo "Processing local build for '${OPTARG}' sample"
      ;;

    d)
      USE_LOCAL_PACKAGE=false
      echo "Using deployed package (nuget.org) for local build"
      ;;

    ?)
      echo "Usage: $(basename $0) [-s <sample-folder>] [-d]"
      echo "-s <sample-folder> : Build specified sample"
      echo "-d : Use deployed package (nuget.org) for local build"
      exit 1
      ;;
  esac
done

if [ "$USE_LOCAL_PACKAGE" = true ]; then
  # Pack library
  dotnet pack ../packages/Microsoft.TeamsAI/Microsoft.TeamsAI

  # Create LocalPkg/ if it does not already exist
  mkdir -p LocalPkg

  # Move .nupkg to LocalPkg/
  mv ../packages/Microsoft.TeamsAI/Microsoft.TeamsAI/bin/Release/*.nupkg ./LocalPkg

  # Create NuGet.Config if it does not already exist
  if [ ! -f NuGet.Config ]; then
    cp .workflows/NuGet.Config .
  fi
else 
  # Remove Nuget.Config if it exists
  if [ -f NuGet.Config ]; then
    rm NuGet.Config
  fi

  # Remove LocalPkg/ if it exists
  if [ -d LocalPkg ]; then
    rm -rf LocalPkg
  fi
fi

# Clear nuget local cache
dotnet nuget locals global-packages -c

# If var is empty, conditions is true
if [ -z $SAMPLE_FOLDER ]; then
  for p in $(find . -name "*.csproj"); do dotnet build $p; done
else
  dotnet build $SAMPLE_FOLDER;
fi
