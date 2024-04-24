import axios from 'axios';
import chalk from 'chalk';
import { Anime_Info } from './interfaces';
import { Anime_Streaming } from './interfaces';
import { Anime_Search_Results } from './interfaces';
import { Anime_Recent_Episodes } from './interfaces';

const api_url = 'https://api-consumet-git-main-dionvus-projects.vercel.app/anime/gogoanime/';

const Prompts = {
  search: 'Seach anime',
  anime: 'Pick an anime',
  episode: 'Pick an episode',
  quality: 'Select video quality',
  recent: 'Choose from recent episodes',
  error: chalk.red('ERR:')
};

/**
 * @brief Provides a list of recent shows to select from.
 *
 * @param page_num The page number of the recent anime list to browse.
 *
 * @returns The object of recent show information.
 */
export async function fetch_recent_anime_eps(page_num: number): Promise<Anime_Recent_Episodes> {

  try {
    const response = await axios.get(`${api_url}/recent-episodes`, { params: { page: page_num, type: 1 } });

    const recent_episodes: Anime_Recent_Episodes = response.data;

    return recent_episodes;
  }
  catch (error) {
    return Promise.reject(error);
  }
}

/**
 * @brief Provides search results from user input.
 *
 * @param name The input to search for results.
 *
 * @returns Object containing the search results, if results length of results != 0.
 */
export async function fetch_anime_search(name: string): Promise<Anime_Search_Results> {

  // User inputs bunch of spaces or nothing.
  if (!name || name.trim() === '')
    return Promise.reject(`${chalk.red('Empty Input')}`);

  try {
    const response = await axios.get(`${api_url}${name}`);

    const anime: Anime_Search_Results = response.data;

    if (anime.results.length === 0)
      return Promise.reject(`${chalk.red(`Search results not found for ${name}`)}`);

    return anime;
  }
  catch (error) {
    return Promise.reject(`${Prompts.error} Unable to fetch search results for ${name}`);
  }
}

/**
 * @brief Provides details about a show.
 *
 * @param id The ID of the specific anime fetched from search.
 * @returns Details about the provided anime.
 */
export async function fetch_anime_info(id: string) {

  try {
    const response = await axios.get(`${api_url}info/${id}`);
    const anime_details: Anime_Info = response.data;

    return anime_details;
  }
  catch (error) {
    return Promise.reject(`${Prompts.error} Unable to fetch anime details for ${id}!`);
  }
}

/**
 * @brief Fetches streaming urls for given episode id.
 *
 * @param id The episode id.
 * @returns Anime_Streaming object.
 */
export async function fetch_anime_url(id: string) {

  try {
    const response = await axios.get(`${api_url}watch/${id}?server=vidstreaming`);

    const anime_url: Anime_Streaming = response.data;

    return anime_url;
  }
  catch (error) {
    return Promise.reject(`${Prompts.error} Unable to fetch streaming url for ${id}!`);
  }
}
