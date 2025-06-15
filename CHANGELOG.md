# Changelog

## v1.0.0-ALPHA.13

- [REVERT]: Reverted ALPHA.12 changes;
  - Discord.js doesn't provide the `Role` type in the command context, only its ID;

## v1.0.0-ALPHA.12

- [FIX]: Fix argument type in command context;
  - Now you can receive the `Role` type in the command context;

## v1.0.0-ALPHA.11

- [FIX]: Fixed a rare crash related to slash commands;
  - The crash occurred when a slash command was executed while the bot was not ready;
  - This was caused by a delay in command registration that could happen after the bot had been offline for a while;

- [FIX]: Enabled `enforceNonce` to prevent duplicated messages;

- [FIX]: Fixed incorrect usage of `Math.max` in parameter validation;
  - The issue caused string parameters to always require 6000 characters;

## v1.0.0-ALPHA.10

- [BREAKING]: All methods related to guild commands have been removed;
  - This change shouldn't affect anyone, as guild commands haven't been implemented yet;
  - A new system for guild commands will be implemented in the future;

- [BREAKING]: The HTTP server was removed;
  - This change has introduced to simplify the codebase and make it more maintainable;
  - The HTTP server wasn't used in any of the examples and had no documentation, so its impact on users should be minimal;

- [DEPRECATED]: Some methods are now deprecated:
  - `CommandManager#generateAsyncCommand` is deprecated, use `CommandManager#generateCommand` instead;
  - `CommandManager#getGlobalCommand` is deprecated, use `CommandManager#getCommand` instead;
  - `CommandManager#hasGlobalCommand` is deprecated, use `CommandManager#hasCommand` instead;

- [CHORE]: Bump dependencies;

- [NOTE]: Support for Node v18+ has been restored;

## v1.0.0-ALPHA.9

- [NEW]: Allow the user to enable ephemeral responses when using "deferReply";

- [FIX]: Missing await causes crash sometimes;

- [CHORE]: Remove some unused configurations;

- [CHORE]: Bump dependencies;

## v1.0.0-ALPHA.8

- [NEW]: Added `deferReply` method in the command context;
  - This method allows you to defer the reply to the interaction, which is useful for long-running commands;
    - This method will send a "thinking" message to the user, indicating that the command is being processed;
    - If it's a legacy command, it will send a "typing" status instead;
  - The method takes an optional boolean parameter `ephemeral`, which defaults to `false`;
  - If `ephemeral` is set to `true`, the reply will be visible only to the user who invoked the command;
    - If it's a legacy command, it will not ping the user on reply;

## v1.0.0-ALPHA.7

- [NEW]: Added support for buttons in messages;
  - You can now add buttons to your messages using the `setButtons` method;
  - The method takes a `ButtonStructure` object as a parameter;

- [NEW]: Added support for custom prefixes (for legacy commands);
  - You can now set a custom prefix for your guild or user using the `registerCustomPrefix` method;
  - The method takes a `prefix` and `condition` as parameters;

- [CHORE]: Bump dependencies;

- [BREAKING]: Dropped support for node versions below v22;
  - The library now requires node v22 or higher;
