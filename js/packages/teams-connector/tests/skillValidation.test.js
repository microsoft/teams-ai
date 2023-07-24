const assert = require('assert');
const {
    AuthenticationConstants,
    ClaimsIdentity,
    GovernmentConstants,
    SimpleCredentialProvider,
    SkillValidation,
} = require('../');

describe('SkillValidation', function () {
    this.timeout(5000);

    describe('isSkillClaim()', function () {
        it('should return false for invalid claims and true for valid claims', function () {
            const versionClaim = {};
            const audClaim = {};
            const appIdClaim = {};
            const claims = [versionClaim, audClaim, appIdClaim];
            const audience = uuid();
            const appId = uuid();

            // No claims (falsy value)
            assert.throws(
                () => SkillValidation.isSkillClaim(),
                new TypeError('SkillValidation.isSkillClaim(): missing claims.')
            );

            // Empty list of claims
            assert(!SkillValidation.isSkillClaim(claims));

            // No Audience claim
            versionClaim.type = AuthenticationConstants.VersionClaim;
            versionClaim.value = '1.0';
            assert(!SkillValidation.isSkillClaim(claims));

            // Emulator Audience claim
            audClaim.type = AuthenticationConstants.AudienceClaim;
            audClaim.value = AuthenticationConstants.ToBotFromChannelTokenIssuer;
            assert(!SkillValidation.isSkillClaim(claims));

            // Government Audience claim
            audClaim.value = GovernmentConstants.ToBotFromChannelTokenIssuer;
            assert(!SkillValidation.isSkillClaim(claims));

            // No AppId claim
            audClaim.value = audience;
            assert(!SkillValidation.isSkillClaim(claims));

            // If not AppId != Audience, should return false
            appIdClaim.type = AuthenticationConstants.AppIdClaim;
            appIdClaim.value = audience;
            assert(!SkillValidation.isSkillClaim(claims));

            // Anonymous skill app ID
            appIdClaim.type = AuthenticationConstants.AppIdClaim;
            appIdClaim.value = AuthenticationConstants.AnonymousSkillAppId;
            assert(SkillValidation.isSkillClaim(claims));

            // All checks pass, should be good now
            audClaim.value = appId;
            assert(SkillValidation.isSkillClaim(claims));
        });
    });

    describe('isSkillToken()', function () {
        it('should fail for invalid authHeaders', function () {
            assert(!SkillValidation.isSkillToken());
            assert(!SkillValidation.isSkillToken(''));
            assert(!SkillValidation.isSkillToken('Bearer'));

            // No Authentication Scheme
            assert(
                !SkillValidation.isSkillToken(
                    'ew0KICAiYWxnIjogIlJTMjU2IiwNCiAgImtpZCI6ICJKVzNFWGRudy13WTJFcUxyV1RxUTJyVWtCLWciLA0KICAieDV0IjogIkpXM0VYZG53LXdZMkVxTHJXVHFRMnJVa0ItZyIsDQogICJ0eXAiOiAiSldUIg0KfQ.ew0KICAic2VydmljZXVybCI6ICJodHRwczovL2RpcmVjdGxpbmUuYm90ZnJhbWV3b3JrLmNvbS8iLA0KICAibmJmIjogMTU3MTE5MDM0OCwNCiAgImV4cCI6IDE1NzExOTA5NDgsDQogICJpc3MiOiAiaHR0cHM6Ly9hcGkuYm90ZnJhbWV3b3JrLmNvbSIsDQogICJhdWQiOiAiNGMwMDM5ZTUtNjgxNi00OGU4LWIzMTMtZjc3NjkxZmYxYzVlIg0KfQ.cEVHmQCTjL9HVHGk91sja5CqjgvM7B-nArkOg4bE83m762S_le94--GBb0_7aAy6DCdvkZP0d4yWwbpfOkukEXixCDZQM2kWPcOo6lz_VIuXxHFlZAGrTvJ1QkBsg7vk-6_HR8XSLJQZoWrVhE-E_dPj4GPBKE6s1aNxYytzazbKRAEYa8Cn4iVtuYbuj4XfH8PMDv5aC0APNvfgTGk-BlIiP6AGdo4JYs62lUZVSAYg5VLdBcJYMYcKt-h2n1saeapFDVHx_tdpRuke42M4RpGH_wzICeWC5tTExWEkQWApU85HRA5zzk4OpTv17Ct13JCvQ7cD5x9RK5f7CMnbhQ'
                )
            );

            // Incorrect Authentication Scheme
            assert(
                !SkillValidation.isSkillToken(
                    'Potato ew0KICAiYWxnIjogIlJTMjU2IiwNCiAgImtpZCI6ICJKVzNFWGRudy13WTJFcUxyV1RxUTJyVWtCLWciLA0KICAieDV0IjogIkpXM0VYZG53LXdZMkVxTHJXVHFRMnJVa0ItZyIsDQogICJ0eXAiOiAiSldUIg0KfQ.ew0KICAic2VydmljZXVybCI6ICJodHRwczovL2RpcmVjdGxpbmUuYm90ZnJhbWV3b3JrLmNvbS8iLA0KICAibmJmIjogMTU3MTE5MDM0OCwNCiAgImV4cCI6IDE1NzExOTA5NDgsDQogICJpc3MiOiAiaHR0cHM6Ly9hcGkuYm90ZnJhbWV3b3JrLmNvbSIsDQogICJhdWQiOiAiNGMwMDM5ZTUtNjgxNi00OGU4LWIzMTMtZjc3NjkxZmYxYzVlIg0KfQ.cEVHmQCTjL9HVHGk91sja5CqjgvM7B-nArkOg4bE83m762S_le94--GBb0_7aAy6DCdvkZP0d4yWwbpfOkukEXixCDZQM2kWPcOo6lz_VIuXxHFlZAGrTvJ1QkBsg7vk-6_HR8XSLJQZoWrVhE-E_dPj4GPBKE6s1aNxYytzazbKRAEYa8Cn4iVtuYbuj4XfH8PMDv5aC0APNvfgTGk-BlIiP6AGdo4JYs62lUZVSAYg5VLdBcJYMYcKt-h2n1saeapFDVHx_tdpRuke42M4RpGH_wzICeWC5tTExWEkQWApU85HRA5zzk4OpTv17Ct13JCvQ7cD5x9RK5f7CMnbhQ'
                )
            );
        });

        it('should fail for messages to bot from WebChat using version claim v2', function () {
            assert(
                !SkillValidation.isSkillToken(
                    'Bearer ew0KICAiYWxnIjogIlJTMjU2IiwNCiAgImtpZCI6ICJKVzNFWGRudy13WTJFcUxyV1RxUTJyVWtCLWciLA0KICAieDV0IjogIkpXM0VYZG53LXdZMkVxTHJXVHFRMnJVa0ItZyIsDQogICJ0eXAiOiAiSldUIg0KfQ.ew0KICAic2VydmljZXVybCI6ICJodHRwczovL2RpcmVjdGxpbmUuYm90ZnJhbWV3b3JrLmNvbS8iLA0KICAibmJmIjogMTU3MTE5MDM0OCwNCiAgImV4cCI6IDE1NzExOTA5NDgsDQogICJpc3MiOiAiaHR0cHM6Ly9hcGkuYm90ZnJhbWV3b3JrLmNvbSIsDQogICJhdWQiOiAiNGMwMDM5ZTUtNjgxNi00OGU4LWIzMTMtZjc3NjkxZmYxYzVlIg0KfQ.cEVHmQCTjL9HVHGk91sja5CqjgvM7B-nArkOg4bE83m762S_le94--GBb0_7aAy6DCdvkZP0d4yWwbpfOkukEXixCDZQM2kWPcOo6lz_VIuXxHFlZAGrTvJ1QkBsg7vk-6_HR8XSLJQZoWrVhE-E_dPj4GPBKE6s1aNxYytzazbKRAEYa8Cn4iVtuYbuj4XfH8PMDv5aC0APNvfgTGk-BlIiP6AGdo4JYs62lUZVSAYg5VLdBcJYMYcKt-h2n1saeapFDVHx_tdpRuke42M4RpGH_wzICeWC5tTExWEkQWApU85HRA5zzk4OpTv17Ct13JCvQ7cD5x9RK5f7CMnbhQ'
                )
            );
        });

        it('should fail for messages to bot from Emulator using version claim v1', function () {
            assert(
                !SkillValidation.isSkillToken(
                    'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6ImFQY3R3X29kdlJPb0VOZzNWb09sSWgydGlFcyIsImtpZCI6ImFQY3R3X29kdlJPb0VOZzNWb09sSWgydGlFcyJ9.eyJhdWQiOiI0YzMzYzQyMS1mN2QzLTRiNmMtOTkyYi0zNmU3ZTZkZTg3NjEiLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC9kNmQ0OTQyMC1mMzliLTRkZjctYTFkYy1kNTlhOTM1ODcxZGIvIiwiaWF0IjoxNTcxMTg5ODczLCJuYmYiOjE1NzExODk4NzMsImV4cCI6MTU3MTE5Mzc3MywiYWlvIjoiNDJWZ1lLaWJGUDIyMUxmL0NjL1Yzai8zcGF2RUFBPT0iLCJhcHBpZCI6IjRjMzNjNDIxLWY3ZDMtNGI2Yy05OTJiLTM2ZTdlNmRlODc2MSIsImFwcGlkYWNyIjoiMSIsImlkcCI6Imh0dHBzOi8vc3RzLndpbmRvd3MubmV0L2Q2ZDQ5NDIwLWYzOWItNGRmNy1hMWRjLWQ1OWE5MzU4NzFkYi8iLCJ0aWQiOiJkNmQ0OTQyMC1mMzliLTRkZjctYTFkYy1kNTlhOTM1ODcxZGIiLCJ1dGkiOiJOdXJ3bTVOQnkwR2duT3dKRnFVREFBIiwidmVyIjoiMS4wIn0.GcKs3XZ_4GONVsAoPYI7otqUZPoNN8pULUnlJMxQa-JKXRKV0KtvTAdcMsfYudYxbz7HwcNYerFT1q3RZAimJFtfF4x_sMN23yEVxsQmYQrsf2YPmEsbCfNiEx0YEoWUdS38R1N0Iul2P_P_ZB7XreG4aR5dT6lY5TlXbhputv9pi_yAU7PB1aLuB05phQme5NwJEY22pUfx5pe1wVHogI0JyNLi-6gdoSL63DJ32tbQjr2DNYilPVtLsUkkz7fTky5OKd4p7FmG7P5EbEK4H5j04AGe_nIFs-X6x_FIS_5OSGK4LGA2RPnqa-JYpngzlNWVkUbnuH10AovcAprgdg'
                )
            );
        });

        it('should fail for messages to bot from Emulator using version claim v2', function () {
            assert(
                !SkillValidation.isSkillToken(
                    'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6ImFQY3R3X29kdlJPb0VOZzNWb09sSWgydGlFcyJ9.eyJhdWQiOiI0YzAwMzllNS02ODE2LTQ4ZTgtYjMxMy1mNzc2OTFmZjFjNWUiLCJpc3MiOiJodHRwczovL2xvZ2luLm1pY3Jvc29mdG9ubGluZS5jb20vZDZkNDk0MjAtZjM5Yi00ZGY3LWExZGMtZDU5YTkzNTg3MWRiL3YyLjAiLCJpYXQiOjE1NzExODkwMTEsIm5iZiI6MTU3MTE4OTAxMSwiZXhwIjoxNTcxMTkyOTExLCJhaW8iOiI0MlZnWUxnYWxmUE90Y2IxaEoxNzJvbmxIc3ZuQUFBPSIsImF6cCI6IjRjMDAzOWU1LTY4MTYtNDhlOC1iMzEzLWY3NzY5MWZmMWM1ZSIsImF6cGFjciI6IjEiLCJ0aWQiOiJkNmQ0OTQyMC1mMzliLTRkZjctYTFkYy1kNTlhOTM1ODcxZGIiLCJ1dGkiOiJucEVxVTFoR1pVbXlISy1MUVdJQ0FBIiwidmVyIjoiMi4wIn0.CXcPx7LfatlRsOX4QG-jaC-guwcY3PFxpFICqwfoOTxAjHpeJNFXOpFeA3Qb5VKM6Yw5LyA9eraL5QDJB_4uMLCCKErPXMyoSm8Hw-GGZkHgFV5ciQXSXhE-IfOinqHE_0Lkt_VLR2q6ekOncnJeCR111QCqt3D8R0Ud0gvyLv_oONxDtqg7HUgNGEfioB-BDnBsO4RN7NGrWQFbyPxPmhi8a_Xc7j5Bb9jeiiIQbVaWkIrrPN31aWY1tEZLvdN0VluYlOa0EBVrzpXXZkIyWx99mpklg0lsy7mRyjuM1xydmyyGkzbiCKtODOanf8UwTjkTg5XTIluxe79_hVk2JQ'
                )
            );
        });

        it('should succeed for messages to skill using valid v1 token', function () {
            assert(
                SkillValidation.isSkillToken(
                    'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6ImFQY3R3X29kdlJPb0VOZzNWb09sSWgydGlFcyIsImtpZCI6ImFQY3R3X29kdlJPb0VOZzNWb09sSWgydGlFcyJ9.eyJhdWQiOiI0YzMzYzQyMS1mN2QzLTRiNmMtOTkyYi0zNmU3ZTZkZTg3NjEiLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC9kNmQ0OTQyMC1mMzliLTRkZjctYTFkYy1kNTlhOTM1ODcxZGIvIiwiaWF0IjoxNTcxMTg5NjMwLCJuYmYiOjE1NzExODk2MzAsImV4cCI6MTU3MTE5MzUzMCwiYWlvIjoiNDJWZ1lJZzY1aDFXTUVPd2JmTXIwNjM5V1lLckFBPT0iLCJhcHBpZCI6IjRjMDAzOWU1LTY4MTYtNDhlOC1iMzEzLWY3NzY5MWZmMWM1ZSIsImFwcGlkYWNyIjoiMSIsImlkcCI6Imh0dHBzOi8vc3RzLndpbmRvd3MubmV0L2Q2ZDQ5NDIwLWYzOWItNGRmNy1hMWRjLWQ1OWE5MzU4NzFkYi8iLCJ0aWQiOiJkNmQ0OTQyMC1mMzliLTRkZjctYTFkYy1kNTlhOTM1ODcxZGIiLCJ1dGkiOiJhWlpOUTY3RjRVNnNmY3d0S0R3RUFBIiwidmVyIjoiMS4wIn0.Yogk9fptxxJKO8jRkk6FrlLQsAulNNgoa0Lqv2JPkswyyizse8kcwQhxOaZOotY0UBduJ-pCcrejk6k4_O_ZReYXKz8biL9Q7Z02cU9WUMvuIGpAhttz8v0VlVSyaEJVJALc5B-U6XVUpZtG9LpE6MVror_0WMnT6T9Ijf9SuxUvdVCcmAJyZuoqudodseuFI-jtCpImEapZp0wVN4BUodrBacMbTeYjdZyAbNVBqF5gyzDztMKZR26HEz91gqulYZvJJZOJO6ejnm0j62s1tqvUVRBywvnSOon-MV0Xt2Vm0irhv6ipzTXKwWhT9rGHSLj0g8r6NqWRyPRFqLccvA'
                )
            );
        });

        it('should succeed for messages to skill using valid v2 token', function () {
            assert(
                SkillValidation.isSkillToken(
                    'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6ImFQY3R3X29kdlJPb0VOZzNWb09sSWgydGlFcyJ9.eyJhdWQiOiI0YzAwMzllNS02ODE2LTQ4ZTgtYjMxMy1mNzc2OTFmZjFjNWUiLCJpc3MiOiJodHRwczovL2xvZ2luLm1pY3Jvc29mdG9ubGluZS5jb20vZDZkNDk0MjAtZjM5Yi00ZGY3LWExZGMtZDU5YTkzNTg3MWRiL3YyLjAiLCJpYXQiOjE1NzExODk3NTUsIm5iZiI6MTU3MTE4OTc1NSwiZXhwIjoxNTcxMTkzNjU1LCJhaW8iOiI0MlZnWUpnZDROZkZKeG1tMTdPaVMvUk8wZll2QUE9PSIsImF6cCI6IjRjMzNjNDIxLWY3ZDMtNGI2Yy05OTJiLTM2ZTdlNmRlODc2MSIsImF6cGFjciI6IjEiLCJ0aWQiOiJkNmQ0OTQyMC1mMzliLTRkZjctYTFkYy1kNTlhOTM1ODcxZGIiLCJ1dGkiOiJMc2ZQME9JVkNVS1JzZ1IyYlFBQkFBIiwidmVyIjoiMi4wIn0.SggsEbEyXDYcg6EdhK-RA1y6S97z4hwEccXc6a3ymnHP-78frZ3N8rPLsqLoK5QPGA_cqOXsX1zduA4vlFSy3MfTV_npPfsyWa1FIse96-2_3qa9DIP8bhvOHXEVZeq-r-0iF972waFyPPC_KVYWnIgAcunGhFWvLhhOUx9dPgq7824qTq45ma1rOqRoYbhhlRn6PJDymIin5LeOzDGJJ8YVLnFUgntc6_4z0P_fnuMktzar88CUTtGvR4P7XNJhS8v9EwYQujglsJNXg7LNcwV7qOxDYWJtT_UMuMAts9ctD6FkuTGX_-6FTqmdUPPUS4RWwm4kkl96F_dXnos9JA'
                )
            );
        });
    });

    describe('authenticateChannelToken()', function () {
        it('should throw an error when missing authConfig', async function () {
            await assert.rejects(
                SkillValidation.authenticateChannelToken(
                    'authHeader',
                    new SimpleCredentialProvider('', ''),
                    '',
                    'unknown'
                ),
                new Error('SkillValidation.authenticateChannelToken(): invalid authConfig parameter')
            );
        });
    });

    describe('validateIdentity()', function () {
        const makeCredentialsAndIdentity = ({
            audience,
            audienceClaim, // overrides audience in claim value
            appId = uuid(),
            authType = true,
            version = '1.0',
        } = {}) => {
            if (audience === undefined) {
                audience = appId;
            }

            const credentials = new SimpleCredentialProvider(audience, '');

            const appIdClaim = {
                type: AuthenticationConstants.AppIdClaim,
                value: appId,
            };
            const audClaim = {
                type: AuthenticationConstants.AudienceClaim,
                value: audienceClaim !== undefined ? audienceClaim : audience,
            };
            const verClaim = {
                type: AuthenticationConstants.VersionClaim,
                value: version,
            };

            const claims = [appIdClaim, audClaim, verClaim];
            const identity = new ClaimsIdentity(claims, authType);

            return { credentials, identity };
        };

        it('should fail with a falsy identity', async function () {
            const { credentials } = makeCredentialsAndIdentity();

            await assert.rejects(
                SkillValidation.validateIdentity(undefined, credentials),
                new Error('SkillValidation.validateIdentity(): Invalid identity')
            );
        });

        it('should fail if ClaimsIdentity authType is false', async function () {
            const { credentials, identity } = makeCredentialsAndIdentity({
                authType: false,
            });

            await assert.rejects(
                SkillValidation.validateIdentity(identity, credentials),
                new Error('SkillValidation.validateIdentity(): Token not authenticated')
            );
        });

        it('should fail with no version claim', async function () {
            const { credentials, identity } = makeCredentialsAndIdentity({
                version: null,
            });

            await assert.rejects(
                SkillValidation.validateIdentity(identity, credentials),
                new Error(
                    `SkillValidation.validateIdentity(): '${AuthenticationConstants.VersionClaim}' claim is required on skill Tokens.`
                )
            );
        });

        it('should fail with no audience claim', async function () {
            const { credentials, identity } = makeCredentialsAndIdentity({
                audience: null,
            });

            await assert.rejects(
                SkillValidation.validateIdentity(identity, credentials),
                new Error(
                    `SkillValidation.validateIdentity(): '${AuthenticationConstants.AudienceClaim}' claim is required on skill Tokens.`
                )
            );
        });

        it('should fail if audience claim is not appId', async function () {
            const { credentials, identity } = makeCredentialsAndIdentity({
                audienceClaim: uuid(),
                appId: uuid(),
            });

            await assert.rejects(
                SkillValidation.validateIdentity(identity, credentials),
                new Error('SkillValidation.validateIdentity(): Invalid audience.')
            );
        });

        it('should fail if appid claim is falsy', async function () {
            const { credentials, identity } = makeCredentialsAndIdentity({
                audience: uuid(),
                appId: '',
            });

            await assert.rejects(
                SkillValidation.validateIdentity(identity, credentials),
                new Error('SkillValidation.validateIdentity(): Invalid appId.')
            );
        });

        it('should fail if appid claim is missing', async function () {
            const { credentials, identity } = makeCredentialsAndIdentity({
                audience: uuid(),
                appId: null,
            });

            await assert.rejects(
                SkillValidation.validateIdentity(identity, credentials),
                new Error('SkillValidation.validateIdentity(): Invalid appId.')
            );
        });

        it('should succeed', async function () {
            const { credentials, identity } = makeCredentialsAndIdentity();
            await SkillValidation.validateIdentity(identity, credentials);
        });
    });

    describe('createAnonymousSkillClaim', function () {
        it('should create an authenticated Claims Identity representing a skill', function () {
            const result = SkillValidation.createAnonymousSkillClaim();
            assert(result.isAuthenticated, 'isAuthenticated should be true');

            const appIdClaim = result.claims.find((claim) => claim.type == AuthenticationConstants.AppIdClaim);
            assert(appIdClaim, 'appId claim not found');
            assert.strictEqual(appIdClaim.value, AuthenticationConstants.AnonymousSkillAppId);
        });
    });
});

function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0,
            v = c == 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}
