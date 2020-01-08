const collections = require("./collections.js");
const logger = require("./logger.js");
const fs = require("fs");
const template = `# <img src="https://raw.githubusercontent.com/TheEssem/esmBot/master/esmbot.png" width="64"> esmBot${process.env.NODE_ENV === "development" ? " Dev" : ""} Command List
${process.env.NODE_ENV === "development" ? "\n**You are currently using esmBot Dev! Things may change at any time without warning and there will be bugs. Many bugs. If you find one, [report it here](https://github.com/TheEssem/esmBot/issues) or in the esmBot Support server.**\n" : ""}
\`[]\` means an argument is required, \`{}\` means an argument is optional.

Default prefix is \`&\`.

> Tip: You can get more info about a command by using \`help [command]\`.

## Table of Contents
+ [**General**](#💻-general)
+ [**Moderation**](#🔨-moderation)
+ [**Tags**](#🏷️-tags)
+ [**Fun**](#👌-fun)
+ [**Image Editing**](#🖼️-image-editing)
+ [**Soundboard**](#🔊-soundboard)
`;

module.exports = async (output) => {
  const commands = Array.from(collections.commands.keys());
  const categories = {
    general: ["## 💻 General"],
    moderation: ["## 🔨 Moderation"],
    tags: ["## 🏷️ Tags"],
    fun: ["## 👌 Fun"],
    images: ["## 🖼️ Image Editing", "> These commands support the PNG, JPEG, WEBP, and GIF formats. (GIF support is currently experimental)"],
    soundboard: ["## 🔊 Soundboard"]
  };
  for (const command of commands) {
    const category = collections.info.get(command).category;
    const description = collections.info.get(command).description;
    const params = collections.info.get(command).params;
    if (category === 1) {
      categories.general.push(`+ **${command}**${params ? ` ${params}` : ""} - ${description}`);
    } else if (category === 2) {
      categories.moderation.push(`+ **${command}**${params ? ` ${params}` : ""} - ${description}`);
    } else if (category === 3) {
      const subCommands = Array.from(Object.keys(description));
      for (const subCommand of subCommands) {
        categories.tags.push(`+ **tags${subCommand !== "default" ? ` ${subCommand}` : ""}**${params[subCommand] ? ` ${params[subCommand]}` : ""} - ${description[subCommand]}`);
      }
    } else if (category === 4) {
      categories.fun.push(`+ **${command}**${params ? ` ${params}` : ""} - ${description}`);
    } else if (category === 5) {
      categories.images.push(`+ **${command}**${params ? ` ${params}` : ""} - ${description}`);
    } else if (category === 6) {
      categories.soundboard.push(`+ **${command}**${params ? ` ${params}` : ""} - ${description}`);
    }
  }
  fs.writeFile(output, `${template}\n${categories.general.join("\n")}\n\n${categories.moderation.join("\n")}\n\n${categories.tags.join("\n")}\n\n${categories.fun.join("\n")}\n\n${categories.images.join("\n")}\n\n${categories.soundboard.join("\n")}`, () => {
    logger.log("The help docs have been generated.");
  });
};