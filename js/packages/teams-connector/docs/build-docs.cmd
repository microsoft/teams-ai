@ECHO OFF
ECHO [COMPILING DOCS]
md ..\..\..\docs
md ..\..\..\docs\connector
typedoc --theme markdown --entryPoint botframework-connector --excludePrivate --includeDeclarations --ignoreCompilerErrors --module amd --out ..\..\..\docs\connector ..\lib\connectorClient.d.ts --hideGenerator --name "Bot Framework Connector" --readme none
