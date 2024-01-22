using Microsoft.Teams.AI.AI.Models;

namespace Microsoft.Teams.AI.Tests.AITests.Models
{
    public class ChatRoleTests
    {
        [Fact]
        public void Test_Constructor_ArgumentNullException()
        {
            // Arrange
            string? role = null;

            // Act
            var exception = Assert.Throws<ArgumentNullException>(() => new ChatRole(role!));

            // Assert
            Assert.NotNull(exception);
        }

        [Fact]
        public void Test_Equals()
        {
            // Arrange
            var chatRole1 = new ChatRole("user");
            var chatRole2 = ChatRole.User;
            var chatRole3 = ChatRole.Assistant;

            // Act
            var result1 = chatRole1.Equals(chatRole2);
            var result2 = chatRole1.Equals(chatRole3);

            // Assert
            Assert.True(result1);
            Assert.False(result2);
        }

        [Fact]
        public void Test_ToString()
        {
            // Arrange
            var chatRole = new ChatRole("test");

            // Act
            var result = chatRole.ToString();

            // Assert
            Assert.Equal("test", result.ToString());
        }
    }
}
