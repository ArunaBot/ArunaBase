<!-- [<img width="100%" src="https://raw.githubusercontent.com/ArunaBot/ArunaBase/main/.github/assets/mainBanner.png) -->
<p align="center">
<a href="https://www.npmjs.com/package/arunabase"><img src="https://img.shields.io/npm/v/arunabase.svg?style=for-the-badge&maxAge=3600"></a>
<a href="https://discord.gg/NqbBgEf" target="_blank"><img src="https://img.shields.io/discord/660610178009530380?color=5865F2&label=&logo=Discord&logoColor=white&style=for-the-badge"></a>
<a href=""><img src="https://img.shields.io/github/license/arunabot/arunabase?style=for-the-badge&color=0394fc&label=Licen%C3%A7a"></a>
</p>

#

<p align="center"><a href='https://github.com/arunabot/arunabase#readme'>📘 English Readme</a> | <span>📕 Readme em português</span></p>

#

<h2 align="center">📖 Sobre</h2>
&nbsp;&nbsp;&nbsp;&nbsp;A ArunaBase é uma base de código de API para bots do Discord, Twitch, e outras plataformas, feita em TypeScript, com o objetivo de facilitar a criação de bots, com uma estrutura simples e organizada, além de ser totalmente gratuita e de código aberto.

<br>

&nbsp;&nbsp;&nbsp;&nbsp;Com a ArunaBase criar um bot capaz de executar comandos, interagir com o usuário, em plataformas como o Discord e a Twitch, além de ter uma configuração simples e intuitiva, é muito fácil e rápido.

<br>

<h2 align="center">💻 Instalação</h2>
&nbsp;&nbsp;&nbsp;&nbsp;Para instalar a ArunaBase no seu projeto, você precisa ter o NodeJS instalado, e então executar o seguinte comando no seu terminal:

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

<h2 align="center">⌨ Exemplo de uso</h2>
&nbsp;&nbsp;&nbsp;&nbsp;Para usar a ArunaBase em seu projeto, você precisa importar uma das classes que ela exporta, e então criar uma instância da classe que você importou, passando como parâmetro um objeto com as configurações do seu bot.

<br>

<h2 align="center">🗨 Exemplo de uso com o Discord</h2>

<br>

```js
const { Discord } = require('arunabase');
// ou
import { Discord } from 'arunabase';

const client = new Discord.DiscordClient({
  botID: '<Id do bot>',
  intents: [
    Discord.Intents.Flags.MessageContent, // Opcional
    // ...
  ],
});

// use client.getCommandManager().generateCommand('Nome do comando', parâmetros do comando); para criar comandos.
// use client.getCommandManager().registerCommand(comando); para registrar o comando.

client.on('clientReady', () => {
  console.log('Bot pronto!');
});

client.login('<Token do bot>');
```

<br>

<h2 align="center">📄 Licença</h2>

<br>

&nbsp;&nbsp;&nbsp;&nbsp;A ArunaBase é distribuída sob a licença GNU. Veja [LICENSE](/LICENSE) para mais informações.

<br>

<h2 align="center">🤝 Contribuições</h2>

<br>

&nbsp;&nbsp;&nbsp;&nbsp;Contribuições são o que fazem a comunidade de código aberto um lugar incrível para aprender, inspirar e criar. Qualquer contribuição que você fizer será **muito apreciada**.

1. Faça um Fork do projeto
2. Crie sua Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a Branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

<br>

<h2 align="center">😉 Autores</h2>

<br>

<table align="center">
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

#

<p align="center">Feito com 💚 pela equipe da Aruna™.</p>

<p align="center">Todos os direitos reservados.</p>
