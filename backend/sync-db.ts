import { DataSource } from 'typeorm';

// COLOQUE SUA SENHA DO USUÁRIO 'postgres' DO CLOUD SQL DIRETAMENTE AQUI, ENTRE AS ASPAS
const CLOUD_SQL_PASSWORD = 'Rg9""2Kza)7AzD;g';

const AppDataSource = new DataSource({
    type: 'postgres',
    host: '127.0.0.1', // Endereço do Cloud SQL Proxy
    port: 5433,
    username: 'postgres',
    password: CLOUD_SQL_PASSWORD,
    database: 'evolve-db',
    // Usa __dirname para garantir que ele encontre as entidades a partir da localização do script
    entities: [__dirname + '/src/**/*.entity{.ts,.js}'],
    synchronize: true, // A mágica que atualiza o esquema do banco de dados
    ssl: false
});

console.log("Iniciando sincronização com o banco de dados...");

AppDataSource.initialize()
    .then(() => {
        console.log("✅ Conectado ao banco de dados e sincronizando tabelas...");
        // O synchronize: true faz o trabalho na inicialização.
        // Esperamos um pouco para garantir que a operação termine antes de fechar.
        setTimeout(() => {
            AppDataSource.destroy();
            console.log("✅ Tabelas sincronizadas com sucesso. Processo finalizado.");
        }, 5000); // Espera 5 segundos
    })
    .catch((error) => {
        console.error("❌ Erro durante a sincronização:", error.message);
        process.exit(1); // Encerra o processo com erro
    });