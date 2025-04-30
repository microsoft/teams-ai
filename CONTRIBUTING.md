# Instructions for Contributing Code

Teams AI v2 is a mono-repo that hosts GitHub submodules to other repos that contain code by language. The submodules in this repository uses the latest commit from those submodules. To make changes to Teams AI v2 Typescript, C#, etc., please use the following repos:

1. [Teams.ts](https://github.com/microsoft/teams.ts)
2. [Teams.net] (TBD)

Please note that as of August 2023, signed commits are required for all contributions to this project. For more information on how to set up, see the [GitHub Authentication verify commit signature](https://docs.github.com/en/authentication/managing-commit-signature-verification/about-commit-signature-verification) documentation.

## Contributing bug fixes and features

This project welcomes contributions and suggestions. Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.opensource.microsoft.com.

When you submit a pull request, a CLA bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., status check, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

Microsoft Teams is currently accepting contributions in the form of bug fixes and new
features. Any submission must have an issue tracking it in the issue tracker that has
been approved by the Teams AI team. Your pull request should include a link to
the bug that you are fixing. If you've submitted a PR for a bug, please post a
comment in the bug to avoid duplication of effort.

## Legal

If your contribution is more than 15 lines of code, you will need to complete a Contributor
License Agreement (CLA). Briefly, this agreement testifies that you are granting us permission
to use the submitted change according to the terms of the project's license, and that the work
being submitted is under appropriate copyright.

Please submit a Contributor License Agreement (CLA) before submitting a pull request.
You may visit https://cla.azure.com to sign digitally.

## Contributing guide

### Documentation

Please note that we place high importance on documentation, which we host as [Teams AI v2 github pages](https://microsoft.github.io/teams-ai/). To learn how to add documentation to your contributions, please see the [mdbook's readme](./book/README.md).

### Testing changes

Please use any of the agents in the [tests]
