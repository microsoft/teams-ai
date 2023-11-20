using Microsoft.Teams.AI.State;
using Record = Microsoft.Teams.AI.State.Record;

namespace Microsoft.Teams.AI.Tests.StateTests
{
    public class TurnStateEntryTests
    {
        [Fact]
        public void Test_Delete_EntryIsDeleted()
        {
            Record record = new();
            object temp = new();
            record.Add("key", temp);
            // Arrange
            TurnStateEntry entry = new(record, new string("string"));

            // Act
            entry.Delete();

            // Assert
            Assert.True(entry.IsDeleted);
        }

        [Fact]
        public void Test_ComputeHash_FromDictionary()
        {
            // Arrange
            Record record = new();
            object val = new();
            record["key1"] = val;

            // Act
            string hash = TurnStateEntry.ComputeHash(record);

            // Assert
            Assert.Equal("{\"key1\":{}}", hash);
        }

        [Fact]
        public void Test_HasChanged_IsChanged()
        {
            // Arrange
            Record map = new();
            map["key1"] = new object();
            TurnStateEntry entry = new(map);

            // Act
            map["key1"] = new List<string>();

            // Assert
            Assert.True(entry.HasChanged);
        }

        [Fact]
        public void Test_HasChanged_NotChanged()
        {
            // Arrange
            Record map = new();
            object val = new();
            map["key1"] = val;
            TurnStateEntry entry = new(map);

            // Act
            map["key1"] = val;

            // Assert
            Assert.False(entry.HasChanged);
        }

        [Fact]
        public void Test_Value_GetsValue()
        {
            // Arrange
            Record map = new();
            TurnStateEntry entry = new(map);

            // Act
            Record value = entry.Value!;

            // Assert
            Assert.Equal(value, map);
        }

        [Fact]
        public void Test_Value_RestoreDeletedEntry()
        {
            // Arrange
            Record map = new();
            TurnStateEntry entry = new(map);
            entry.Delete(); // Should be deleted

            // Act - accessing deleted entry value should undelete entry
            Record _ = entry.Value!;

            // Assert
            Assert.False(entry.IsDeleted);
        }

        [Fact]
        public void Test_Replace_ReplacesEntryValue()
        {
            // Arrange
            Record record = new();
            record.Set("key 1", "string 1");
            TurnStateEntry entry = new(record);
            entry.Delete(); // Should be deleted

            // Act - accessing deleted entry value should undelete entry
            Record recordTwo = new();
            record.Set("key 2", "string 2");
            entry.Replace(recordTwo);

            // Assert
            Assert.Equal(recordTwo, entry.Value);
        }

        private sealed class TestState : Record { }
    }
}
