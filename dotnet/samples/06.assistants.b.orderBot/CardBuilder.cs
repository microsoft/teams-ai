using AdaptiveCards;
using Microsoft.Bot.Schema;
using Newtonsoft.Json;
using OrderBot.Models;
using JsonSerializer = System.Text.Json.JsonSerializer;

namespace OrderBot
{
    public static class CardBuilder
    {
        public static Attachment NewOrderAttachment(IList<Dictionary<string, object>> orderItems)
        {
            List<CardItem> cardItems = new()
            {
                new()
                {
                    Text = "Items:",
                    Weight = "Bolder"
                }
            };
            foreach (var orderItem in orderItems)
            {
                object actualOrder = ToOrderItem(orderItem);
                if (actualOrder is Pizza pizza)
                {
                    string name = pizza.Name ?? "Custom Pizza";
                    string size = pizza.Size ?? "Large";
                    int quantity = pizza.Quantity ?? 1;
                    cardItems.Add(new()
                    {
                        Text = $"{name} - Size: {size}, Quantity: {quantity}"
                    });
                }
                else if (actualOrder is Beer beer)
                {
                    int quantity = beer.Quantity ?? 1;
                    cardItems.Add(new()
                    {
                        Text = $"Beer - Kind: {beer.Kind}, Quantity: {quantity}"
                    });
                }
                else if (actualOrder is Salad salad)
                {
                    string style = salad.Style ?? "Garden";
                    string portion = salad.Portion ?? "half";
                    int quantity = salad.Quantity ?? 1;
                    cardItems.Add(new()
                    {
                        Text = $"Salad - Style: {style}, Portion: {portion}, Quantity: {quantity}"
                    });
                }
                else if (actualOrder is Unknown unknown)
                {
                    cardItems.Add(new()
                    {
                        Text = $"Unknown Item: {unknown.Item}",
                        Color = "Attention"
                    });
                }
            }

            string cardContent = @"{
    ""$schema"": ""http://adaptivecards.io/schemas/adaptive-card.json"",
    ""type"": ""AdaptiveCard"",
    ""version"": ""1.2"",
    ""body"": [
        {
            ""type"": ""TextBlock"",
            ""text"": ""Your Order Summary"",
            ""weight"": ""Bolder"",
            ""size"": ""Medium"",
            ""wrap"": true
        },
        {
            ""type"": ""Container"",
            ""items"":"
            + JsonSerializer.Serialize(cardItems)
            + @"
        }
    ]
}";

            return new Attachment
            {
                // Use Newtonsoft Json here to be compatible with AdaptiveCard
                Content = JsonConvert.DeserializeObject(cardContent),
                ContentType = AdaptiveCard.ContentType
            };
        }

        private static object ToOrderItem(Dictionary<string, object> item)
        {
            if (item.ContainsKey("itemType"))
            {
                switch (item["itemType"].ToString())
                {
                    case "pizza":
                        return JsonSerializer.Deserialize<Pizza>(JsonSerializer.Serialize(item))!;
                    case "beer":
                        return JsonSerializer.Deserialize<Beer>(JsonSerializer.Serialize(item))!;
                    case "salad":
                        return JsonSerializer.Deserialize<Salad>(JsonSerializer.Serialize(item))!;
                    default:
                        break;
                }
            }

            return new Unknown
            {
                Item = JsonSerializer.Serialize(item)
            };
        }
    }
}
