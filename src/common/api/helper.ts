import defaults from "../constants/defaults.json";

export const apiUpvuBase = (endpoint: string): string => `${defaults.upvubase}${endpoint}`;
export const apiBase = (endpoint: string): string => `${defaults.base}${endpoint}`;

export const apiBaseImage = (endpoint: string): string => `${defaults.imageServer}${endpoint}`;
