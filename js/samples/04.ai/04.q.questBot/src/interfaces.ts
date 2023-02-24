
export interface IAction {
    title: string,
    examples: string[];
}

export interface IItemList {
    [item: string]: number;
}

export interface IMap {
    locations: { [id: string]: IMapLocation };
}

export interface IMapLocation {
    id: string;
    description: string;
    details: string;
    prompt: string;
    north?: string;
    west?: string;
    south?: string;
    east?: string;
    up?: string;
    down?: string;
}

export interface IQuest {
    title: string;
    backstory: string;
    locations: string[];
    startLocation: string;
}