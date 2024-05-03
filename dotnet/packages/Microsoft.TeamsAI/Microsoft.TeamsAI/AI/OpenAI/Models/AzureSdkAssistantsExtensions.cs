using Azure;
using Azure.AI.OpenAI.Assistants;
using Azure.Core.Serialization;

namespace Microsoft.Teams.AI.AI.OpenAI.Models
{
    internal static class AzureSdkAssistantsExtensions
    {
        private static readonly JsonObjectSerializer _serializer = new();

        public static Assistant ToAssistant(this Azure.AI.OpenAI.Assistants.Assistant assistant)
        {
            Assistant newAssistant = new()
            {
                Id = assistant.Id,
                CreatedAt = assistant.CreatedAt.ToUnixTimeSeconds(),
                Description = assistant.Description,
                FileIds = assistant.FileIds.ToList(),
                Model = assistant.Model,
                Instructions = assistant.Instructions,
                Metadata = assistant.Metadata,
                Tools = assistant.Tools.ToTools(),
            };

            return newAssistant;
        }

        public static List<Tool> ToTools(this IReadOnlyList<ToolDefinition> tools)
        {
            List<Tool> newTools = new();
            foreach (ToolDefinition tool in tools)
            {
                Tool? newTool = tool.ToTool();
                if (newTool == null)
                {
                    continue;
                }
                newTools.Add(newTool);
            }

            return newTools;
        }

        public static Tool? ToTool(this ToolDefinition toolDefinition)
        {
            Tool tool = new();
            if (toolDefinition is FunctionToolDefinition function)
            {
                tool.Type = Tool.FUNCTION_CALLING_TYPE;
                tool.Function = new Function()
                {
                    Name = function.Name,
                    Description = function.Description,
                    Parameters = function.Parameters.ToObject<Dictionary<string, object>>(_serializer)!,
                };
            }
            else if (toolDefinition is CodeInterpreterToolDefinition)
            {
                tool.Type = Tool.CODE_INTERPRETER_TYPE;
            }
            else
            {
                // Note: Legacy retrieval tool is not being handled.
                return null;
            }

            return tool;
        }

        public static Thread ToThread(this AssistantThread thread)
        {
            return new Thread()
            {
                CreatedAt = thread.CreatedAt.ToUnixTimeSeconds(),
                Id = thread.Id,
                Metadata = thread.Metadata,
            };
        }

        public static Message ToMessage(this ThreadMessage message)
        {
            Message newMessage = new()
            {
                Id = message.Id,
                AssistantId = message.AssistantId,
                CreatedAt = message.CreatedAt.ToUnixTimeSeconds(),
                FileIds = message.FileIds,
                Metadata = message.Metadata,
                Role = message.Role.ToString(),
                RunId = message.RunId,
                ThreadId = message.ThreadId
            };

            foreach (Azure.AI.OpenAI.Assistants.MessageContent messageContent in message.ContentItems)
            {
                MessageContent? newMessageContent = messageContent.ToMessageContent();
                if (newMessageContent == null)
                {
                    continue;
                }
                newMessage.Content.Add(newMessageContent);
            }

            return newMessage;
        }

        public static MessageContent? ToMessageContent(this Azure.AI.OpenAI.Assistants.MessageContent messageContent)
        {
            MessageContent newMessage = new();
            if (messageContent is MessageTextContent textMessage)
            {
                newMessage.Type = "text";
                newMessage.Text = new MessageContentText()
                {
                    Value = textMessage.Text,
                    Annotations = textMessage.Annotations
                };

                return newMessage;
            }
            else if (messageContent is MessageImageFileContent imageFileContent)
            {
                newMessage.Type = "image_file";
                newMessage.ImageFile = imageFileContent;
                return newMessage;
            }

            return null;
        }

        public static Run? ToRun(this ThreadRun run)
        {
            Run newRun = new()
            {
                Id = run.Id,
                AssistantId = run.AssistantId,
                CancelledAt = run.CancelledAt?.ToUnixTimeSeconds(),
                CompletedAt = run.CompletedAt?.ToUnixTimeSeconds(),
                ExpiredAt = run.ExpiresAt?.ToUnixTimeSeconds(),
                FailedAt = run.FailedAt?.ToUnixTimeSeconds(),
                FileIds = run.FileIds.ToList(),
                Instructions = run.Instructions,
                LastError = new()
                {
                    Code = run.LastError?.Code ?? string.Empty,
                    Message = run.LastError?.Message ?? string.Empty,
                },
                Metadata = run.Metadata,
                Model = run.Model,
                RequiredAction = run.RequiredAction != null ? run.RequiredAction.ToRequiredAction() : null,
                StartedAt = run.StartedAt?.ToUnixTimeSeconds(),
                Status = run.Status.ToString(),
                ThreadId = run.ThreadId,
                Tools = run.Tools.ToTools()
            };

            return newRun;
        }

        public static RequiredAction? ToRequiredAction(this Azure.AI.OpenAI.Assistants.RequiredAction requiredAction)
        {
            if (requiredAction is SubmitToolOutputsAction submitToolOutputsAction)
            {
                return new RequiredAction()
                {
                    SubmitToolOutputs = new()
                    {
                        ToolCalls = submitToolOutputsAction.ToolCalls.ToToolCalls()
                    }
                };
            }
            return null;
        }

        public static List<ToolCall> ToToolCalls(this IReadOnlyList<RequiredToolCall> toolCalls)
        {
            List<ToolCall> newToolCalls = new();
            foreach (RequiredToolCall requiredToolCall in toolCalls)
            {
                ToolCall? toolCall = requiredToolCall.ToToolCall();
                if (toolCall is null)
                {
                    continue;
                }
                newToolCalls.Add(toolCall);
            }
            return newToolCalls;
        }

        public static ToolCall? ToToolCall(this RequiredToolCall requiredToolCall)
        {
            if (requiredToolCall is RequiredFunctionToolCall functionToolCall)
            {
                return new ToolCall()
                {
                    Id = functionToolCall.Id,
                    Function = new()
                    {
                        Arguments = functionToolCall.Arguments,
                        Name = functionToolCall.Name
                    }
                };
            }

            return null;
        }
    }
}
