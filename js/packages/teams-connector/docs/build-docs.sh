#!/bin/bash

typedoc --entryPoint botbuilder-ai --excludePrivate --includeDeclarations --ignoreCompilerErrors --module amd --out doc ../lib/index.d.ts --hideGenerator --name "Bot Builder SDK - AI" --readme none
