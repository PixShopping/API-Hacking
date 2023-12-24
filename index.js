// BIBLIOTECAS
const express = require('express');
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs =  require('fs');
const { waitForDebugger } = require('inspector');

const port = process.env.PORT || 3000;
const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));


async function consultarDados(nome) {
    
    const browser = await puppeteer.launch({
        headless: true, // Torna o navegador visível usar FALSE
    });

    const page = await browser.newPage();

    await page.goto(`https://webmii.com/people?n="${nome}"#gsc.tab=0&gsc.q="${nome}"&gsc.sort=date`)

    await page.waitForSelector('#news');
    await page.waitForSelector('#web');

    await new Promise((resolve) => setTimeout(resolve, 5000));  

    // Extrair informações do NEWS
    const resultsNews = await page.evaluate(() => {
        const newsDiv = document.querySelector('#news');
        const resultDivs = newsDiv.querySelectorAll('.resultdate-box');

        const dataNews = [];

        resultDivs.forEach((resultDiv) => {
            const titulo = resultDiv.querySelector('.resultdate-title').innerText;
            const texto = resultDiv.querySelector('.resultdate-snippet').innerText;
            const dominio = resultDiv.querySelector('.resultdate-domainname').innerText;

            dataNews.push({
                titulo,
                texto,
                dominio,
            });
        });

        return dataNews;
    });

    await new Promise((resolve) => setTimeout(resolve, 5000));

    const resultsWeb = await page.evaluate(() => {
        const newsDiv = document.querySelector('#web');
        const resultDivs = newsDiv.querySelectorAll('.result-box');

        const dataWeb = [];

        resultDivs.forEach((resultDiv) => {
            const titulo = resultDiv.querySelector('.result-title').innerText;
            const texto = resultDiv.querySelector('.result-snippet').innerText;
            const dominio = resultDiv.querySelector('.result-domainname').innerText;

            dataWeb.push({
                titulo,
                texto,
                dominio,
            });
        });

        return dataWeb;
    });

    await browser.close();

    return {
      websites: resultsWeb,
      noticias: resultsNews,
    };

}


// ===== { ROTAS } =====

app.get('/consultar', (req, res) => {
  const nome = req.query.nome;
  
  // Verifica se o usuário e a senha foram fornecidos na URL
  if (!nome) {
    return res.status(400).json({ error: 'Usuário, Senha são obrigatórios.' });
  }

  // Chama a função para preencher o formulário e fazer login com os parâmetros recebidos
  consultarDados(nome)
    .then((data) => {
      return res.json(data);
    })
    .catch((error) => {
    console.error('Erro ao consultar dados', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    });
});

// Inicializa o servidor
app.listen(port, () => {
  console.log('Servidor está rodando na porta ' + port);
});