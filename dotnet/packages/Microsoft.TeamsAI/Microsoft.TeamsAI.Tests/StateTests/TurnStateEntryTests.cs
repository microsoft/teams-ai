using Microsoft.Teams.AI.State;

namespace Microsoft.Teams.AI.Tests.StateTests
{
    public class TurnStateEntryTests
    {
        [Fact]
        public void Test_Delete_EntryIsDeleted()
        {
            // Arrange
            TurnStateEntry<string> entry = new("key", new string("string"));

            // Act
            entry.Delete();

            // Assert
            Assert.True(entry.IsDeleted);
        }

        [Fact]
        public void Test_ComputeHash_FromDictionary()
        {
            // Arrange
            StateBase map = new();
            map["key1"] = "value1";

            // Act
            string hash = TurnStateEntry<StateBase>.ComputeHash(map);

            // Assert
            Assert.Equal("{\"key1\":\"value1\"}", hash);
        }

        [Fact]
        public void Test_HasChanged_IsChanged()
        {
            // Arrange
            StateBase map = new();
            map["key1"] = "value1";
            TurnStateEntry<StateBase> entry = new(map);

            // Act
            map["key1"] = "value2";

            // Assert
            Assert.True(entry.HasChanged);
        }

        [Fact]
        public void Test_HasChanged_NotChanged()
        {
            // Arrange
            StateBase map = new();
            map["key1"] = "value1";
            TurnStateEntry<StateBase> entry = new(map);

            // Act
            map["key1"] = "value1";

            // Assert
            Assert.False(entry.HasChanged);
        }

        [Fact]
        public void Test_Value_GetsValue()
        {
            // Arrange
            StateBase map = new();
            TurnStateEntry<StateBase> entry = new(map);

            // Act
            StateBase value = entry.Value;

            // Assert
            Assert.Equal(value, map);
        }

        [Fact]
        public void Test_Value_RestoreDeletedEntry()
        {
            // Arrange
            StateBase map = new();
            TurnStateEntry<StateBase> entry = new(map);
            entry.Delete(); // Should be deleted

            // Act - accessing deleted entry value should undelete entry
            StateBase _ = entry.Value;

            // Assert
            Assert.False(entry.IsDeleted);
        }

        [Fact]
        public void Test_Replace_ReplacesEntryValue()
        {
            // Arrange
            TurnStateEntry<string> entry = new("string 1");
            entry.Delete(); // Should be deleted

            // Act - accessing deleted entry value should undelete entry
            entry.Replace("string 2");

            // Assert
            Assert.Equal("string 2", entry.Value);
        }
    }
}
