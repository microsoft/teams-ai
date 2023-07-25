const assert = require('assert');
const { Severity, telemetryTrackDialogView } = require('../');

describe('BotTelemetryClient', function () {
    this.timeout(3000);

    describe('"telemetryTrackDialogView" helper', function () {
        it('should call client.trackPageView if it exists', function () {
            const testClient = {
                trackPageView({ name, properties, metrics }) {
                    assert.ok(name);
                    assert.ok(properties);
                    assert.ok(metrics);
                },
            };
            const testProps = { description: 'value' };
            const testMetrics = { duration: 1 };
            assert.doesNotThrow(() => telemetryTrackDialogView(testClient, 'dialogName', testProps, testMetrics));
        });

        it('should call client.trackTrace if trackPageView is not supported', function () {
            const testClient = {
                trackTrace({ message, severityLevel }) {
                    assert.ok(message);
                    assert.strictEqual(severityLevel, Severity.Information);
                },
            };
            assert.doesNotThrow(() => telemetryTrackDialogView(testClient, 'dialogName'));
        });

        it('should throw TypeError if trackTrace and trackPageView do not exist', function () {
            assert.throws(
                () => telemetryTrackDialogView(undefined, 'dialogName'),
                TypeError('"telemetryClient" parameter does not have methods trackPageView() or trackTrace()')
            );

            assert.throws(
                () => telemetryTrackDialogView({}, 'dialogName'),
                TypeError('"telemetryClient" parameter does not have methods trackPageView() or trackTrace()')
            );
        });
    });
});
