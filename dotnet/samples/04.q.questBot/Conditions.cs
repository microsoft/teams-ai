namespace QuestBot
{
    public static class Conditions
    {
        public static string DescribeConditions(double time, int day, string temperature, string weather)
            => $"It's a ${DescribeSeason(day)} ${DescribeTimeOfDay(time)} and the weather is ${temperature} and ${weather}.";

        public static string DescribeTimeOfDay(double time)
        {
            if (time >= 4 && time < 6)
            {
                return "dawn";
            }
            else if (time >= 6 && time < 12)
            {
                return "morning";
            }
            else if (time >= 12 && time < 14)
            {
                return "noon";
            }
            else if (time >= 14 && time < 18)
            {
                return "afternoon";
            }
            else if (time >= 18 && time < 20)
            {
                return "evening";
            }
            else
            {
                return "night";
            }
        }

        public static string DescribeSeason(int day)
        {
            if (day >= 79 && day <= 172)
            {
                return "spring";
            }
            else if (day >= 173 && day <= 265)
            {
                return "summer";
            }
            else if (day >= 266 && day < 355)
            {
                return "fall";
            }
            else
            {
                return "winter";
            }
        }
    }
}
