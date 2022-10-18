// não altere!
const serialport = require('serialport');
const express = require('express');
const mysql = require('mysql2');
const sql = require('mssql');

// não altere!
const SERIAL_BAUD_RATE = 9600;
const SERVIDOR_PORTA = 3300;

// configure a linha abaixo caso queira que os dados capturados sejam inseridos no banco de dados.
// false -> nao insere
// true -> insere
const HABILITAR_OPERACAO_INSERIR = true;

// altere o valor da variável AMBIENTE para o valor desejado:
// API conectada ao banco de dados remoto, SQL Server -> 'producao'
// API conectada ao banco de dados local, MySQL Workbench - 'desenvolvimento'
const AMBIENTE = 'desenvolvimento';

const serial = async (
        valoresumidade,
        valorestemperatura,
        valoresumidade1,
        valorestemperatura1,
        valoresumidade2,
        valorestemperatura2,
        valoresumidade3,
        valorestemperatura3,
        valoresumidade4,
        valorestemperatura4
) => {
    let poolBancoDados = ''

    if (AMBIENTE == 'desenvolvimento') {
        poolBancoDados = mysql.createPool(
            {
                // altere!
                // CREDENCIAIS DO BANCO LOCAL - MYSQL WORKBENCH
                host: 'localhost',
                user: 'insertGrupo5',
                password: 'sptech',
                database: 'techfarm'
            }
        ).promise();
    } else if (AMBIENTE == 'producao') {
        console.log('Projeto rodando inserindo dados em nuvem. Configure as credenciais abaixo.');
    } else {
        throw new Error('Ambiente não configurado. Verifique o arquivo "main.js" e tente novamente.');
    }


    const portas = await serialport.SerialPort.list();
    const portaArduino = portas.find((porta) => porta.vendorId == 2341 && porta.productId == 43);
    if (!portaArduino) {
        throw new Error('O arduino não foi encontrado em nenhuma porta serial');
    }
    const arduino = new serialport.SerialPort(
        {
            path: portaArduino.path,
            baudRate: SERIAL_BAUD_RATE
        }
    );
    arduino.on('open', () => {
        console.log(`A leitura do arduino foi iniciada na porta ${portaArduino.path} utilizando Baud Rate de ${SERIAL_BAUD_RATE}`);
    });
    arduino.pipe(new serialport.ReadlineParser({ delimiter: '\r\n' })).on('data', async (data) => {
        //console.log(data);
        const valores = data.split(';');
        const umidade = parseFloat(valores[0]);
        const temperatura = parseFloat(valores[1]);
        const umidade1 = parseFloat(valores[2]);
        const temperatura1 = parseFloat(valores[3]);
        const umidade2 = parseInt(valores[4]);
        const temperatura2 = parseInt(valores[5]);
        const umidade3 = parseInt(valores[6]);
        const temperatura3 = parseInt(valores[7]);
        const umidade4 = parseInt(valores[8]);
        const temperatura4 = parseInt(valores[9]);
        
        valoresumidade.push(umidadeProjeto);
        valorestemperatura.push(temperaturaProjeto);
        valoresumidade1.push(umidadeProjeto1);
        valorestemperatura1.push(temperaturaProjeto1);
        valoresumidade2.push(umidadeProjeto2);
        valorestemperatura2.push(temperaturaProjeto2);
        valoresumidade3.push(umidadeProjeto3);
        valorestemperatura3.push(temperaturaProjeto3);
        valoresumidade4.push(umidadeProjeto4);
        valorestemperatura4.push(temperaturaProjeto4);


        if (HABILITAR_OPERACAO_INSERIR) {
            if (AMBIENTE == 'producao') {
                // altere!
                // Este insert irá inserir os dados na tabela "medida"
                // -> altere nome da tabela e colunas se necessário
                // Este insert irá inserir dados de fk_aquario id=1 (fixo no comando do insert abaixo)
                // >> Importante! você deve ter o aquario de id 1 cadastrado.
                sqlquery = `INSERT INTO logsensor (temperatura1, temperatura2, temperatura3, temperatura4, temperatura5, umidade1, umidade2, umidade3, umidade4, umidade5) VALUES (${umidade}, ${temperatura}, ${luminosidade}, ${lm35Temperatura}, ${chave}, CURRENT_TIMESTAMP, 1)`;

                // CREDENCIAIS DO BANCO REMOTO - SQL SERVER
                // Importante! você deve ter criado o usuário abaixo com os comandos presentes no arquivo
                // "script-criacao-usuario-sqlserver.sql", presente neste diretório.
                const connStr = "Server=servidor-acquatec.database.windows.net;Database=bd-acquatec;User Id=usuarioParaAPIArduino_datawriter;Password=#Gf_senhaParaAPI;";

                function inserirComando(conn, sqlquery) {
                    conn.query(sqlquery);
                    console.log("valores inseridos no banco: ", dht11Umidade + ", " + dht11Temperatura + ", " + luminosidade + ", " + lm35Temperatura + ", " + chave)
                }

                sql.connect(connStr)
                    .then(conn => inserirComando(conn, sqlquery))
                    .catch(err => console.log("erro! " + err));

            } else if (AMBIENTE == 'desenvolvimento') {

                // altere!
                // Este insert irá inserir os dados na tabela "medida"
                // -> altere nome da tabela e colunas se necessário
                // Este insert irá inserir dados de fk_aquario id=1 (fixo no comando do insert abaixo)
                // >> você deve ter o aquario de id 1 cadastrado.
                await poolBancoDados.execute(
                    'INSERT INTO logsensor (temperatura1, temperatura2, temperatura3, temperatura4, temperatura5, umidade1, umidade2, umidade3, umidade4, umidade5) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [temperatura, temperatura1, temperatura2, temperatura3, temperatura4, umidade, umidade1, umidade2, umidade3, umidade4]
                );
                console.log("valores inseridos no banco: ", dht11Umidade + ", " + dht11Temperatura + ", " + luminosidade + ", " + lm35Temperatura + ", " + chave)

            } else {
                throw new Error('Ambiente não configurado. Verifique o arquivo "main.js" e tente novamente.');
            }
        }
    });
    arduino.on('error', (mensagem) => {
        console.error(`Erro no arduino (Mensagem: ${mensagem}`)
    });
}


// não altere!
const servidor = (
    valoresDht11Umidade,
    valoresDht11Temperatura,
    valoresLuminosidade,
    valoresLm35Temperatura,
    valoresChave
) => {
    const app = express();
    app.use((request, response, next) => {
        response.header('Access-Control-Allow-Origin', '*');
        response.header('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept');
        next();
    });
    app.listen(SERVIDOR_PORTA, () => {
        console.log(`API executada com sucesso na porta ${SERVIDOR_PORTA}`);
    });
    app.get('/sensores/dht11/umidade', (_, response) => {
        return response.json(valoresDht11Umidade);
    });
    app.get('/sensores/dht11/temperatura', (_, response) => {
        return response.json(valoresDht11Temperatura);
    });
    app.get('/sensores/luminosidade', (_, response) => {
        return response.json(valoresLuminosidade);
    });
    app.get('/sensores/lm35/temperatura', (_, response) => {
        return response.json(valoresLm35Temperatura);
    });
    app.get('/sensores/chave', (_, response) => {
        return response.json(valoresChave);
    });
}

(async () => {
    const valoresumidade = [];
    const valorestemperatura = [];
    const valoresumidade1 = [];
    const valorestemperatura1 = [];
    const valoresumidade2 = [];
    const valorestemperatura2 = [];
    const valoresumidade3 = [];
    const valorestemperatura3 = [];
    const valoresumidade4 = [];
    const valorestemperatura4 = [];
    await serial(
        valoresumidade,
        valorestemperatura,
        valoresumidade1,
        valorestemperatura1,
        valoresumidade2,
        valorestemperatura2,
        valoresumidade3,
        valorestemperatura3,
        valoresumidade4,
        valorestemperatura4
    );
    servidor(
        valoresumidade,
        valorestemperatura,
        valoresumidade1,
        valorestemperatura1,
        valoresumidade2,
        valorestemperatura2,
        valoresumidade3,
        valorestemperatura3,
        valoresumidade4,
        valorestemperatura4
    );
})();
