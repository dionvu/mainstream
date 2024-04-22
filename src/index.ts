#!/usr/bin/env node

import axios from 'axios';
import chalk from 'chalk';
import prompts, { Choice, PromptType } from 'prompts';
import { spawn } from 'child_process';
import { Command } from 'commander';
import { Anime_Info } from './interfaces';
import { Anime_Streaming } from './interfaces';
import { Anime_Search_Results } from './interfaces';
import { Anime_Recent_Episodes } from './interfaces';
import { LocalStorage } from 'node-localstorage';

const program = new Command();

const Prompts = {
  search: 'Seach anime',
  anime: 'Pick an anime',
  episode: 'Pick an episode',
  quality: 'Select video quality',
  recent: 'Choose from recent episodes',
  error: chalk.red('ERR:')
};

// Optionally replace this with your own api url.
const api_url = 'https://api-consumet-git-main-dionvus-projects.vercel.app/anime/gogoanime/';

const player = 'mpv';

const local_storage = new LocalStorage('./local_storage');

program
  .description('CLI to keep up with all the latest and greatest anime');
program
  .command('recent')
  .alias('r')
  .action(async () => {
    const recents = JSON.parse(local_storage.getItem('recent-anime') || '[]');

    for (let i = 0; i < Math.min(100, recents.length); i++)
      console.log(recents[i]);
  })
program
  .action(async () => {
    try {
      const input = await user_input(Input_Style.text, 'search_anime', Prompts.search);

      await watch_anime(input.search_anime);
    } catch (error) {
      console.error(error);
    }
  });
program
  .command('current')
  .alias('c')
  .arguments('page')
  .description('Select recent episodes.')
  .action(async (page: number) => {
    try {
      const recent_episodes = await fetch_recent_anime_eps(page);

      const selection: Choice[] = [];
      for (let i = 0; i < recent_episodes.results.length; i++)
        selection.push({ title: recent_episodes.results[i].id, value: recent_episodes.results[i].id });

      const input = await user_input(Input_Style.select, 'choice', Prompts.recent, selection, 0);

      await watch_recent_anime(input.choice);

    } catch (error) {
      console.error(error);
    }
  })
program.parse();

async function add_to_recent(id: string) {

  try {
    const recents = JSON.parse(local_storage.getItem('recent-anime') || '[]');

    recents.push(id);

    local_storage.setItem('recent-anime', JSON.stringify(recents));
  }
  catch (error) {
    return Promise.reject(error);
  }
}

async function fetch_recent_anime_eps(page_num: number) {

  try {
    const response = await axios.get(`${api_url}/recent-episodes`, { params: { page: page_num, type: 1 } });

    const recent_episodes: Anime_Recent_Episodes = response.data;

    return recent_episodes;
  }
  catch (error) {
    return Promise.reject(error);
  }
}

async function watch_recent_anime(id: string) {

  const anime: Anime_Info = await fetch_anime_info(id);

  const episode_selection = [];

  for (let i = 0; i < anime.episodes.length; i++)
    episode_selection.push({ title: `${anime.episodes[i].id}`, value: `${anime.episodes[i].id}` });

  const user_episode_selection = await user_input(Input_Style.select, 'choice', Prompts.episode, episode_selection);

  add_to_recent(user_episode_selection.choice);
  play_episode(user_episode_selection.choice);
}

/**
 * @brief Search, select anime, choose an episode, select quality and sit back relex.
 *
 * @param search_input User's input for searching.
 *
 * @returns Starts an mpv process or returns a warning.
 */
async function watch_anime(search_input: string) {

  try {
    const search_results: Anime_Search_Results = await fetch_anime_search(search_input);

    const search_selection = [];

    for (let i = 0; i < search_results.results.length; i++)
      search_selection.unshift({ title: `${search_results.results[i].id}`, value: `${search_results.results[i].id}` });

    const user_selection = await user_input(Input_Style.select, 'choice', Prompts.anime, search_selection);

    const anime: Anime_Info = await fetch_anime_info(user_selection.choice);

    const episode_selection = [];

    for (let i = 0; i < anime.episodes.length; i++)
      episode_selection.push({ title: `${anime.episodes[i].id}`, value: `${anime.episodes[i].id}` });

    const user_episode_selection = await user_input(Input_Style.select, 'choice', Prompts.episode, episode_selection);

    add_to_recent(user_episode_selection.choice);

    play_episode(user_episode_selection.choice);

  }
  catch (error) {
    return Promise.reject(`${Prompts.error} ${error}`);
  }
}

async function play_episode(episode_id: string) {

  const urls: Anime_Streaming = await fetch_anime_url(episode_id);

  const quality_selection = [];

  for (let i = 0; i < urls.sources.length; i++)
    quality_selection.push({ title: `${urls.sources[i].quality}`, value: `${urls.sources[i].quality}` });

  const user_quality_selection = await user_input(Input_Style.select, 'choice', Prompts.quality, quality_selection, 4);

  for (let i = 0; i < urls.sources.length; i++) {

    if (urls.sources[i].quality === user_quality_selection.choice) {
      spawn(player, [urls.sources[i].url], { detached: true, stdio: 'ignore' });
      break;
    }
  }
}

async function fetch_anime_search(name: string) {

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
 * @brief Fetches streaming urls for given episode id.
 *
 * @param id The episode id.
 * @returns Anime_Streaming object.
 */
async function fetch_anime_url(id: string) {

  try {
    const response = await axios.get(`${api_url}watch/${id}?server=vidstreaming`);

    const anime_url: Anime_Streaming = response.data;

    return anime_url;
  }
  catch (error) {
    return Promise.reject(`${Prompts.error} Unable to fetch streaming url for ${id}!`);
  }
}

/**
 * @brief Provides details about a show.
 *
 * @param id The ID of the specific anime fetched from search.
 * @returns Details about the provided anime.
 */
async function fetch_anime_info(id: string) {

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
 * Choices of user input.
 */
const enum Input_Style {

  text = 'text',
  select = 'select',
}

/**
 * @brief Prompts user input in given style through given selection.
 *
 * @param style The style of input.
 * @param msg The prompt message.
 * @param options The choices user has.
 * @param initial Initial selected position (only relevant for 'select' type).
 *
 * @returns User's input.
 */
async function user_input(style: Input_Style, name: string, msg: string, options: Choice[] = [], initial: number = 0) {

  const response = await prompts({
    type: style as PromptType,
    name: name,
    message: msg,
    choices: options,
    initial: initial,
  });

  return Promise.resolve(response);
}
