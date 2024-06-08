#!/usr/bin/env node

import { user_input, Input_Style, User_Prompts, ascii_art } from "./utils.js";

import { fetch_recent_anime_eps } from "./api.js";

import {
  watch_anime,
  watch_current_anime,
  watch_recent_anime,
} from "./anime.js";

import { Command } from "commander";
import { Choice } from "prompts";
import chalk from "chalk";
import path from "path";
import url from "url";
import fs from "fs";

const program_dir = path.dirname(url.fileURLToPath(import.meta.url));

const local_storage_path = path.join(program_dir, "local_storage");

if (!fs.existsSync(local_storage_path))
  fs.mkdirSync(local_storage_path, { recursive: true });

const program = new Command();

program.addHelpText("beforeAll", chalk.whiteBright(ascii_art));

program.description(
  `${chalk.bold(chalk.cyan("CLI to keep up with all the latest and greatest anime!"))}`,
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
        User_Prompts.recent,
        selection,
        0,
      );

      await watch_current_anime(input);
    } catch (error) {
      console.log(error);
    }
  });

program.action(async () => {
  try {
    const input = await user_input(Input_Style.text, User_Prompts.search);

    await watch_anime(input);
  } catch (error) {
    console.log(error);
  }
});

program.parse();
