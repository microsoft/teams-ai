using Microsoft.Teams.AI.AI.Planner;
using Microsoft.Teams.AI.State;

namespace Microsoft.Teams.AI.Tests
{
    public class ConversationHistoryTests
    {
        [Fact]
        public void AddLine_AddsLineToHistory()
        {
            // Arrange
            var turnState = _GetTurnStateWithConversationState();
            var line = "This is a line of text";
            int maxLines = 10;

            // Act
            ConversationHistory.AddLine(turnState, line, maxLines);

            // Assert
            var history = ConversationHistory.GetHistory(turnState);
            Assert.Contains(line, history);
            Assert.Single(history);
        }

        [Fact]
        public void AddLine_PrunesHistoryIfTooLong()
        {
            // Arrange
            var turnState = _GetTurnStateWithConversationState();
            int maxLines = 10;
            var lines = new List<string>();
            for (int i = 0; i < maxLines + 1; i++)
            {
                lines.Add($"Line {i}");
            }

            // Act
            foreach (var line in lines)
            {
                ConversationHistory.AddLine(turnState, line, maxLines);
            }

            // Assert
            var history = ConversationHistory.GetHistory(turnState);
            Assert.Equal(maxLines, history.Count);
            Assert.DoesNotContain("Line 0", history);
            Assert.Contains("Line 10", history);
        }

        [Fact]
        public void Clear_RemovesAllLinesFromHistory()
        {
            // Arrange
            var turnState = _GetTurnStateWithConversationState();
            var line = "This is a line of text";
            ConversationHistory.AddLine(turnState, line);

            // Act
            ConversationHistory.Clear(turnState);

            // Assert
            var history = ConversationHistory.GetHistory(turnState);
            Assert.Empty(history);
        }

        [Fact]
        public void Clear_ThrowsArgumentNullException_WhenTurnStateIsNull()
        {
            // Arrange
            TurnState? turnState = null;

            // Act and Assert
#pragma warning disable CS8604 // Possible null reference argument.
            Assert.Throws<ArgumentNullException>(() => ConversationHistory.Clear(turnState));
#pragma warning restore CS8604 // Possible null reference argument.
        }

        [Fact]
        public void Clear_ThrowsInvalidOperationException_WhenTurnStateHasNoConversationState()
        {
            // Arrange
            var turnState = new TurnState();

            // Act and Assert
            Assert.Throws<ArgumentException>(() => ConversationHistory.Clear(turnState));
        }

        [Fact]
        public void HasMoreLines_ReturnsTrueIfHistoryHasOneLine()
        {
            // Arrange
            var turnState = _GetTurnStateWithConversationState();
            var line = "This is a line of text";
            ConversationHistory.AddLine(turnState, line);

            // Act
            var result = ConversationHistory.HasMoreLines(turnState);

            // Assert
            Assert.True(result);
        }

        [Fact]
        public void HasMoreLines_ReturnsTrueIfHistoryHasMultipleLines()
        {
            // Arrange
            var turnState = _GetTurnStateWithConversationState();
            var lines = new[] { "Line 1", "Line 2", "Line 3" };
            foreach (var line in lines)
            {
                ConversationHistory.AddLine(turnState, line);
            }

            // Act
            var result = ConversationHistory.HasMoreLines(turnState);

            // Assert
            Assert.True(result);
        }

        [Fact]
        public void HasMoreLines_ReturnsFalseIfHistoryIsEmpty()
        {
            // Arrange
            var turnState = _GetTurnStateWithConversationState();

            // Act
            var result = ConversationHistory.HasMoreLines(turnState);

            // Assert
            Assert.False(result);
        }

        [Fact]
        public void HasMoreLines_ThrowsArgumentNullExceptionIfTurnStateIsNull()
        {
            // Arrange
            TurnState? turnState = null;

            // Act and Assert
#pragma warning disable CS8604 // Possible null reference argument.
            Assert.Throws<ArgumentNullException>(() => ConversationHistory.HasMoreLines(turnState));
#pragma warning restore CS8604 // Possible null reference argument.
        }

        [Fact]
        public void GetLastLine_ReturnsEmptyStringIfHistoryIsEmpty()
        {
            // Arrange
            var turnState = _GetTurnStateWithConversationState();

            // Act
            var lastLine = ConversationHistory.GetLastLine(turnState);

            // Assert
            Assert.Equal(string.Empty, lastLine);
        }

        [Fact]
        public void GetLastLine_ReturnsLastLineIfHistoryIsNotEmpty()
        {
            // Arrange
            var turnState = _GetTurnStateWithConversationState();
            var line1 = "This is the first line";
            var line2 = "This is the second line";
            ConversationHistory.AddLine(turnState, line1);
            ConversationHistory.AddLine(turnState, line2);

            // Act
            var lastLine = ConversationHistory.GetLastLine(turnState);

            // Assert
            Assert.Equal(line2, lastLine);
        }

        [Fact]
        public void GetLastLine_ThrowsArgumentNullExceptionIfTurnStateIsNull()
        {
            // Arrange
            TurnState? turnState = null;

            // Act and Assert
#pragma warning disable CS8604 // Possible null reference argument.
            Assert.Throws<ArgumentNullException>(() => ConversationHistory.GetLastLine(turnState));
#pragma warning restore CS8604 // Possible null reference argument.
        }

        [Fact]
        public void GetLastSay_ReturnsEmptyStringIfHistoryIsEmpty()
        {
            // Arrange
            var turnState = _GetTurnStateWithConversationState();

            // Act
            var result = ConversationHistory.GetLastSay(turnState);

            // Assert
            Assert.Equal(string.Empty, result);
        }

        [Fact]
        public void GetLastSay_ReturnsLastSayTextIfHistoryHasSayResponse()
        {
            // Arrange
            var turnState = _GetTurnStateWithConversationState();
            var line1 = "User: Hello";
            var line2 = "Assistant: Hi, how can I help you? SAY Welcome to the assistant.";
            ConversationHistory.AddLine(turnState, line1);
            ConversationHistory.AddLine(turnState, line2);

            // Act
            var result = ConversationHistory.GetLastSay(turnState);

            // Assert
            Assert.Equal("Welcome to the assistant.", result);
        }

        [Fact]
        public void GetLastSay_ReturnsLastSayTextWithoutDoStatementsIfHistoryHasSayAndDoResponse()
        {
            // Arrange
            var turnState = _GetTurnStateWithConversationState();
            var line1 = "User: What is the weather like?";
            var line2 = "Assistant: It is sunny and warm. SAY The weather is nice today. THEN DO ShowWeatherCard";
            ConversationHistory.AddLine(turnState, line1);
            ConversationHistory.AddLine(turnState, line2);

            // Act
            var result = ConversationHistory.GetLastSay(turnState);

            // Assert
            Assert.Equal("The weather is nice today.", result);
        }

        [Fact]
        public void GetLastSay_ReturnsEmptyStringIfHistoryHasNoSayResponse()
        {
            // Arrange
            var turnState = _GetTurnStateWithConversationState();
            var line1 = "User: How are you?";
            var line2 = "Assistant: DO GreetUser";
            ConversationHistory.AddLine(turnState, line1);
            ConversationHistory.AddLine(turnState, line2);

            // Act
            var result = ConversationHistory.GetLastSay(turnState);

            // Assert
            Assert.Equal(string.Empty, result);
        }


        private static TurnState _GetTurnStateWithConversationState()
        {
            TurnState state = new()
            {
                ConversationStateEntry = new TurnStateEntry<StateBase>(new StateBase(), "")
            };

            return state;
        }

        [Fact]
        public void RemoveLastLine_RemovesLastLineFromHistory()
        {
            // Arrange
            var turnState = _GetTurnStateWithConversationState();
            var line1 = "This is the first line";
            var line2 = "This is the second line";
            ConversationHistory.AddLine(turnState, line1);
            ConversationHistory.AddLine(turnState, line2);

            // Act
            var removedLine = ConversationHistory.RemoveLastLine(turnState);

            // Assert
            var history = ConversationHistory.GetHistory(turnState);
            Assert.Equal(line2, removedLine);
            Assert.Contains(line1, history);
            Assert.DoesNotContain(line2, history);
            Assert.Equal(1, history.Count);
        }

        [Fact]
        public void RemoveLastLine_ReturnsNullIfHistoryIsEmpty()
        {
            // Arrange
            var turnState = _GetTurnStateWithConversationState();

            // Act
            var removedLine = ConversationHistory.RemoveLastLine(turnState);

            // Assert
            var history = ConversationHistory.GetHistory(turnState);
            Assert.Null(removedLine);
            Assert.Empty(history);
        }

        [Fact]
        public void RemoveLastLine_ThrowsArgumentNullExceptionIfTurnStateIsNull()
        {
            // Arrange
            TurnState? turnState = null;

            // Act and Assert
#pragma warning disable CS8604 // Possible null reference argument.
            Assert.Throws<ArgumentNullException>(() => ConversationHistory.RemoveLastLine(turnState));
#pragma warning restore CS8604 // Possible null reference argument.
        }

        [Fact]
        public void ReplaceLastLine_ReplacesLastLineOfHistory()
        {
            // Arrange
            var turnState = _GetTurnStateWithConversationState();
            var line1 = "This is the first line of history";
            var line2 = "This is the second line of history";
            var line3 = "This is the new line of history";
            ConversationHistory.AddLine(turnState, line1);
            ConversationHistory.AddLine(turnState, line2);

            // Act
            ConversationHistory.ReplaceLastLine(turnState, line3);

            // Assert
            var history = ConversationHistory.GetHistory(turnState);
            Assert.Contains(line1, history);
            Assert.Contains(line3, history);
            Assert.DoesNotContain(line2, history);
            Assert.Equal(2, history.Count);
        }

        [Fact]
        public void ReplaceLastLine_AddsLineIfHistoryIsEmpty()
        {
            // Arrange
            var turnState = _GetTurnStateWithConversationState();
            var line = "This is the only line of history";

            // Act
            ConversationHistory.ReplaceLastLine(turnState, line);

            // Assert
            var history = ConversationHistory.GetHistory(turnState);
            Assert.Contains(line, history);
            Assert.Equal(1, history.Count);
        }

        [Fact]
        public void ReplaceLastSay_ReplacesLastSayWithNewResponse()
        {
            // Arrange
            var turnState = _GetTurnStateWithConversationState();
            var line1 = "User: Hello";
            var line2 = "User: I'm fine";
            var line3 = "Assistant: Hi SAY How are you?";
            var newResponse = "That's good to hear";
            var expectedLine = "Assistant: Hi SAY That's good to hear";
            ConversationHistory.AddLine(turnState, line1);
            ConversationHistory.AddLine(turnState, line2);
            ConversationHistory.AddLine(turnState, line3);

            // Act
            ConversationHistory.ReplaceLastSay(turnState, newResponse);

            // Assert
            var history = ConversationHistory.GetHistory(turnState);
            Assert.Contains(line1, history);
            Assert.Contains(line2, history);
            Assert.Contains(expectedLine, history);
            Assert.DoesNotContain(line3, history);
            Assert.Equal(3, history.Count);
        }

        [Fact]
        public void ReplaceLastSay_AppendsThenSayIfLastLineHasDo()
        {
            // Arrange
            var turnState = _GetTurnStateWithConversationState();
            var line1 = "User: What time is it?";
            var line2 = "Assistant: It's 10:00 AM DO Show clock";
            var newResponse = "Do you have an appointment?";
            var expectedLine = "Assistant: It's 10:00 AM DO Show clock THEN SAY Do you have an appointment?";
            ConversationHistory.AddLine(turnState, line1);
            ConversationHistory.AddLine(turnState, line2);

            // Act
            ConversationHistory.ReplaceLastSay(turnState, newResponse);

            // Assert
            var history = ConversationHistory.GetHistory(turnState);
            Assert.Contains(line1, history);
            Assert.Contains(expectedLine, history);
            Assert.DoesNotContain(line2, history);
            Assert.Equal(2, history.Count);
        }

        [Fact]
        public void ReplaceLastSay_ReplacesEntireLineIfNoSayOrDo()
        {
            // Arrange
            var turnState = _GetTurnStateWithConversationState();
            var line1 = "User: Tell me a joke";
            var line2 = "Assistant: Why did the chicken cross the road?";
            var newResponse = "To get to the other side";
            var expectedLine = "Assistant: To get to the other side";
            ConversationHistory.AddLine(turnState, line1);
            ConversationHistory.AddLine(turnState, line2);

            // Act
            ConversationHistory.ReplaceLastSay(turnState, newResponse);

            // Assert
            var history = ConversationHistory.GetHistory(turnState);
            Assert.Contains(line1, history);
            Assert.Contains(expectedLine, history);
            Assert.DoesNotContain(line2, history);
            Assert.Equal(2, history.Count);
        }

        [Fact]
        public void ReplaceLastSay_AddsLineWithPrefixIfHistoryIsEmpty()
        {
            // Arrange
            var turnState = _GetTurnStateWithConversationState();
            var newResponse = "Welcome to the chatbot";
            var expectedLine = "Assistant: Welcome to the chatbot";

            // Act
            ConversationHistory.ReplaceLastSay(turnState, newResponse);

            // Assert
            var history = ConversationHistory.GetHistory(turnState);
            Assert.Contains(expectedLine, history);
            Assert.Equal(1, history.Count);
        }

        [Fact]
        public void ToString_ReturnsHistoryAsText()
        {
            // Arrange
            var turnState = _GetTurnStateWithConversationState();
            var line1 = "Hello, how are you?";
            var line2 = "I'm fine, thank you.";
            var line3 = "That's good to hear.";
            var lineSeparator = "\n";
            ConversationHistory.AddLine(turnState, line1);
            ConversationHistory.AddLine(turnState, line2);
            ConversationHistory.AddLine(turnState, line3);

            // Act
            var text = ConversationHistory.ToString(turnState, lineSeparator: lineSeparator);

            // Assert
            var expectedText = $"{line1}{lineSeparator}{line2}{lineSeparator}{line3}";
            Assert.Equal(expectedText, text);
        }

        [Fact]
        public void ToString_ReturnsEmptyStringIfHistoryTooLong()
        {
            // Arrange
            var turnState = _GetTurnStateWithConversationState();
            var line = "This is a very long line of text that exceeds the maximum number of tokens allowed.";
            var maxTokens = 10;
            ConversationHistory.AddLine(turnState, line);

            // Act
            var text = ConversationHistory.ToString(turnState, maxTokens: maxTokens);

            // Assert
            Assert.Equal("", text);
        }

        [Fact]
        public void ToArray_ReturnsHistoryAsArray()
        {
            // Arrange
            var turnState = _GetTurnStateWithConversationState();
            var line1 = "Hello, how are you?";
            var line2 = "I'm fine, thank you.";
            var line3 = "That's good to hear.";
            ConversationHistory.AddLine(turnState, line1);
            ConversationHistory.AddLine(turnState, line2);
            ConversationHistory.AddLine(turnState, line3);

            // Act
            var array = ConversationHistory.ToArray(turnState);

            // Assert
            var expectedArray = new[] { line1, line2, line3 };
            Assert.Equal(expectedArray, array);
        }

        [Fact]
        public void ToArray_ReturnsEmptyArrayIfHistoryTooLong()
        {
            // Arrange
            var turnState = _GetTurnStateWithConversationState();
            var line = "This is a very long line of text that exceeds the maximum number of tokens allowed.";
            var maxTokens = 10;
            ConversationHistory.AddLine(turnState, line);

            // Act
            var array = ConversationHistory.ToArray(turnState, maxTokens: maxTokens);

            // Assert
            Assert.Empty(array);
        }

        [Fact]
        public void ToArray_SkipLastLineIfItExceedsMaxToken()
        {
            // Arrange
            var turnState = _GetTurnStateWithConversationState();
            var shortLine = "fits in max tokens";
            var longLine = "This is a very long line of text that exceeds the maximum number of tokens allowed.";
            var maxTokens = 10;
            ConversationHistory.AddLine(turnState, longLine);
            ConversationHistory.AddLine(turnState, shortLine);

            // Act
            var array = ConversationHistory.ToArray(turnState, maxTokens: maxTokens);

            // Assert
            Assert.Single(array);
            Assert.Equal(shortLine, array[0]);
        }

        private sealed class ConversationState : StateBase { }

    }
}
