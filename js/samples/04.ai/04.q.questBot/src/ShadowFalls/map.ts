import { IMap } from "../interfaces";

export const map: IMap = {
    locations: {
        village: {
                id: 'village',
                description: 'The small village of Shadow Falls.',
                details: `The small village of Shadow Falls is a bustling settlement filled with small homes, shops, and taverns. The streets are bustling with people going about their daily lives, and the smell of fresh baked goods and spices wafts through the air. The sun is shining brightly, and the sky is a beautiful azure blue. At the center of town stands an old stone tower, its entrance guarded by two large stone statues. The villagers of Shadow Falls are friendly and always willing to help adventurers in need.`,
                prompt: '',
                north: 'mountains',
                west: 'lake',
                south: 'forest',
                east: 'desert'
            },
        forest: {
                id: 'forest',
                description: 'The forest is a large and mysterious place.',
                details: ``,
                prompt: '',
                north: 'village',
                south: 'cave'
            },
        river: {
                id: 'river',
                description: 'The river is a winding and treacherous path.',
                details: ``,
                prompt: '',
                north: 'valley',
                west: 'swamp',
                south: 'lake',
                east: 'mountains'
            },
        desert: {
                id: 'desert',
                description: 'The desert is a vast and desolate wasteland.',
                details: ``,
                prompt: '',
                north: 'canyon',
                west: 'village',
                south: 'pyramids'
            },
        mountains: {
                id: 'mountains',
                description: 'The mountain range is a rugged and dangerous land.',
                details: ``,
                prompt: '',
                west: 'river',
                south: 'village',
                east: 'canyon'
            },
        canyon: {
                id: 'canyon',
                description: 'The canyon is a deep and treacherous ravine.',
                details: ``,
                prompt: '',
                west: 'mountains',
                south: 'desert'
            },
        lake: {
                id: 'lake',
                description: 'The lake is a peaceful and serene body of water.',
                details: ``,
                prompt: '',
                north: 'river',
                south: 'oasis',
                east: 'village'
            },
        swamp: {
                id: 'swamp',
                description: 'The swamp is a murky and treacherous marsh.',
                details: ``,
                prompt: '',
                east: 'river'
            },
        oasis: {
                id: 'oasis',
                description: 'The oasis is a lush and tropical paradise.',
                details: ``,
                prompt: '',
                north: 'lake'
            },
        valley: {
                id: 'valley',
                description: 'The hidden valley is a mysterious and uncharted land.',
                details: ``,
                prompt: '',
                south: 'river',
                east: 'temple'
            },
        temple: {
                id: 'temple',
                description: 'The abandoned temple is a forgotten and crumbling ruin.',
                details: ``,
                prompt: '',
                west: 'valley'
            },
        cave: {
                id: 'cave',
                description: 'The hidden cave is a dark and mysterious place.',
                details: ``,
                prompt: '',
                north: 'forest'
            },
        pyramids: {
                id: 'pyramids',
                description: 'The accent pyramids have stood the test of time for ages.',
                details: ``,
                prompt: '',
                north: 'desert'
            }
    }
};
