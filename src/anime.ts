#!/usr/bin/env node

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

import { user_input, User_Prompts, Input_Style, user_error } from "./utils.js";

import { LocalStorage } from "node-localstorage";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import os from "os";

const home_dir = os.homedir();
const local_storage_path = path.join(home_dir, ".mainstream");
const local_storage = new LocalStorage(local_storage_path);

if (!fs.existsSync(local_storage_path))
  fs.mkdirSync(local_storage_path, { recursive: true });

/**
 * @brief Browse recently played shows and plays selection.
 */
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

    const anime: Anime_Info = recents[user_anime_choice_index];

    const episode_selection = get_episode_selection(anime);

    const user_episode_choice = await user_input(
      Input_Style.select,
      User_Prompts.episode,
      episode_selection,
    );

    add_to_recent(anime);

    play_episode(user_episode_choice);
  } catch (error) {
    return Promise.reject(`${user_error} Failed to list recent anime.`);
  }
}

/**
 * @brief Browses recent/current shows and plays selection.
 * @param id The id of the anime.
 */
export async function watch_current_anime(id: string) {
  try {
    const anime: Anime_Info = await fetch_anime_info(id);

    const episode_selection = get_episode_selection(anime);

    const user_episode_selection = await user_input(
      Input_Style.select,
      User_Prompts.episode,
      episode_selection,
    );

    add_to_recent(anime);

    play_episode(user_episode_selection);
  } catch (error) {
    return Promise.reject(`${user_error}`);
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

    const episode_selection = get_episode_selection(anime);

    const user_episode_selection = await user_input(
      Input_Style.select,
      User_Prompts.episode,
      episode_selection,
    );

    add_to_recent(anime);

    play_episode(user_episode_selection);
  } catch (error) {
    return Promise.reject(
      `${user_error} Failed to fetch search info for ${search_input}.`,
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

function get_episode_selection(
  anime: Anime_Info,
): { title: string; value: string }[] {
  const episode_selection = [];

  for (let i = 0; i < anime.episodes.length; i++)
    episode_selection.push({
      title: `${anime.episodes[i].id}`,
      value: `${anime.episodes[i].id}`,
    });

  return episode_selection;
}

/**
 * @brief Adds an anime to recents or bumps it's position to the front if
 * there is already an entry.
 * @param anime The Anime_Info object.
 */
async function add_to_recent(anime: Anime_Info) {
  try {
    let recents: Anime_Info[] = await JSON.parse(
      local_storage.getItem("recent-anime.json") || "[]",
    );

    recents = recents.filter((ani) => ani != anime);

    for (let i = recents.length - 1; i >= 0; i--) {
      if (recents[i].title == anime.title) {
        recents.splice(i, 1);
      }
    }

    recents.unshift(anime);

    local_storage.setItem("recent-anime.json", JSON.stringify(recents));
  } catch (error) {
    return Promise.reject(
      `${user_error} Unable to add ${anime.title} to recents watch list.`,
    );
  }
}
