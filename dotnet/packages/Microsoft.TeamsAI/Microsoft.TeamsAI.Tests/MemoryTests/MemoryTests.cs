namespace Microsoft.Teams.AI.Tests.MemoryTests
{
    public class MemoryTests
    {
        [Fact]
        public void Test_DeleteValue_IsDeleted()
        {
            Memory.Memory memory = new();

            memory.SetValue("a.b", "test");

            Assert.True(memory.HasValue("a.b"));
            Assert.Equal(memory.GetValue<string>("a.b"), "test");

            memory.DeleteValue("a.b");

            Assert.False(memory.HasValue("a.b"));
        }

        [Fact]
        public void Test_SetValue_Exists()
        {
            Memory.Memory memory = new();

            memory.SetValue("test", "123");

            Assert.True(memory.HasValue("temp.test"));
            Assert.Equal(memory.GetValue<string>("temp.test"), "123");
        }
    }
}
