# Quickstart

<small>**Navigation**</small>

- [OVERVIEW](./README.md)
- [**QUICKSTART**](./QUICKSTART.md)
- [SAMPLES](./SAMPLES.md)
- [CONCEPTS](../CONCEPTS/README.md)
- [MIGRATION](../MIGRATION/README.md)
- [OTHER](../OTHER/README.md)

---

In this quickstart we will show you how to get the Echo Bot up and running. The Echo Bot echoes back messages sent to it while keeping track of the number of messages sent by the user.

- [C# Quickstart](#c-quickstart)
- [Javascript Quickstart](#javascript-quickstart)
- [Python Quickstart](#python-quickstart)

## C# Quickstart

This guide will show you have the set up the Echo Bot using the C# library.

### Prerequisites

To get started, ensure that you have the following tools:

| Install                                                                                                                                                | For using...                                                                                                                                                                                                                                                        |
| ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Visual Studio](https://visualstudio.microsoft.com/downloads/) (17.7.0 or greater)                                                                     | C# build environments. Use the latest version.                                                                                                                                                                                                                      |
| [Teams Toolkit](https://learn.microsoft.com/en-us/microsoftteams/platform/toolkit/toolkit-v4/teams-toolkit-fundamentals-vs?pivots=visual-studio-v17-7) | Microsoft Visual Studio extension that creates a project scaffolding for your app. Use the latest version.                                                                                                                                                          |
| [Git](https://git-scm.com/downloads)                                                                                                                   | Git is a version control system that helps you manage different versions of code within a repository.                                                                                                                                                               |
| [Microsoft Teams](https://www.microsoft.com/microsoft-teams/download-app)                                                                              | Microsoft Teams to collaborate with everyone you work with through apps for chat, meetings, and call-all in one place.                                                                                                                                              |
| [Microsoft&nbsp;Edge](https://www.microsoft.com/edge) (recommended) or [Google Chrome](https://www.google.com/chrome/)                                 | A browser with developer tools.                                                                                                                                                                                                                                     |
| [Microsoft 365 developer account](/microsoftteams/platform/concepts/build-and-test/prepare-your-o365-tenant)                                           | Access to Teams account with the appropriate permissions to install an app and [enable custom Teams apps and turn on custom app uploading](../../../concepts/build-and-test/prepare-your-o365-tenant.md#enable-custom-teams-apps-and-turn-on-custom-app-uploading). |

<br/>

### Build and run the sample app

1. Clone the teams-ai repository

   ```cmd
   git clone https://github.com/microsoft/teams-ai.git
   ```

2. Open **Visual Studio** and select `Open a project or a solution`.

3. Navigate to the `teams-ai/dotnet/samples/01.messaging.echoBot` folder and open the `Echobot.sln` file.

4. In the debug dropdown menu, select _Dev Tunnels > Create A Tunnel_ (Tunnel type: `Persistent` & Access: `Public`) or select an existing public dev tunnel. Ensure that the dev tunnel is selected.

   ![create a tunnel](https://learn.microsoft.com/en-us/microsoftteams/platform/assets/images/bots/dotnet-ai-library-dev-tunnel.png)

5. Right-click your project and select _Teams Toolkit > Prepare Teams App Dependencies_

   ![prepare teams app dependencies](https://learn.microsoft.com/en-us/microsoftteams/platform/assets/images/bots/dotnet-ai-library-prepare-teams-app.png)

   > Note: If you are running into errors in this step, ensure that you have correctly configured the dev tunnels in step 4.

6. If prompted, sign in with a Microsoft 365 account for the Teams organization you want to install the app to.

   > If you do not have permission to upload custom apps (sideloading), Teams Toolkit will recommend creating and using a [Microsoft 365 Developer Program](https://developer.microsoft.com/microsoft-365/dev-program) account - a free program to get your own dev environment sandbox that includes Teams.

7. Press F5, or select the `Debug > Start Debugging` menu in Visual Studio. If step 3 was completed correctly then this should launch Teams on the browser.

8. You should be prompted to sideload a bot into teams. Click the `Add` button to load the app in Teams.

   ![add echobot](./assets/quickstart-echobot-add.png)

9. This should redirect you to a chat window with the bot.

   ![demo-image](./assets/quickstart-echobot-demo.png)

## Javascript Quickstart

This guide will show you have the set up the Echo Bot using the JS library.

### Prerequisite

| Install                                                                                                                       | For using...                                                                                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Visual Studio Code](https://code.visualstudio.com/download)                                                                  | Typescript build environments. Use the latest version.                                                                                                                                                                                                              |
| [Teams Toolkit](https://marketplace.visualstudio.com/items?itemName=TeamsDevApp.ms-teams-vscode-extension) (5.3.x or greater) | Microsoft Visual Studio Code extension that creates a project scaffolding for your app. Use the latest version.                                                                                                                                                     |
| [Git](https://git-scm.com/downloads)                                                                                          | Git is a version control system that helps you manage different versions of code within a repository.                                                                                                                                                               |
| [Node.js](https://nodejs.org/en) (16 or 18)                                                                                   | Microsoft Teams to collaborate with everyone you work with through apps for chat, meetings, and call-all in one place.                                                                                                                                              |
| [Microsoft Teams](https://www.microsoft.com/microsoft-teams/download-app)                                                     | Microsoft Teams to collaborate with everyone you work with through apps for chat, meetings, and call-all in one place.                                                                                                                                              |
| [Microsoft&nbsp;Edge](https://www.microsoft.com/edge) (recommended) or [Google Chrome](https://www.google.com/chrome/)        | A browser with developer tools.                                                                                                                                                                                                                                     |
| [Microsoft 365 developer account](/microsoftteams/platform/concepts/build-and-test/prepare-your-o365-tenant)                  | Access to Teams account with the appropriate permissions to install an app and [enable custom Teams apps and turn on custom app uploading](../../../concepts/build-and-test/prepare-your-o365-tenant.md#enable-custom-teams-apps-and-turn-on-custom-app-uploading). |
| [Yarn](https://yarnpkg.com/) (1.22.x or greater)                                                                              | Node.js package manager used to install dependencies and build samples.                                                                                                                                                                                             |

### Build and run the sample app

1. Clone the repository.

   ```cmd
   git clone https://github.com/microsoft/teams-ai.git
   ```

2. Go to **Visual Studio Code**.

3. Select `File > Open Folder`.

4. Go to the location where you cloned teams-ai repo and select the `teams-ai` folder.

5. Click `Select Folder`.

   ![:::image type="content" source="../../../assets/images/bots/ai-library-dot-net-select-folder.png" alt-text="Screenshot shows the teams-ai folder and the Select Folder option.":::](https://learn.microsoft.com/en-us/microsoftteams/platform/assets/images/bots/ai-library-dot-net-select-folder.png)

6. Select `View > Terminal`. A terminal window opens.

7. In the terminal window, run the following command to go to the js folder:

   ```
   cd ./js/
   ```

8. Run the following command to install dependencies:

   ```terminal
   yarn install
   ```

9. Run the following command to build project and samples:

   ```terminal
   yarn build
   ```

10. After the dependencies are installed and project is built, select `File > Open Folder`.

11. Go to `teams-ai > js > samples > 01.messaging.a.echoBot` and click `Select Folder`. This open the echo bot sample folder in vscode.

12. From the left pane, select `Teams Toolkit`.

13. Under `ACCOUNTS`, sign in to the following:

    - **Microsoft 365 account**

14. To debug your app, press the **F5** key.

    A browser tab opens a Teams web client requesting to add the bot to your tenant.

15. Select **Add**.

    ![add-image](./assets/quickstart-echobot-add.png)

    A chat window opens.

16. In the message compose area, send a message to invoke the bot.

    ![demo-image](./assets/quickstart-echobot-demo.png)

The bot will echo back what the user sends it while keeping track of the number of messages sent by the user.

## Python Quickstart

This guide will show you have the set up the Echo Bot using the Python library.

### Prerequisites

To get started, ensure that you have the following tools:

| Install                                                                                                                       | For using...                                                                                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| [Visual Studio Code](https://code.visualstudio.com/download)                                                                  | Python build environments. Use the latest version.                                                                                                                                                                                                                  |
| [Teams Toolkit](https://marketplace.visualstudio.com/items?itemName=TeamsDevApp.ms-teams-vscode-extension) (5.3.x or greater) | Microsoft Visual Studio Code extension that creates a project scaffolding for your app. Use the latest version.                                                                                                                                                     |
| [Git](https://git-scm.com/downloads)                                                                                          | Git is a version control system that helps you manage different versions of code within a repository.                                                                                                                                                               |
| [Python](https://www.python.org/downloads/) (>=3.8)                                                                           | Python programming language                                                                                                                                                                                                                                         |
| [Poetry](https://python-poetry.org/docs/)                                                                                     | Dependency management and packaging tool for Python                                                                                                                                                                                                                 |     |
| [Python VSCode Extension](https://marketplace.visualstudio.com/items?itemName=ms-python.python)                               | Provides rich support for Python on VSCode                                                                                                                                                                                                                          |     |
| [Microsoft Teams](https://www.microsoft.com/microsoft-teams/download-app)                                                     | Microsoft Teams to collaborate with everyone you work with through apps for chat, meetings, and call-all in one place.                                                                                                                                              |
| [Microsoft&nbsp;Edge](https://www.microsoft.com/edge) (recommended) or [Google Chrome](https://www.google.com/chrome/)        | A browser with developer tools.                                                                                                                                                                                                                                     |
| [Microsoft 365 developer account](/microsoftteams/platform/concepts/build-and-test/prepare-your-o365-tenant)                  | Access to Teams account with the appropriate permissions to install an app and [enable custom Teams apps and turn on custom app uploading](../../../concepts/build-and-test/prepare-your-o365-tenant.md#enable-custom-teams-apps-and-turn-on-custom-app-uploading). |     |

### Build and run the sample app

1. Clone the repository.

   ```cmd
   git clone https://github.com/microsoft/teams-ai.git
   ```

2. Go to **Visual Studio Code**.

3. Select `File > Open Folder`.

4. Go to the location where you cloned teams-ai repo and select the `teams-ai` folder.

5. Select `View > Terminal`. A terminal window opens.

6. In the terminal window, run the following command to go to the python folder:

   ```
   cd ./python/
   ```

7. Run the following command to install dependencies:

   ```terminal
   poetry install
   ```

8. Run the following command to build project and samples:

   ```terminal
   poetry build
   ```

9. After the dependencies are installed and project is built, select `File > Open Folder`.

10. Go to `teams-ai > python > samples > 01.messaging.a.echoBot` and click `Select Folder`. This open the echo bot sample folder in vscode.

11. From the left pane, select `Teams Toolkit`.

12. Under `ACCOUNTS`, sign in to the following:

    - **Microsoft 365 account**

13. To debug your app, press the **F5** key.

    A browser tab opens a Teams web client requesting to add the bot to your tenant.

14. Select **Add**.

    ![add-image](./assets/quickstart-echobot-add.png)

    A chat window opens.

15. In the message compose area, send a message to invoke the bot.

    ![demo-image](./assets/quickstart-echobot-demo.png)

The bot will echo back what the user sends it while keeping track of the number of messages sent by the user.
