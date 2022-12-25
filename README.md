[<img width="100%" src="/.github/assets/mainBanner.png">](https://github.com/arunaBot/arunaBase)
<center>
<a href="https://www.npmjs.com/package/arunabase"><img src="https://img.shields.io/npm/v/arunabase.svg?style=for-the-badge&maxAge=3600"></a>
<a href="https://discord.gg/NqbBgEf" target="_blank"><img src="https://img.shields.io/discord/660610178009530380?color=5865F2&label=&logo=Discord&logoColor=white&style=for-the-badge"></a>
<a href=""><img src="https://img.shields.io/github/license/arunabot/arunabase?style=for-the-badge&color=0394fc&label=Licen%C3%A7a"></a>
</center>

#

<center><a href='https://github.com/arunabot/arunabase/.github/assets/translation/readme-enUS.md'>📘 English Readme</a> | <span>📕 Readme em português</span></center>

#

<center><h2>📖 Sobre</h2></center>
&nbsp;&nbsp;&nbsp;&nbsp;A ArunaBase é uma base de código de API para bots do Discord, Twitch, e outras plataformas, feita em TypeScript, com o objetivo de facilitar a criação de bots, com uma estrutura simples e organizada, além de ser totalmente gratuita e de código aberto.

<br>

&nbsp;&nbsp;&nbsp;&nbsp;Com a ArunaBase criar um bot capaz de executar comandos, interagir com o usuário, em plataformas como o Discord e a Twitch, além de ter uma configuração simples e intuitiva, é muito fácil e rápido.

<br>

<center><h2>💻 Instalação</h2></center>
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

<center><h2>⌨ Exemplo de uso</h2></center>
&nbsp;&nbsp;&nbsp;&nbsp;Para usar a ArunaBase em seu projeto, você precisa importar uma das classes que ela exporta, e então criar uma instância da classe que você importou, passando como parâmetro um objeto com as configurações do seu bot.

<br>

<center><h2>🗨 Exemplo de uso com o Discord</h2></center>

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

client.on('ready', () => {
  console.log('Bot pronto!');
});

client.login('<Token do bot>');
```

<br>

<center><h2>📄 Licença</h2></center>

<br>

&nbsp;&nbsp;&nbsp;&nbsp;A ArunaBase é distribuída sob a licença GNU. Veja [LICENSE](/LICENSE) para mais informações.

<br>

<center><h2>🤝 Contribuições</h2></center>

<br>

&nbsp;&nbsp;&nbsp;&nbsp;Contribuições são o que fazem a comunidade de código aberto um lugar incrível para aprender, inspirar e criar. Qualquer contribuição que você fizer será **muito apreciada**.

1. Faça um Fork do projeto
2. Crie sua Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a Branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

<br>

<center><h2>😉 Autores</h2></center>

<br>

<center>
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
</center>

#

<center>Feito com 💚 pela equipe da Aruna™.</center>
<center>Todos os direitos reservados.</center>
