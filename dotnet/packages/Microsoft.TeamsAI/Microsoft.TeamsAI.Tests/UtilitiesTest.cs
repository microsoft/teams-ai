using Microsoft.Teams.AI.Utilities;

namespace Microsoft.Teams.AI.Tests
{
    public class UtilitiesTest
    {
        [Fact]
        public void Test_Verify_ParamNotNull_IsNull_ShouldThrow()
        {
            // Arrange
            object? argument = null;

            // Act
            ArgumentNullException ex = Assert.Throws<ArgumentNullException>(() => Verify.ParamNotNull(argument));

            // Assert
            Assert.Equal("Value cannot be null. (Parameter 'argument')", ex.Message);
        }

        [Fact]
        public void Test_Verify_ParamNotNull_IsNotNull_ShouldNotThrow()
        {
            // Arrange
            object? argument = new();

            // Act
            Verify.ParamNotNull(argument);

            // Assert
            // Nothing to assert, test passes 
        }
    }
}
