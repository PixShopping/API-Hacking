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

// CONSULTAR CPF
async function consultarCpf(nome, estado, cidade) {
  const browser = await puppeteer.launch({
      headless: true, // Torna o navegador visível usar FALSE
  });

  const page = await browser.newPage();
  //await page.browserContext().overridePermissions('https://buscaprime.com.br', ['geolocation']);

  await page.goto(`https://buscaprime.com.br/buscar-dados-pelo-nome/consulta.php`);

  await new Promise((resolve) => setTimeout(resolve, 2500));

  // ABRIR FORMULARIO INTEIRO
  await page.evaluate(() => {
    // Encontre o elemento pelo ID e adicione a classe 'show'
    const element = document.getElementById('collapseOne7');
    if (element) {
      element.classList.add('show');
    }
  });
  
  await new Promise((resolve) => setTimeout(resolve, 1000));

  await page.waitForSelector('input[name="searchTerms[name]"]');
  await page.type('input[name="searchTerms[name]"]', nome);

  await page.waitForSelector('select[name="searchTerms[state]"]');
  await page.select('select[name="searchTerms[state]"]', estado);

  await page.waitForSelector('input[name="searchTerms[city]"]');
  await page.type('input[name="searchTerms[city]"]', cidade);
  
  await page.evaluate(() => {
    const botao = document.querySelector('button[type="submit"]'); // Substitua pelo ID correto do botão
    if (botao) {
      botao.click();
    }
  });

  await new Promise((resolve) => setTimeout(resolve, 2000));
  
  return {
    nome: nome,
    estado: estado,
    cidade: cidade,
  };

  //await browser.close();

}


// ===== { ROTAS } =====

app.get('/consultar', (req, res) => {
  const nome = req.query.nome;
  
  // Verifica se o usuário e a senha foram fornecidos na URL
  if (!nome) {
    return res.status(400).json({ error: 'Nome é obrigatório.' });
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

app.get('/cpf', (req, res) => {
  const nome = req.query.nome;
  const estado = req.query.estado;
  const cidade = req.query.cidade;
  
  // Verifica se o usuário e a senha foram fornecidos na URL
  if (!nome || !estado || !cidade) {
    return res.status(400).json({ error: 'Nome, Estado e Cidade são obrigatórios.' });
  }

  // Chama a função para preencher o formulário e fazer login com os parâmetros recebidos
  consultarCpf(nome, estado, cidade)
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