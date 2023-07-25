This library contains most of the core functionality for [Bot Builder](https://github.com/Microsoft/botbuilder-js/tree/main/libraries/botbuilder),
but without any dependency on Node. As a result, this version can be used to build bots that run complete in a browser.

Unless you are building a bot or component _without Node_, we recommend that you `botbuilder` your app
instead of `botbuilder-core`. [Learn more here.](https://github.com/Microsoft/botbuilder-js/tree/main/libraries/botbuilder/README.md)

- [Installing](#installing)
- [Documentation](https://docs.microsoft.com/en-us/azure/bot-service/bot-service-overview-introduction?view=azure-bot-service-4.0)
- [GitHub Repo](https://github.com/Microsoft/botbuilder-js)
- [Report Issues](https://github.com/Microsoft/botbuilder-js/issues)

## Installing
To add the latset published version of this package to your bot:

```bash
npm install --save botbuilder-core
```

#### Use the Daily Build

To get access to the daily builds of this library, configure npm to use the MyGet feed before installing.

```bash
npm config set registry https://botbuilder.myget.org/F/botbuilder-v4-js-daily/npm/
```

To reset the registry in order to get the latest published version, run:
```bash
npm config set registry https://registry.npmjs.org/
```
