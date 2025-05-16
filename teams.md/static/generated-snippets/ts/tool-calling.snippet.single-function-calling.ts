const prompt = new ChatPrompt({
  instructions: 'You are a helpful assistant that can look up Pokemon for the user.',
  model,
})
  // Include `function` as part of the prompt
  .function(
    'pokemonSearch',
    'search for pokemon',
    // Include the schema of the parameters
    // the LLM needs to return to call the function
    {
      type: 'object',
      properties: {
        pokemonName: {
          type: 'string',
          description: 'the name of the pokemon',
        },
      },
      required: ['text'],
    },
    // The cooresponding function will be called
    // automatically if the LLM decides to call this function
    async ({ pokemonName }: PokemonSearch) => {
      log.info('Searching for pokemon', pokemonName);
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`);
      if (!response.ok) {
        throw new Error('Pokemon not found');
      }
      const data = await response.json();
      // The result of the function call is sent back to the LLM
      return {
        name: data.name,
        height: data.height,
        weight: data.weight,
        types: data.types.map((type: { type: { name: string } }) => type.type.name),
      };
    }
  );

// The LLM will then produce a final response to be sent back to the user
// activity.text could have text like 'pikachu'
const result = await prompt.send(activity.text);
await send(result.content ?? 'Sorry I could not find that pokemon');
