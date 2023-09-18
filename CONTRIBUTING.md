# Instructions for Contributing Code

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
You may visit https://cla.azure.com to sign digitally. Alternatively, download the
agreement ([Microsoft Contribution License Agreement.docx](https://www.codeplex.com/Download?ProjectName=typescript&DownloadId=822190) or
[Microsoft Contribution License Agreement.pdf](https://www.codeplex.com/Download?ProjectName=typescript&DownloadId=921298)), sign, scan,
and email it back to <cla@microsoft.com>. Be sure to include your github user name along with the agreement. Once we have received the
signed CLA, we'll review the request.

## PR styling requirements

1. All PRs must indicate what programming language they are for in the title with a prefix of [JS], [C#] [PY], or [repo].
1. All PRs must be prepended with one of the following keywords:
   - _'bump'_ - indicates a change to the version number of the package
     - note: ':' was removed since dependabot automatically starts all PR titles with 'bump'
   - _'chore:'_ - indicates a change to the build process or auxiliary tools
   - _'docs:'_ - indicates a change to the documentation
   - _'feat:'_ - indicates a new feature
   - _'fix:'_ - indicates a bug fix
   - _'port:'_ - indicates a port of a feature from another language
   - _'refactor:'_ - indicates a code change that neither fixes a bug nor adds a feature
1. All PRs must have an associated work item link in the title and the body of the PR.
   - e.g. [JS] feat: #999 Add new feature

The purpose of this is to allow for easier filtering when creating changelogs and release notes.
