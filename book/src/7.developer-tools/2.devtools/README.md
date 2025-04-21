# 🛠️ Developer Tools

The developer tools can be used to locally interact with an app to streamline the testing/development process,
preventing you from needing to deploy/register the app or expose a public endpoint.

The devtools can easily be added to any project by importing the `DevtoolsPlugin` as shown below:

```typescript
import { App } from '@microsoft/teams.apps';
import { DevtoolsPlugin } from '@microsoft/teams.dev';

// add the DevtoolsPlugin (allowing us to emulate teams localhost and inspect traffic)
const app = new App({
    plugins: [new DevtoolsPlugin()],
});
```
