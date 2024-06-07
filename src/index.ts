#!/usr/bin/env node

import chalk from "chalk";

import { User_Prompts } from "./utils.js";
import prompts, { Choice, PromptType } from "prompts";
import { Command } from "commander";
import path from "path";
import url from "url";

import { fetch_recent_anime_eps } from "./api.js";

import { watch_current_anime, watch_recent_anime } from "./anime.js";
import { watch_anime } from "./anime.js";

import fs from "fs";

const program_dir = path.dirname(url.fileURLToPath(import.meta.url));

const local_storage_path = path.join(program_dir, "local_storage");

if (!fs.existsSync(local_storage_path))
  fs.mkdirSync(local_storage_path, { recursive: true });

const program = new Command();

const ascii = `
⡆⣿⣿⣦⠹⣳⣳⣕⢅⠈⢗⢕⢕⢕⢕⢕⢈⢆⠟⠋⠉⠁⠉⠉⠁⠈⠼⢐⢕
⡗⢰⣶⣶⣦⣝⢝⢕⢕⠅⡆⢕⢕⢕⢕⢕⣴⠏⣠⡶⠛⡉⡉⡛⢶⣦⡀⠐⣕
⡝⡄⢻⢟⣿⣿⣷⣕⣕⣅⣿⣔⣕⣵⣵⣿⣿⢠⣿⢠⣮⡈⣌⠨⠅⠹⣷⡀⢱
⡝⡵⠟⠈⢀⣀⣀⡀⠉⢿⣿⣿⣿⣿⣿⣿⣿⣼⣿⢈⡋⠴⢿⡟⣡⡇⣿⡇⡀
⡝⠁⣠⣾⠟⡉⡉⡉⠻⣦⣻⣿⣿⣿⣿⣿⣿⣿⣿⣧⠸⣿⣦⣥⣿⡇⡿⣰⢗
⠁⢰⣿⡏⣴⣌⠈⣌⠡⠈⢻⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣬⣉⣉⣁⣄⢖⢕⢕
⡀⢻⣿⡇⢙⠁⠴⢿⡟⣡⡆⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣵⣵
⡻⣄⣻⣿⣌⠘⢿⣷⣥⣿⠇⣿⣿⣿⣿⣿⣿⠛⠻⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣷⢄⠻⣿⣟⠿⠦⠍⠉⣡⣾⣿⣿⣿⣿⣿⣿⢸⣿⣦⠙⣿⣿⣿⣿⣿⣿⣿⣿
⡕⡑⣑⣈⣻⢗⢟⢞⢝⣻⣿⣿⣿⣿⣿⣿⣿⠸⣿⠿⠃⣿⣿⣿⣿⣿⣿⡿⠁ 
`;

program.description(
  `${ascii}\n${chalk.cyan("CLI to keep up with all the latest and greatest anime!")}`,
);

program
  .command("recent")
  .alias("r")
  .description("Select recently watched shows.")
  .action(async () => {
    try {
      await watch_recent_anime();
    } catch (error) {
      console.log(error);
    }
  });

program
  .command("current")
  .alias("c")
  .arguments("page")
  .description("Select currently/recently streaming anime shows.")
  .action(async (page: number) => {
    try {
      const recent_episodes = await fetch_recent_anime_eps(page);

      const selection: Choice[] = [];
      for (let i = 0; i < recent_episodes.results.length; i++)
        selection.push({
          title: recent_episodes.results[i].id,
          value: recent_episodes.results[i].id,
        });

      const input = await user_input(
        Input_Style.autocomplete,
        "choice",
        User_Prompts.recent,
        selection,
        0,
      );

      await watch_current_anime(input.choice);
    } catch (error) {
      console.log(error);
    }
  });

program.action(async () => {
  try {
    const input = await user_input(
      Input_Style.text,
      "choice",
      User_Prompts.search,
    );

    await watch_anime(input.choice);
  } catch (error) {
    console.log(error);
  }
});

program.parse();

/**
 * Choices of user input.
 */
export const enum Input_Style {
  text = "text",
  select = "select",
  autocomplete = "autocomplete",
}

/**
 * @brief UserPrompts user input in given style through given selection.
 *
 * @param style The style of input.
 * @param msg The prompt message.
 * @param options The choices user has.
 * @param initial Initial selected position (only relevant for 'select' type).
 *
 * @returns User's input.
 */
export async function user_input(
  style: Input_Style,
  name: string,
  msg: string,
  options: Choice[] = [],
  initial: number = 0,
) {
  try {
    const response = await prompts({
      type: style as PromptType,
      name: name,
      message: msg,
      choices: options,
      initial: initial,
    });
    return response;
  } catch {
    return Promise.reject(`${User_Prompts.error} Invalid user input.`);
  }
}
