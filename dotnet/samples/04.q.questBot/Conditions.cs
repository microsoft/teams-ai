namespace QuestBot
{
    public static class Conditions
    {
        public static readonly string SEASON_SPRING = "spring";
        public static readonly string SEASON_SUMMER = "summer";
        public static readonly string SEASON_FALL = "fall";
        public static readonly string SEASON_WINTER = "winter";

        public static readonly string WEATHER_SUNNY = "sunny";
        public static readonly string WEATHER_CLOUDY = "cloudy";
        public static readonly string WEATHER_RAINY = "rainy";
        public static readonly string WEATHER_SNOWY = "snowy";
        public static readonly string WEATHER_FOGGY = "foggy";
        public static readonly string WEATHER_THUNDERSTORMS = "thunderstorms";
        public static readonly string WEATHER_WINDY = "windy";

        public static readonly string TIME_DAWN = "dawn";
        public static readonly string TIME_MORNING = "morning";
        public static readonly string TIME_NOON = "noon";
        public static readonly string TIME_AFTERNOON = "afternoon";
        public static readonly string TIME_EVENING = "evening";
        public static readonly string TIME_NIGHT = "night";

        public static readonly string TEMPERATURE_FREEZING = "freezing";
        public static readonly string TEMPERATURE_COLD = "cold";
        public static readonly string TEMPERATURE_COMFORTABLE = "comfortable";
        public static readonly string TEMPERATURE_WARM = "warm";
        public static readonly string TEMPERATURE_HOT = "hot";
        public static readonly string TEMPERATURE_VERYHOT = "very hot";

        public static string DescribeConditions(double time, int day, string temperature, string weather)
            => $"It's a ${DescribeSeason(day)} ${DescribeTimeOfDay(time)} and the weather is ${temperature} and ${weather}.";

        public static string DescribeTimeOfDay(double time)
        {
            if (time >= 4 && time < 6)
            {
                return TIME_DAWN;
            }
            else if (time >= 6 && time < 12)
            {
                return TIME_MORNING;
            }
            else if (time >= 12 && time < 14)
            {
                return TIME_NOON;
            }
            else if (time >= 14 && time < 18)
            {
                return TIME_AFTERNOON;
            }
            else if (time >= 18 && time < 20)
            {
                return TIME_EVENING;
            }
            else
            {
                return TIME_NIGHT;
            }
        }

        public static string DescribeSeason(int day)
        {
            if (day >= 79 && day <= 172)
            {
                return SEASON_SPRING;
            }
            else if (day >= 173 && day <= 265)
            {
                return SEASON_SUMMER;
            }
            else if (day >= 266 && day < 355)
            {
                return SEASON_FALL;
            }
            else
            {
                return SEASON_WINTER;
            }
        }

        public static string GenerateWeather(string season)
        {
            var weather = string.Empty;
            var randomNumber = Random.Shared.NextDouble();
            if (string.Equals(season, SEASON_SPRING, StringComparison.OrdinalIgnoreCase))
            {
                if (randomNumber < 0.4)
                {
                    weather = WEATHER_SUNNY;
                }
                else if (randomNumber < 0.7)
                {
                    weather = WEATHER_CLOUDY;
                }
                else if (randomNumber < 0.9)
                {
                    weather = WEATHER_RAINY;
                }
                else if (randomNumber < 0.92)
                {
                    weather = WEATHER_SNOWY;
                }
                else if (randomNumber < 0.94)
                {
                    weather = WEATHER_FOGGY;
                }
                else
                {
                    weather = WEATHER_THUNDERSTORMS;
                }
            }
            else if (string.Equals(season, SEASON_SUMMER, StringComparison.OrdinalIgnoreCase))
            {
                if (randomNumber < 0.6)
                {
                    weather = WEATHER_SUNNY;
                }
                else if (randomNumber < 0.8)
                {
                    weather = WEATHER_CLOUDY;
                }
                else if (randomNumber < 0.9)
                {
                    weather = WEATHER_RAINY;
                }
                else if (randomNumber < 0.92)
                {
                    weather = WEATHER_FOGGY;
                }
                else if (randomNumber < 0.94)
                {
                    weather = WEATHER_SNOWY;
                }
                else
                {
                    weather = WEATHER_THUNDERSTORMS;
                }
            }
            else if (string.Equals(season, SEASON_FALL, StringComparison.OrdinalIgnoreCase))
            {
                if (randomNumber < 0.4)
                {
                    weather = WEATHER_SUNNY;
                }
                else if (randomNumber < 0.7)
                {
                    weather = WEATHER_CLOUDY;
                }
                else if (randomNumber < 0.9)
                {
                    weather = WEATHER_RAINY;
                }
                else if (randomNumber < 0.95)
                {
                    weather = WEATHER_SNOWY;
                }
                else
                {
                    weather = WEATHER_FOGGY;
                }
            }
            else if (string.Equals(season, SEASON_WINTER, StringComparison.OrdinalIgnoreCase))
            {
                if (randomNumber < 0.2)
                {
                    weather = WEATHER_SUNNY;
                }
                else if (randomNumber < 0.65)
                {
                    weather = WEATHER_CLOUDY;
                }
                else if (randomNumber < 0.8)
                {
                    weather = WEATHER_RAINY;
                }
                else if (randomNumber < 0.95)
                {
                    weather = WEATHER_SNOWY;
                }
                else
                {
                    weather = WEATHER_FOGGY;
                }
            }

            randomNumber = Random.Shared.NextDouble();
            return randomNumber < 0.1 ? $"{weather}+{WEATHER_WINDY}" : weather;
        }

        public static string GenerateTemperature(string season)
        {
            var temperature = string.Empty;
            var randomNumber = Random.Shared.NextDouble();
            if (string.Equals(season, SEASON_SPRING, StringComparison.OrdinalIgnoreCase))
            {
                if (randomNumber <= 0.05)
                {
                    temperature = TEMPERATURE_FREEZING;
                }
                else if (randomNumber <= 0.3)
                {
                    temperature = TEMPERATURE_COLD;
                }
                else if (randomNumber <= 0.8)
                {
                    temperature = TEMPERATURE_COMFORTABLE;
                }
                else if (randomNumber <= 0.95)
                {
                    temperature = TEMPERATURE_WARM;
                }
                else if (randomNumber <= 0.99)
                {
                    temperature = TEMPERATURE_HOT;
                }
                else
                {
                    temperature = TEMPERATURE_VERYHOT;
                }
            }
            else if (string.Equals(season, SEASON_SUMMER, StringComparison.OrdinalIgnoreCase))
            {
                if (randomNumber <= 0.01)
                {
                    temperature = TEMPERATURE_FREEZING;
                }
                else if (randomNumber <= 0.1)
                {
                    temperature = TEMPERATURE_COLD;
                }
                else if (randomNumber <= 0.5)
                {
                    temperature = TEMPERATURE_COMFORTABLE;
                }
                else if (randomNumber <= 0.9)
                {
                    temperature = TEMPERATURE_WARM;
                }
                else if (randomNumber <= 0.98)
                {
                    temperature = TEMPERATURE_HOT;
                }
                else
                {
                    temperature = TEMPERATURE_VERYHOT;
                }
            }
            else if (string.Equals(season, SEASON_FALL, StringComparison.OrdinalIgnoreCase))
            {
                if (randomNumber <= 0.1)
                {
                    temperature = TEMPERATURE_FREEZING;
                }
                else if (randomNumber <= 0.4)
                {
                    temperature = TEMPERATURE_COLD;
                }
                else if (randomNumber <= 0.8)
                {
                    temperature = TEMPERATURE_COMFORTABLE;
                }
                else if (randomNumber <= 0.95)
                {
                    temperature = TEMPERATURE_WARM;
                }
                else if (randomNumber <= 0.99)
                {
                    temperature = TEMPERATURE_HOT;
                }
                else
                {
                    temperature = TEMPERATURE_VERYHOT;
                }
            }
            else if (string.Equals(season, SEASON_WINTER, StringComparison.OrdinalIgnoreCase))
            {
                if (randomNumber <= 0.4)
                {
                    temperature = TEMPERATURE_FREEZING;
                }
                else if (randomNumber <= 0.7)
                {
                    temperature = TEMPERATURE_COLD;
                }
                else if (randomNumber <= 0.9)
                {
                    temperature = TEMPERATURE_COMFORTABLE;
                }
                else if (randomNumber <= 0.95)
                {
                    temperature = TEMPERATURE_WARM;
                }
                else if (randomNumber <= 0.99)
                {
                    temperature = TEMPERATURE_HOT;
                }
                else
                {
                    temperature = TEMPERATURE_VERYHOT;
                }
            }

            return temperature;
        }
    }
}
