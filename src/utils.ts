import prompts, { Choice, PromptType } from "prompts";
import chalk from "chalk";

/**
 * Choices of prompts used for user_input.
 */
export const enum User_Prompts {
  search = "Seach for an anime",
  anime = "Select an anime",
  episode = "Select an episode",
  quality = "Select video quality",
  recent = "Choose from recent episodes",
}

/**
 * Main Error msg.
 */
export const user_error = chalk.red("ERR:");

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
  msg: string,
  options: Choice[] = [],
  initial: number = 0,
) {
  try {
    const response = await prompts({
      type: style as PromptType,
      name: "choice",
      message: msg,
      choices: options,
      initial: initial,
    });
    return response.choice;
  } catch {
    return Promise.reject(`${user_error} Invalid user input.`);
  }
}

/**
 * @brief Kawaii
 */
export const ascii_art = `
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
