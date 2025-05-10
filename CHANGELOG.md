# Changelog

## v1.0.0-ALPHA.10
- [BREAKING]: All guild commands related methods have been removed;
  - This change should not affect anyone, since the guild commands weren't yet implemented;
  - A new system for guild commands will be implemented in the future;

- [BREAKING]: The HTTP server was removed;
  - This change has introduced to simplify the codebase and make it more maintainable;
  - The HTTP server wasn't used in any of the examples, it's impact should be minimal for the users;
  - If you need a HTTP server, you may use the `express` package yourself;

- [DEPRECATED]: Some methods are now deprecated:
  - `CommandManager#generateAsyncCommand` is deprecated, use `CommandManager#generateCommand` instead;
  - `CommandManager#getGlobalCommands` is deprecated, use `CommandManager#getGlobalCommands` instead;
  - `CommandManager#getGlobalCommand` is deprecated, use `CommandManager#getCommand` instead;
  - `CommandManager#hasGlobalCommand` is deprecated, use `CommandManager#hasCommand` instead;

- [CHORE]: Bump dependencies;

- [NOTE]: Support for node v18+ has been restored;
  - The library now supports node v18+ again;

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
