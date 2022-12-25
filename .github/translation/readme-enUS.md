<!-- [<img width="100%" src="/.github/assets/mainBanner.png">](https://github.com/arunaBot/arunaBase) -->
<p align="center">
<a href="https://www.npmjs.com/package/arunabase"><img src="https://img.shields.io/npm/v/arunabase.svg?style=for-the-badge&maxAge=3600"></a>
<a href="https://discord.gg/NqbBgEf" target="_blank"><img src="https://img.shields.io/discord/660610178009530380?color=5865F2&label=&logo=Discord&logoColor=white&style=for-the-badge"></a>
<a href=""><img src="https://img.shields.io/github/license/arunabot/arunabase?style=for-the-badge&color=0394fc"></a>
</p>

#

<p align="center"><span>📘 English Readme</span> | <a href="https://github.com/arunabot/arunabase#readme">📕 Readme em português</a></p>

#

<p align="center"><h2>📖 About</h2></p>
&nbsp;&nbsp;&nbsp;&nbsp;The ArunaBase is a API code base for Discord, Twitch, and other platforms bots, made in TypeScript, with the objective of making ease the bot creation, with a simple and organized structure, other than being completely free and open source.

<br>

&nbsp;&nbsp;&nbsp;&nbsp;With ArunaBase create a bot capable of running commands, interact with the user, in platforms like Discord and Twitch, other than having a simple and intuitive configuration, its very fast and ease.

<br>

<p align="center"><h2>💻 Installing</h2></p>
&nbsp;&nbsp;&nbsp;&nbsp;To install ArunaBase in your project, you need first to have NodeJS installed, then run the following command in your terminal:

<br>

### NPM:
```
npm install arunabase
```

<br>

### Yarn:
```
yarn add arunabase
```

<br>

<p align="center"><h2>⌨ Use example</h2></p>
&nbsp;&nbsp;&nbsp;&nbsp;To use ArunaBase in your project, you need to import one of the classes that it exports, then create an instance of that class, passing as parameter your bot configurations as an object.

<br>

<p align="center"><h2>🗨 Use example with Discord</h2></p>

<br>

```js
const { Discord } = require('arunabase');
// or
import { Discord } from 'arunabase';

const client = new Discord.DiscordClient({
  botID: '<Bot Id>',
  intents: [
    Discord.Intents.Flags.MessageContent, // Optional
    // ...
  ],
});

// use client.getCommandManager().generateCommand('Command name', Command parameters); to create a command.
// use client.getCommandManager().registerCommand(command); to register that command.

client.on('ready', () => {
  console.log('Bot is ready!');
});

client.login('<Bot token>');
```

<br>

<p align="center"><h2>📄 License</h2></p>

<br>

&nbsp;&nbsp;&nbsp;&nbsp;The ArunaBase is distributed with the GNU license. See [LICENSE](/LICENSE) for more details.

<br>

<p align="center"><h2>🤝 Contributing</h2></p>

<br>

&nbsp;&nbsp;&nbsp;&nbsp;Contributions is what makes the open source community an amazing place and its a wonderful place to learn, inspire and create. Any contribution you make will be **very much appreciated**.

1. Make a Fork of the Project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<br>

<p align="center"><h2>😉 Authors</h2></p>

<br>

<p align="center">
<table>
  <tr>
    <td align="center">
      <a href="https://github.com/LoboMetalurgico">
        <img src="https://avatars.githubusercontent.com/u/43734867?v=4" width="100px;" alt=""/>
        <br />
        <sub>
          <b>LoboMetalurgico</b>
        </sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/emanuelfranklyn">
        <img src="https://avatars.githubusercontent.com/u/44732812?v=4" width="100px;" alt=""/>
        <br />
        <sub>
          <b>SpaceFox</b>
        </sub>
      </a>
    </td>
  </tr>
</table>
</p>

#

<p align="center">Made with 💚 By Aruna™'s team.</p>
<br>
<p align="center">All Reserved Rights.</p>
