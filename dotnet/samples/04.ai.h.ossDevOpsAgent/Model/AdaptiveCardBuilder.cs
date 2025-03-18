using AdaptiveCards;

namespace OSSDevOpsAgent.Model
{
    public class AdaptiveCardBuilder
    {
        public static AdaptiveCard CreateListPRsAdaptiveCard(string title, IList<PullRequest> pullRequests, HashSet<string> allLabels, HashSet<string> allAssignees, HashSet<string> allAuthors)
        {
            var card = new AdaptiveCard(new AdaptiveSchemaVersion(1, 5))
            {
                Body = new List<AdaptiveElement>
                {
                    new AdaptiveTextBlock
                    {
                        Text = title,
                        Weight = AdaptiveTextWeight.Bolder,
                        Size = AdaptiveTextSize.Large
                    },
                    new AdaptiveContainer
                    {
                        Items = new List<AdaptiveElement>
                        {
                            new AdaptiveTextBlock
                            {
                                Text = "Filters",
                                Weight = AdaptiveTextWeight.Bolder
                            },
                            new AdaptiveChoiceSetInput
                            {
                                Id = "labelFilter",
                                Style = AdaptiveChoiceInputStyle.Compact,
                                IsMultiSelect = true,
                                Label = "Labels",
                                Choices = allLabels.Select(label => new AdaptiveChoice
                                {
                                    Title = label,
                                    Value = label
                                }).ToList()
                            },
                            new AdaptiveChoiceSetInput
                            {
                                Id = "assigneeFilter",
                                Style = AdaptiveChoiceInputStyle.Compact,
                                IsMultiSelect = true,
                                Label = "Assignees",
                                Choices = allAssignees.Select(assignee => new AdaptiveChoice
                                {
                                    Title = assignee,
                                    Value = assignee
                                }).ToList()
                            },
                            new AdaptiveChoiceSetInput
                            {
                                Id = "authorFilter",
                                Style = AdaptiveChoiceInputStyle.Compact,
                                IsMultiSelect = true,
                                Label = "Authors",
                                Choices = allAuthors.Select(author => new AdaptiveChoice
                                {
                                    Title = author,
                                    Value = author
                                }).ToList()
                            },
                            new AdaptiveActionSet
                            {
                                Actions = new List<AdaptiveAction>
                                {
                                    new AdaptiveSubmitAction
                                    {
                                        Title = "Apply Filters",
                                        Data = new Dictionary<string, object>
                                        {
                                            { "verb", "applyFilters" },
                                            { "action", "applyFilters" },
                                            { "pullRequests", pullRequests }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            };

            var prListContainer = new AdaptiveContainer
            {
                Id = "prContainer",
                Items = new List<AdaptiveElement>()
            };

            if (pullRequests == null || pullRequests.Count == 0)
            {
                prListContainer.Items.Add(new AdaptiveTextBlock
                {
                    Text = "No pull requests found",
                    Wrap = true
                });
            }
            else
            {
                foreach (var pr in pullRequests)
                {
                    var prItemContainer = CreatePRItemContainer(pr);
                    prListContainer.Items.Add(prItemContainer);
                }
            }

            card.Body.Add(prListContainer);
            return card;
        }

        public static AdaptiveCard CreateFilterPRsAdaptiveCard(string title, IList<PullRequest> pullRequests)
        {
            var card = new AdaptiveCard(new AdaptiveSchemaVersion(1, 5))
            {
                Body = new List<AdaptiveElement>
                {
                    new AdaptiveTextBlock
                    {
                        Text = title,
                        Weight = AdaptiveTextWeight.Bolder,
                        Size = AdaptiveTextSize.Large
                    },
                }
            };

            var prListContainer = new AdaptiveContainer
            {
                Id = "prContainer",
                Items = new List<AdaptiveElement>()
            };

            if (pullRequests == null || pullRequests.Count == 0)
            {
                prListContainer.Items.Add(new AdaptiveTextBlock
                {
                    Text = "No pull requests found",
                    Wrap = true
                });
            }
            else
            {
                foreach (var pr in pullRequests)
                {
                    var prItemContainer = CreatePRItemContainer(pr);
                    prListContainer.Items.Add(prItemContainer);
                }
            }

            card.Body.Add(prListContainer);
            return card;
        }

        private static AdaptiveContainer CreatePRItemContainer(PullRequest pr)
        {
            var prItemContainer = new AdaptiveContainer
            {
                Items = new List<AdaptiveElement>
                {
                    new AdaptiveColumnSet
                    {
                        Columns = new List<AdaptiveColumn>
                        {
                            new AdaptiveColumn
                            {
                                Width = AdaptiveColumnWidth.Stretch,
                                Items = new List<AdaptiveElement>
                                {
                                    new AdaptiveTextBlock
                                    {
                                        Text = $"#{pr.Number}: {pr.Title}",
                                        Weight = AdaptiveTextWeight.Bolder,
                                        Wrap = true
                                    }
                                }
                            }
                        }
                    },
                    new AdaptiveColumnSet
                    {
                        Columns = new List<AdaptiveColumn>
                        {
                            new AdaptiveColumn
                            {
                                Width = AdaptiveColumnWidth.Auto,
                                Items = new List<AdaptiveElement>
                                {
                                    new AdaptiveTextBlock
                                    {
                                        Text = $"Author: {pr.User.Login ?? "Unknown"}",
                                        IsSubtle = true,
                                        Spacing = AdaptiveSpacing.None
                                    }
                                }
                            },
                            new AdaptiveColumn
                            {
                                Width = AdaptiveColumnWidth.Auto,
                                Items = new List<AdaptiveElement>
                                {
                                    new AdaptiveTextBlock
                                    {
                                        Text = $"Created: {pr.CreatedAt:MMM dd, yyyy}",
                                        IsSubtle = true,
                                        Spacing = AdaptiveSpacing.None
                                    }
                                }
                            }
                        }
                    },
                    new AdaptiveColumnSet
                    {
                        Columns = new List<AdaptiveColumn>
                        {
                            new AdaptiveColumn
                            {
                                Width = AdaptiveColumnWidth.Stretch,
                                Items = new List<AdaptiveElement>
                                {
                                    new AdaptiveTextBlock
                                    {
                                        Text = $"Status: {pr.State}",
                                        IsSubtle = true,
                                        Spacing = AdaptiveSpacing.None
                                    }
                                }
                            }
                        }
                    },
                    new AdaptiveTextBlock
                    {
                        Text = $"Description: {pr.Body}",
                        Wrap = true,
                        IsSubtle = true,
                        Spacing = AdaptiveSpacing.None
                    }
                }
            };

            if (pr.Labels != null && pr.Labels.Count > 0)
            {
                var labelTexts = pr.Labels.Select(l => l.Name).ToList();
                prItemContainer.Items.Add(new AdaptiveTextBlock
                {
                    Text = $"Labels: {string.Join(", ", labelTexts)}",
                    IsSubtle = true,
                    Spacing = AdaptiveSpacing.None,
                    Wrap = true
                });
            }
            else
            {
                prItemContainer.Items.Add(new AdaptiveTextBlock
                {
                    Text = "No labels",
                    IsSubtle = true,
                    Spacing = AdaptiveSpacing.None
                });
            }

            if (!string.IsNullOrEmpty(pr.HtmlUrl))
            {
                prItemContainer.Items.Add(new AdaptiveActionSet
                {
                    Actions = new List<AdaptiveAction>
                    {
                        new AdaptiveOpenUrlAction
                        {
                            Title = "View on GitHub",
                            Url = new Uri(pr.HtmlUrl)
                        }
                    }
                });
            }
            else
            {
                prItemContainer.Items.Add(new AdaptiveTextBlock
                {
                    Text = "GitHub URL not available",
                    IsSubtle = true,
                    Spacing = AdaptiveSpacing.None
                });
            }

            return prItemContainer;
        }
    }
}
