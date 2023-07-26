const assert = require('assert');
const { PromptCultureModels } = require('../lib');

describe('Prompt Culture Models Tests', function () {
    this.timeout(5000);

    it('should correctly map to nearest language', function () {
        const locales = ['es-es', 'nl-nl', 'en-us', 'fr-fr', 'de-de', 'ja-jp', 'it-it', 'pt-br', 'zh-cn'];
        // es-ES
        const capEnding = (locale) => {
            return `${locale.split('-')[0]}-${locale.split('-')[1].toUpperCase()}`;
        };
        // es-Es
        const titleEnding = (locale) => {
            locale[3] = locale.charAt(3).toUpperCase();
            return locale;
        };
        // ES
        const capTwoLetter = (locale) => {
            return locale.split('-')[0].toUpperCase();
        };
        // es
        const lowerTwoLetter = (locale) => {
            return locale.split('-')[0].toLowerCase();
        };

        // This creates an object of the correct locale along with its test locales
        const localeTests = locales.reduce((obj, locale) => {
            obj[locale] = [
                locale,
                capEnding(locale),
                titleEnding(locale),
                capTwoLetter(locale),
                lowerTwoLetter(locale),
            ];
            return obj;
        }, {});

        Object.keys(localeTests).map((validLocale) => {
            localeTests[validLocale].map((testLocale) => {
                assert.strictEqual(PromptCultureModels.mapToNearestLanguage(testLocale), validLocale);
            });
        });
    });

    it('should not throw when locale is null or undefined', function () {
        assert.doesNotThrow(() => PromptCultureModels.mapToNearestLanguage(null));
        assert.doesNotThrow(() => PromptCultureModels.mapToNearestLanguage(undefined));
    });

    it('should return all supported cultures', function () {
        const expected = [
            PromptCultureModels.Chinese,
            PromptCultureModels.Dutch,
            PromptCultureModels.English,
            PromptCultureModels.French,
            PromptCultureModels.German,
            PromptCultureModels.Italian,
            PromptCultureModels.Japanese,
            PromptCultureModels.Portuguese,
            PromptCultureModels.Spanish,
        ];

        const supportedCultures = PromptCultureModels.getSupportedCultures();

        assert.deepEqual(supportedCultures, expected);
    });
});
