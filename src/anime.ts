#!/usr/bin/env node

import { User_Prompts } from "./utils.js";

import {
  Anime_Streaming,
  Anime_Info,
  Anime_Search_Results,
} from "./interfaces.js";

import {
  fetch_anime_url,
  fetch_anime_search,
  fetch_anime_info,
} from "./api.js";

import { user_input, Input_Style } from "./utils.js";

import { LocalStorage } from "node-localstorage";
import { spawn } from "child_process";
import url from "url";
import path from "path";
import fs from "fs";

const program_dir = path.dirname(url.fileURLToPath(import.meta.url));

const local_storage_path = path.join(program_dir, "local_storage");

if (!fs.existsSync(local_storage_path))
  fs.mkdirSync(local_storage_path, { recursive: true });

const local_storage = new LocalStorage(local_storage_path);

export async function watch_recent_anime() {
  try {
    const recents: Anime_Info[] = await JSON.parse(
      local_storage.getItem("recent-anime.json") || "[]",
    );

    const anime_selection = [];

    for (let i = 0; i < recents.length; i++)
      anime_selection.push({
        title: `${recents[i].title}`,
        value: `${i}`,
      });

    const user_anime_choice_index = await user_input(
      Input_Style.select,
      User_Prompts.anime,
      anime_selection,
    );

    const anime: Anime_Info = recents[user_anime_choice_index.choice];

    const episode_selection = [];

    for (let i = 0; i < anime.episodes.length; i++)
      episode_selection.push({
        title: `${anime.episodes[i].id}`,
        value: `${anime.episodes[i].id}`,
      });

    const user_episode_choice = await user_input(
      Input_Style.select,
      User_Prompts.anime,
      episode_selection,
    );

    add_to_recent(anime);
    play_episode(user_episode_choice.choice);
  } catch (error) {
    return Promise.reject(
      `${User_Prompts.error} Failed to watch recent anime.`,
    );
  }
}

export async function watch_current_anime(id: string) {
  try {
    const anime: Anime_Info = await fetch_anime_info(id);

    const episode_selection = [];

    for (let i = 0; i < anime.episodes.length; i++)
      episode_selection.push({
        title: `${anime.episodes[i].id}`,
        value: `${anime.episodes[i].id}`,
      });

    const user_episode_selection = await user_input(
      Input_Style.select,
      User_Prompts.episode,
      episode_selection,
    );

    add_to_recent(anime);
    play_episode(user_episode_selection.choice);
  } catch (error) {
    return Promise.reject(`${User_Prompts.error}`);
  }
}

/**
 * @brief Search, select anime, choose an episode, select quality and sit back relex.
 *
 * @param search_input User's input for searching.
 *
 * @returns Starts an mpv process or returns a warning.
 */
export async function watch_anime(search_input: string) {
  try {
    const search_results: Anime_Search_Results =
      await fetch_anime_search(search_input);

    const search_selection = [];

    for (let i = 0; i < search_results.results.length; i++)
      search_selection.unshift({
        title: `${search_results.results[i].id}`,
        value: `${search_results.results[i].id}`,
      });

    const user_selection = await user_input(
      Input_Style.select,
      User_Prompts.anime,
      search_selection,
    );

    const anime: Anime_Info = await fetch_anime_info(user_selection);

    const episode_selection = [];

    for (let i = 0; i < anime.episodes.length; i++)
      episode_selection.push({
        title: `${anime.episodes[i].id}`,
        value: `${anime.episodes[i].id}`,
      });

    const user_episode_selection = await user_input(
      Input_Style.select,
      User_Prompts.episode,
      episode_selection,
    );

    add_to_recent(anime);

    play_episode(user_episode_selection.choice);
  } catch (error) {
    return Promise.reject(
      `${User_Prompts.error} Failed to fetch search info for ${search_input}.`,
    );
  }
}

/**
 * @brief Spawns an instance of mpv and plays the episode from given episode id.
 *
 * @param episode_id The id of the episode to launch.
 */
async function play_episode(episode_id: string) {
  try {
    const player = "mpv";

    const urls: Anime_Streaming = await fetch_anime_url(episode_id);

    const quality_selection = [];

    for (let i = 0; i < urls.sources.length; i++)
      quality_selection.push({
        title: `${urls.sources[i].quality}`,
        value: `${urls.sources[i].quality}`,
      });

    const user_quality_selection = await user_input(
      Input_Style.select,
      User_Prompts.quality,
      quality_selection,
      4,
    );

    for (let i = 0; i < urls.sources.length; i++) {
      if (urls.sources[i].quality === user_quality_selection) {
        spawn(player, [urls.sources[i].url], {
          detached: true,
          stdio: "ignore",
        });
        break;
      }
    }
  } catch (error) {
    return error;
  }
}

async function add_to_recent(anime: Anime_Info) {
  try {
    let recents: Anime_Info[] = await JSON.parse(
      local_storage.getItem("recent-anime.json") || "[]",
    );

    recents = recents.filter((ani) => ani !== anime);

    recents.unshift(anime);

    local_storage.setItem("recent-anime.json", JSON.stringify(recents));
  } catch (error) {
    return Promise.reject(
      `${User_Prompts.error} Unable to add ${anime.title} to recents watch list.`,
    );
  }
}
