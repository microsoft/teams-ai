
using Microsoft.Bot.Builder.M365.Utilities;

namespace Microsoft.Bot.Builder.M365.Tests
{
    public class UtilitiesTest
    {
        [Fact]
        public void Test_Verify_NotNull_IsNull_ShouldThrow()
        {
            // Arrange
            object? argument = null;

            // Act
            ArgumentNullException ex = Assert.Throws<ArgumentNullException>(() => Verify.NotNull(argument, nameof(argument)));

            // Assert
            Assert.Equal("Value cannot be null. (Parameter 'argument')", ex.Message);
        }

        [Fact]
        public void Test_Verify_NotNull_IsNotNull_ShouldNotThrow()
        {
            // Arrange
            object? argument = new();

            // Act
            Verify.NotNull(argument, nameof(argument));

            // Assert
            // Nothing to assert, test passes 
        }
    }
}
