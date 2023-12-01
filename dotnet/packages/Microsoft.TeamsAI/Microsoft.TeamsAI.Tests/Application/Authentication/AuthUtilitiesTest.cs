using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.State;
using Microsoft.Teams.AI.Tests.TestUtils;

namespace Microsoft.Teams.AI.Tests.Application.Authentication
{
    public class AuthUtilitiesTest
    {
        [Fact]
        public async void Test_SetTokenInState()
        {
            // Arrange
            TurnContext context = TurnStateConfig.CreateConfiguredTurnContext();
            TurnState state = await TurnStateConfig.GetTurnStateWithConversationStateAsync(context);
            string settingName = "settingName";
            string token = "token";

            // Act
            AuthUtilities.SetTokenInState(state, settingName, token);

            // Assert
            Assert.True(state.Temp.AuthTokens.ContainsKey(settingName));
        }

        [Fact]
        public async void Test_DeleteTokenFromState()
        {
            // Arrange
            TurnContext context = TurnStateConfig.CreateConfiguredTurnContext();
            TurnState state = await TurnStateConfig.GetTurnStateWithConversationStateAsync(context);
            string settingName = "settingName";
            string token = "token";

            // Act
            state.Temp.AuthTokens[settingName] = token;
            AuthUtilities.DeleteTokenFromState(state, settingName);

            // Assert
            Assert.False(state.Temp.AuthTokens.ContainsKey(settingName));
        }

        [Fact]
        public async void Test_UserInSignInFlow()
        {
            // Arrange
            TurnContext context = TurnStateConfig.CreateConfiguredTurnContext();
            TurnState state = await TurnStateConfig.GetTurnStateWithConversationStateAsync(context);
            string settingName = "settingName";

            // Act
            state.User.Set(AuthUtilities.IS_SIGNED_IN_KEY, settingName);
            string? response = AuthUtilities.UserInSignInFlow(state);

            // Assert
            Assert.True(response == settingName);

        }

        [Fact]
        public async void Test_SetUserInSignInFlow()
        {
            // Arrange
            TurnContext context = TurnStateConfig.CreateConfiguredTurnContext();
            TurnState state = await TurnStateConfig.GetTurnStateWithConversationStateAsync(context);
            string settingName = "settingName";

            // Act
            AuthUtilities.SetUserInSignInFlow(state, settingName);

            // Assert
            Assert.True(state.User.Get<string>(AuthUtilities.IS_SIGNED_IN_KEY) == settingName);
        }

        [Fact]
        public async void Test_DeleteUserInSignInFlow()
        {
            // Arrange
            TurnContext context = TurnStateConfig.CreateConfiguredTurnContext();
            TurnState state = await TurnStateConfig.GetTurnStateWithConversationStateAsync(context);
            string settingName = "settingName";

            // Act
            state.User.Set(AuthUtilities.IS_SIGNED_IN_KEY, settingName);
            AuthUtilities.DeleteUserInSignInFlow(state);

            // Assert
            Assert.False(state.User.ContainsKey(AuthUtilities.IS_SIGNED_IN_KEY));
        }
    }
}
