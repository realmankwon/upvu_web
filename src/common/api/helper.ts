import defaults from "../constants/defaults.json";

export const apiBase = (endpoint: string): string => `${defaults.base}${endpoint}`;

export const apiUpvuBase = (endpoint: string): string => {
  return `${process.env.RAZZLE_UPVUBASE ? process.env.RAZZLE_UPVUBASE : defaults.upvubase}${endpoint}`;
};

export const apiBaseImage = (endpoint: string): string => `${defaults.imageServer}${endpoint}`;
