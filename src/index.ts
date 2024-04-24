#!/usr/bin/env node

import chalk from 'chalk';
import prompts, { Choice, PromptType } from 'prompts';
import path from 'path';
import url from 'url';
import { spawn } from 'child_process';
import { Anime_Info } from './interfaces';
import { Command } from 'commander';
import { Anime_Streaming } from './interfaces';
import { Anime_Search_Results } from './interfaces';
import { LocalStorage } from 'node-localstorage';

import { fetch_recent_anime_eps } from './api.js';
import { fetch_anime_url } from './api.js';
import { fetch_anime_info } from './api.js';
import { fetch_anime_search } from './api.js';

const program = new Command();

const Prompts = {
  search: 'Seach anime',
  anime: 'Pick an anime',
  episode: 'Pick an episode',
  quality: 'Select video quality',
  recent: 'Choose from recent episodes',
  error: chalk.red('ERR:')
};

import fs from 'fs';

const program_dir = path.dirname(url.fileURLToPath(import.meta.url));

const local_storage_path = path.join(program_dir, 'local_storage');

if (!fs.existsSync(local_storage_path))
  fs.mkdirSync(local_storage_path, { recursive: true });

const local_storage = new LocalStorage(local_storage_path);

program
  .description('CLI to keep up with all the latest and greatest anime');
program
  .command('recent')
  .alias('r')
  .action(async () => {
    const recents = JSON.parse(local_storage.getItem('recent-anime') || '[]');

    for (let i = 0; i < Math.min(100, recents.length); i++) {
      console.log(recents[i]);
    }
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

/**
 * @brief Spawns an instance of mpv and plays the episode from given episode id.
 *
 * @param episode_id The id of the episode to launch.
 */
async function play_episode(episode_id: string): Promise<void> {

  const player = 'mpv';

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
