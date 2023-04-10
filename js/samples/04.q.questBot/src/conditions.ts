/**
 * @param time
 * @param day
 * @param temperature
 * @param weather
 */
export function describeConditions(time: number, day: number, temperature: string, weather: string): string {
    return `It's a ${describeSeason(day)} ${describeTimeOfDay(time)} and the weather is ${temperature} and ${weather}.`;
}

/**
 * @param time
 */
export function describeTimeOfDay(time: number): 'dawn' | 'morning' | 'noon' | 'afternoon' | 'evening' | 'night' {
    if (time >= 4 && time < 6) {
        return 'dawn';
    } else if (time >= 6 && time < 12) {
        return 'morning';
    } else if (time >= 12 && time < 14) {
        return 'noon';
    } else if (time >= 14 && time < 18) {
        return 'afternoon';
    } else if (time >= 18 && time < 20) {
        return 'evening';
    } else {
        return 'night';
    }
}

/**
 * @param day
 */
export function describeSeason(day: number): 'spring' | 'summer' | 'fall' | 'winter' {
    if (day >= 79 && day <= 172) {
        return 'spring';
    } else if (day >= 173 && day <= 265) {
        return 'summer';
    } else if (day >= 266 && day < 355) {
        return 'fall';
    } else {
        return 'winter';
    }
}

/*
Weather Patterns:

Spring: Sunny - 40%, Cloudy - 30%, Rainy - 20%, Windy - 5%, Snowy - 2%, Foggy - 2%, Humid - 1%
Summer: Sunny - 60%, Cloudy - 20%, Rainy - 10%, Windy - 5%, Snowy - 2%, Foggy - 2%, Humid - 1%
Fall: Sunny - 40%, Cloudy - 30%, Rainy - 20%, Windy - 5%, Snowy - 5%, Foggy - 5%, Humid - 5%
Winter: Sunny - 20%, Cloudy - 40%, Rainy - 10%, Windy - 10%, Snowy - 10%, Foggy - 5%, Humid - 5%
*/

/**
 * @param season
 */
export function generateWeather(season: string): string {
    let weather: string = '';
    let modifier: string;
    const randomNumber = Math.random();

    if (season === 'spring') {
        if (randomNumber < 0.4) {
            weather = 'sunny';
        } else if (randomNumber < 0.7) {
            weather = 'cloudy';
        } else if (randomNumber < 0.9) {
            weather = 'rainy';
        } else if (randomNumber < 0.92) {
            weather = 'snowy';
        } else if (randomNumber < 0.94) {
            weather = 'foggy';
        } else {
            weather = 'thunderstorms';
        }
    } else if (season === 'summer') {
        if (randomNumber < 0.6) {
            weather = 'sunny';
        } else if (randomNumber < 0.8) {
            weather = 'cloudy';
        } else if (randomNumber < 0.9) {
            weather = 'rainy';
        } else if (randomNumber < 0.92) {
            weather = 'foggy';
        } else if (randomNumber < 0.94) {
            weather = 'snowy';
        } else {
            weather = 'thunderstorms';
        }
    } else if (season === 'fall') {
        if (randomNumber < 0.4) {
            weather = 'sunny';
        } else if (randomNumber < 0.7) {
            weather = 'cloudy';
        } else if (randomNumber < 0.9) {
            weather = 'rainy';
        } else if (randomNumber < 0.95) {
            weather = 'snowy';
        }
    } else if (season === 'winter') {
        if (randomNumber < 0.2) {
            weather = 'sunny';
        } else if (randomNumber < 0.65) {
            weather = 'cloudy';
        } else if (randomNumber < 0.8) {
            weather = 'rainy';
        } else if (randomNumber < 0.95) {
            weather = 'snowy';
        } else {
            weather = 'foggy';
        }
    }

    const modifierRandomNumber = Math.random();
    if (weather != 'windy' && modifierRandomNumber < 0.1) {
        modifier = '+windy';
    } else {
        modifier = '';
    }

    return weather + modifier;
}

/**
 * @param season
 */
export function generateTemperature(season: string): string {
    let temperature: string = '';
    const randomNumber = Math.random();

    if (season === 'spring') {
        if (randomNumber <= 0.05) {
            temperature = 'freezing';
        } else if (randomNumber <= 0.3) {
            temperature = 'cold';
        } else if (randomNumber <= 0.8) {
            temperature = 'comfortable';
        } else if (randomNumber <= 0.95) {
            temperature = 'warm';
        } else if (randomNumber <= 0.94) {
            temperature = 'hot';
        } else {
            temperature = 'very hot';
        }
    } else if (season === 'summer') {
        if (randomNumber <= 0.01) {
            temperature = 'freezing';
        } else if (randomNumber <= 0.1) {
            temperature = 'cold';
        } else if (randomNumber <= 0.5) {
            temperature = 'comfortable';
        } else if (randomNumber <= 0.9) {
            temperature = 'warm';
        } else if (randomNumber <= 0.98) {
            temperature = 'hot';
        } else {
            temperature = 'very hot';
        }
    } else if (season === 'fall') {
        if (randomNumber <= 0.1) {
            temperature = 'freezing';
        } else if (randomNumber <= 0.4) {
            temperature = 'cold';
        } else if (randomNumber <= 0.8) {
            temperature = 'comfortable';
        } else if (randomNumber <= 0.95) {
            temperature = 'warm';
        } else if (randomNumber <= 0.99) {
            temperature = 'hot';
        } else {
            temperature = 'very hot';
        }
    } else if (season === 'winter') {
        if (randomNumber <= 0.4) {
            temperature = 'freezing';
        } else if (randomNumber <= 0.7) {
            temperature = 'cold';
        } else if (randomNumber <= 0.9) {
            temperature = 'comfortable';
        } else if (randomNumber <= 0.95) {
            temperature = 'warm';
        } else if (randomNumber <= 0.99) {
            temperature = 'hot';
        } else {
            temperature = 'very hot';
        }
    }

    return temperature;
}
