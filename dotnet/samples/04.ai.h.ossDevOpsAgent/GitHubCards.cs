using AdaptiveCards;
using Microsoft.Bot.Schema;
using Newtonsoft.Json.Linq;
using DevOpsAgent.GitHubModels;

namespace DevOpsAgent
{
    /// <summary>
    /// Creates the adaptive cards for the GitHub pull requests.
    /// </summary>
    public class GitHubCards
    {
        /// <summary>
        /// Creates the adaptive card for the "ListPRs" plugin
        /// </summary>
        /// <param name="title">The title of the card</param>
        /// <param name="pullRequests">The list of pull requests</param>
        /// <param name="allLabels">All the labels for filtering</param>
        /// <param name="allAssignees">All the assignees for filtering</param>
        /// <param name="allAuthors">All the authors for filtering</param>
        /// <returns></returns>
        public static AdaptiveCard CreateListPRsAdaptiveCard(string title, IList<GitHubPR> pullRequests, HashSet<string> allLabels, HashSet<string> allAssignees, HashSet<string> allAuthors)
        {
            var card = new AdaptiveCard(new AdaptiveSchemaVersion(1, 5))
            {
                Body = new List<AdaptiveElement>
                {
                    new AdaptiveTextBlock
                    {
                        Text = $"📄 {title}",
                        Weight = AdaptiveTextWeight.Bolder,
                        Size = AdaptiveTextSize.Large,
                        Color = AdaptiveTextColor.Accent,
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
                    Text = "No pull requests found 🚫",
                    Wrap = true,
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

            if (pullRequests!.Count > 0)
            {
                var filters = new AdaptiveContainer
                {
                    Items = new List<AdaptiveElement>
                    {
                        new AdaptiveTextBlock
                        {
                            Text = "🔍 Filters",
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
                                        { "verb", "githubFilters" },
                                        { "pullRequests", pullRequests }
                                    }
                                }
                            }
                        }
                    }
                };
                card.Body.Add(filters);
            }
            return card;
        }

        /// <summary>
        /// Creates the adaptive card for the "FilterPRs" plugin
        /// </summary>
        /// <param name="title">Title of the card</param>
        /// <param name="pullRequests">The list of pull requests</param>
        /// <param name="selectedLabels">The labels used to filter</param>
        /// <param name="selectedAssignees">The assignees used to filter</param>
        /// <param name="selectedAuthors">The authors used to filter</param>
        /// <returns></returns>
        public static AdaptiveCard CreateFilterPRsAdaptiveCard(string title, IList<GitHubPR> pullRequests, string[] selectedLabels, string[] selectedAssignees, string[] selectedAuthors)
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

            var combinedFilters = selectedLabels.Concat(selectedAssignees).Concat(selectedAuthors).ToArray();

            if (combinedFilters.Length > 0)
            {
                var filterContainer = new AdaptiveContainer
                {
                    Items = new List<AdaptiveElement>
                    {
                        new AdaptiveTextBlock
                        {
                            Text = "Fiters applied:",
                            Weight = AdaptiveTextWeight.Bolder,
                            Size = AdaptiveTextSize.Medium,
                        }
                    }
                };

                foreach (var filter in combinedFilters)
                {
                    filterContainer.Items.Add(new AdaptiveTextBlock
                    {
                        Text = filter,
                        Color = AdaptiveTextColor.Accent,
                        Weight = AdaptiveTextWeight.Bolder,
                        Size = AdaptiveTextSize.Small,
                        Wrap = true,
                        Spacing = AdaptiveSpacing.Small
                    });
                }

                card.Body.Add(filterContainer);
            }

            return card;
        }

        private static AdaptiveContainer CreatePRItemContainer(GitHubPR pr)
        {
            var prItemContainer = new AdaptiveContainer
            {
                Spacing = AdaptiveSpacing.Medium,
                Style = AdaptiveContainerStyle.Accent,
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
                                        Wrap = true,
                                        Size = AdaptiveTextSize.Small,
                                        Color = AdaptiveTextColor.Accent
                                    }
                                }
                            }
                        }
                    },
                    new AdaptiveTextBlock
                    {
                        Text = $"**Author**: {pr.User.Login ?? "Unknown"}",
                        IsSubtle = true,
                        Spacing = AdaptiveSpacing.None
                    },
                    new AdaptiveTextBlock
                    {
                        Text = $"**Created**: {pr.CreatedAt:MMM dd, yyyy}",
                        IsSubtle = true,
                        Spacing = AdaptiveSpacing.None
                    },
                    new AdaptiveTextBlock
                    {
                        Text = $"**Status**: {(pr.State == "open" ? "🟢 Open" : "🔴 Closed")}",
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
                    Text = $"**Labels**: {string.Join(", ", labelTexts)}",
                    IsSubtle = true,
                    Spacing = AdaptiveSpacing.None,
                    Wrap = true,
                    Italic = true,
                });
            }

            prItemContainer.Items.Add(new AdaptiveActionSet
            {
                Actions = new List<AdaptiveAction>
                        {
                            new AdaptiveToggleVisibilityAction
                            {
                                Title = "Show/Hide Description",
                                TargetElements = new List<AdaptiveTargetElement>
                                {
                                    new AdaptiveTargetElement
                                    {
                                        ElementId = $"description-{pr.Number}"
                                    }
                                }
                            }
                        }
            });

            prItemContainer.Items.Add(
                    new AdaptiveTextBlock
                    {
                        Id = $"description-{pr.Number}",
                        Text = $"Description: {pr.Body}",
                        Wrap = true,
                        IsSubtle = true,
                        Spacing = AdaptiveSpacing.None,
                        IsVisible = false
                    });

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

            return prItemContainer;
        }

        public static Attachment CreatePullRequestCard(JObject payload)
        {
            var pullRequest = payload["pull_request"];
            string assignee = pullRequest["assignee"] != null ? pullRequest["assignee"]["login"].ToString() : "Unknown User";
            string prTitle = pullRequest["title"].ToString();
            string prUrl = pullRequest["html_url"].ToString();
            int prNumber = pullRequest["number"].Value<int>();

            var card = new AdaptiveCard(new AdaptiveSchemaVersion(1, 2))
            {
                Body = new List<AdaptiveElement>
                {
                    new AdaptiveTextBlock
                    {
                        Text = $"👤 Assignee Request for PR #{prNumber}",
                        Weight = AdaptiveTextWeight.Bolder,
                        Size = AdaptiveTextSize.Large,
                        Color = AdaptiveTextColor.Accent
                    },
                    new AdaptiveTextBlock
                    {
                        Text = $"{prTitle}",
                        Wrap = true,
                        Size = AdaptiveTextSize.Medium,
                        Weight = AdaptiveTextWeight.Bolder,
                    },
                    new AdaptiveTextBlock
                    {
                        Text = $"{assignee} has been assigned to review this pull request.",
                        Wrap = true,
                        Size = AdaptiveTextSize.Medium,
                        Spacing = AdaptiveSpacing.Medium
                    }
                },
                Actions = new List<AdaptiveAction>
                {
                    new AdaptiveOpenUrlAction
                    {
                        Title = "View on GitHub",
                        Url = new Uri(prUrl)
                    }
                }
            };

            return new Attachment
            {
                ContentType = AdaptiveCard.ContentType,
                Content = card
            };
        }

        public static Attachment CreatePullRequestStateCard(JObject payload)
        {
            var pullRequest = payload["pull_request"];
            string action = payload["action"].ToString();
            string prTitle = pullRequest["title"].ToString();
            string prUrl = pullRequest["html_url"].ToString();
            int prNumber = pullRequest["number"].Value<int>();

            var card = new AdaptiveCard(new AdaptiveSchemaVersion(1, 2))
            {
                Body = new List<AdaptiveElement>
                {
                     new AdaptiveTextBlock
                            {
                                Text = $"🔔 Status Update for PR #{prNumber}",
                                Weight = AdaptiveTextWeight.Bolder,
                                Size = AdaptiveTextSize.Large,
                                Color = AdaptiveTextColor.Accent
                            },
                            new AdaptiveTextBlock
                            {
                                Text = $"{prTitle}",
                                Wrap = true,
                                Size = AdaptiveTextSize.Medium,
                                Weight = AdaptiveTextWeight.Bolder,
                            },
                            new AdaptiveTextBlock
                            {
                                Text = $"PR is now {action}",
                                Wrap = true,
                                Size = AdaptiveTextSize.Medium,
                                Spacing = AdaptiveSpacing.Medium
                            }
                },
                Actions = new List<AdaptiveAction>
                {
                    new AdaptiveOpenUrlAction
                    {
                        Title = "View on GitHub",
                        Url = new Uri(prUrl)
                    }
                }
            };

            return new Attachment
            {
                ContentType = AdaptiveCard.ContentType,
                Content = card
            };
        }
    }
}
