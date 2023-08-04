using Microsoft.TeamsAI.Utilities;

namespace Microsoft.TeamsAI.Tests
{
    public class UtilitiesTest
    {
        [Fact]
        public void Test_Verify_ParamNotNull_IsNull_ShouldThrow()
        {
            // Arrange
            object? argument = null;

            // Act
            ArgumentNullException ex = Assert.Throws<ArgumentNullException>(() => Verify.ParamNotNull(argument, nameof(argument)));

            // Assert
            Assert.Equal("Value cannot be null. (Parameter 'argument')", ex.Message);
        }

        [Fact]
        public void Test_Verify_ParamNotNull_IsNotNull_ShouldNotThrow()
        {
            // Arrange
            object? argument = new();

            // Act
            Verify.ParamNotNull(argument, nameof(argument));

            // Assert
            // Nothing to assert, test passes 
        }
    }
}
