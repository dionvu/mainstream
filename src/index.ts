#!/usr/bin/env node

import { exec } from 'child_process';
import { Command } from 'commander';
import chalk from 'chalk';
import prompts from 'prompts';

import { AnimeUrl, Anime, AnimeSearch } from './interfaces';

const program = new Command();

const api_url = 'https://api-consumet-org-18mp.onrender.com/anime/gogoanime/';

const error_warning = chalk.red('ERROR:');

program
  .command('watch')
  .argument('<anime>')
  .alias('w')
  .action(async (anime: string) => {
    try {
      await fetch_anime_url(anime);
    }
    catch (error) {
      console.log(error);
    }
  })

program
  .command('search')
  .alias('s')
  .action(async () => {
    try {
      const prompt = "Search: ";

      const input = await user_input(prompt);

      await watch_anime(input.search_anime);
    } catch (error) {
      console.error(error);
    }
  });

program.parse();

async function watch_anime(name: string) {

  try {
    const search_results: AnimeSearch = await fetch_anime_search(name);

    const selection = [];
    for (let i = 0; i < Math.min(search_results.results.length, 20); i++)
      selection.push({ title: `${search_results.results[i].id}`, value: `${search_results.results[i].id}` });

    const user_selection = await prompts({
      type: 'select',
      name: 'choice',
      message: 'Pick an anime',
      choices: selection,
      initial: 1
    });

    const anime: Anime = await fetch_anime_episodes(user_selection.choice);

    const episode_selection = [];

    for (let i = 0; i < anime.episodes.length; i++)
      episode_selection.push({ title: `${anime.episodes[i].id}`, value: `${anime.episodes[i].id}` });

    const user_episode_selection = await prompts({
      type: 'select',
      name: 'choice',
      message: 'Pick an episode',
      choices: episode_selection,
      initial: 1
    });

    const urls: AnimeUrl = await fetch_anime_url(user_episode_selection.choice);

    const quality_selection = [];

    for (let i = 0; i < urls.sources.length; i++)
      quality_selection.push({ title: `${urls.sources[i].quality}`, value: `${urls.sources[i].quality}` });

    const user_quality_selection = await prompts({
      type: 'select',
      name: 'choice',
      message: 'Pick an episode',
      choices: quality_selection,
      initial: 1
    });

    for (let i = 0; i < urls.sources.length; i++) {
      if (urls.sources[i].quality === user_quality_selection.choice)
        exec(`mpv ${urls.sources[i].url}`);
    }
  }
  catch (error) {
    return Promise.reject(`${chalk.red('ERROR')}`);
  }
}

async function fetch_anime_search(name: string) {

  if (name.trim() === '')
    return Promise.reject(`${chalk.red('Empty Input')}`);

  try {
    const response = await fetch(`${api_url}${name}`);

    const anime: AnimeSearch = await response.json();

    if (anime.results.length === 0)
      return Promise.reject(`${chalk.red(`No Search results found for ${name}`)}`);

    return anime;
  }
  catch (error) {
    return Promise.reject(`${error_warning} Unable to fetch data for ${name}`);
  }
}

async function fetch_anime_url(id: string) {

  try {
    const response = await fetch(`${api_url}watch/${id}?server=vidstreaming`);

    if (!response.ok) return Promise.reject(`${error_warning} unable to fetch streaming url for id: ${id}`)

    const anime_url: AnimeUrl = await response.json();

    return anime_url;
  }
  catch (error) {
    return Promise.reject(`${error_warning} Unable to fetch streaming url for ${id}!`);
  }
}

async function user_input(msg: string) {
  const response = await prompts({
    type: 'text',
    name: 'search_anime',
    message: `${msg}`,
  });

  return Promise.resolve(response);
}

async function fetch_anime_episodes(id: string) {

  try {
    const response = await fetch(`${api_url}info/${id}`);

    if (!response.ok) return Promise.reject(`${error_warning} unable to fetch anime details for ${id}!`)

    const anime: Anime = await response.json();

    return anime;
  }
  catch (error) {
    return Promise.reject(`${error_warning} Unable to fetch anime details for ${id}!`);
  }
}
