// activity.text could be something like "what's my weather?"
// The LLM will need to first figure out the user's location
// Then pass that in to the weatherSearch
const prompt = new ChatPrompt({
  instructions: 'You are a helpful assistant that can help the user get the weather',
  model,
})
  // Include multiple `function`s as part of the prompt
  .function(
    'getUserLocation',
    'gets the location of the user',
    // This function doesn't need any parameters,
    // so we do not need to provide a schema
    async () => {
      const locations = ['Seattle', 'San Francisco', 'New York'];
      const randomIndex = Math.floor(Math.random() * locations.length);
      const location = locations[randomIndex];
      log.info('Found user location', location);
      return location;
    }
  )
  .function(
    'weatherSearch',
    'search for weather',
    {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description: 'the name of the location',
        },
      },
      required: ['location'],
    },
    async ({ location }: { location: string }) => {
      const weatherByLocation: Record<string, {}> = {
        Seattle: { temperature: 65, condition: 'sunny' },
        'San Francisco': { temperature: 60, condition: 'foggy' },
        'New York': { temperature: 75, condition: 'rainy' },
      };

      const weather = weatherByLocation[location];
      if (!weather) {
        return 'Sorry, I could not find the weather for that location';
      }

      log.info('Found weather', weather);
      return weather;
    }
  );

// The LLM will then produce a final response to be sent back to the user
const result = await prompt.send(activity.text);
await send(result.content ?? 'Sorry I could not figure it out');
