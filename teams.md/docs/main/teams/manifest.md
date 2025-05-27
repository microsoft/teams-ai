---
sidebar_position: 2
---

# Teams Manifest

Every app or agent installed on Teams requires an app manifest json file, which provides important information and permissions to that app. When sideloading the app, you are required to provide the app manifest via zip which also includes the icons for the app.

## Manifest

There are many permissions and details that an app manifest may have added to the `manifest.json`, including the app ID, url, and much more. Please review the comprehensive documentation on the [manifest schema](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema).

## Sideloading

Sideloading is the ability to install and test your app before it is published to your organization's Teams App management page. To sideload, please see the official [Sideloading Microsoft Learn documentation](https://learn.microsoft.com/en-us/microsoftteams/platform/concepts/deploy-and-publish/apps-upload).

To sideload, the manifest mentioned above must have all information (such as app id, tenant information, permissions, etc.) filled out, and be placed in a zip with the icons, but the zip should **NOT** include a containing folder of those files.

For convenient assistance with managing your manifest and automating important functionality like sideloading, deployment, and provisioning, we recommend the [Microsoft 365 Agents Toolkit extension](https://learn.microsoft.com/en-us/microsoftteams/platform/toolkit/install-teams-toolkit)) and [CLI](https://learn.microsoft.com/en-us/microsoftteams/platform/toolkit/microsoft-365-agents-toolkit-cli). Please continue to the [Toolkit documentation](./agents-toolkit) to learn more.