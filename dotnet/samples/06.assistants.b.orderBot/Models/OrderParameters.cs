﻿using System.Text.Json;

namespace OrderBot.Models
{
    public static class OrderParameters
    {
        public static Dictionary<string, object> GetSchema()
        {
            return JsonSerializer.Deserialize<Dictionary<string, object>>(@"{
    ""type"": ""object"",
    ""properties"": {
        ""items"": {
            ""type"": ""array"",
            ""description"": ""list of items in the order"",
            ""items"": {
                ""anyOf"": [
                    {
                        ""type"": ""object"",
                        ""properties"": {
                            ""itemType"": {
                                ""type"": ""string"",
                                ""enum"": [""pizza""]
                            },
                            ""size"": {
                                ""type"": ""string"",
                                ""enum"": [""small"", ""medium"", ""large"", ""extra large""],
                                ""description"": ""default: large""
                            },
                            ""addedToppings"": {
                                ""type"": ""array"",
                                ""description"": ""toppings requested (examples: pepperoni, arugula)"",
                                ""items"": { ""type"": ""string"" }
                            },
                            ""removedToppings"": {
                                ""type"": ""array"",
                                ""description"": ""toppings requested to be removed (examples: fresh garlic, anchovies)"",
                                ""items"": { ""type"": ""string"" }
                            },
                            ""quantity"": {
                                ""type"": ""number"",
                                ""description"": ""default: 1""
                            },
                            ""name"": {
                                ""type"": ""string"",
                                ""enum"": [""Hawaiian"",""Yeti"",""Pig In a Forest"",""Cherry Bomb""],
                                ""description"": ""used if the requester references a pizza by name""
                            }
                        },
                        ""required"": [""itemType""]
                    },
                    {
                        ""type"": ""object"",
                        ""properties"": {
                            ""itemType"": {
                                ""type"": ""string"",
                                ""enum"": [""beer""]
                            },
                            ""kind"": {
                                ""type"": ""string"",
                                ""description"": ""Mack and Jacks, Sierra Nevada Pale Ale, Miller Lite""
                            },
                            ""quantity"": {
                                ""type"": ""number"",
                                ""description"": ""default: 1""
                            }
                        },
                        ""required"": [""itemType"",""kind""]
                    },
                    {
                        ""type"": ""object"",
                        ""properties"": {
                            ""itemType"": {
                                ""type"": ""string"",
                                ""enum"": [""salad""]
                            },
                            ""portion"": {
                                ""type"": ""string"",
                                ""enum"": [""half"", ""whole""],
                                ""description"": ""default: half""
                            },
                            ""style"": {
                                ""type"": ""string"",
                                ""enum"": [""Garden"", ""Greek""],
                                ""description"": ""default: Garden""
                            },
                            ""addedIngredients"": {
                                ""type"": ""array"",
                                ""description"": ""ingredients requested (examples: parmesan, croutons)"",
                                ""items"": { ""type"": ""string"" }
                            },
                            ""removedIngredients"": {
                                ""type"": ""array"",
                                ""description"": ""ingredients requested to be removed (example: red onions)"",
                                ""items"": { ""type"": ""string"" }
                            },
                            ""quantity"": {
                                ""type"": ""number"",
                                ""description"": ""default: 1""
                            }
                        },
                        ""required"": [""itemType""]
                    }
                ]
            }
        }
    },
    ""required"": [""items""]
}")!;
        }
    }
}
