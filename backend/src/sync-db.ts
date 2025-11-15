import { DataSource } from 'typeorm';

// COLOQUE SUA SENHA DO CLOUD SQL DIRETAMENTE AQUI, ENTRE AS ASPAS
const CLOUD_SQL_PASSWORD = 'Rg9""2Kza)7AzD;g';

const AppDataSource = new DataSource({
    type: 'postgres',
    host: '127.0.0.1',
    port: 5432,
    username: 'postgres',
    password: CLOUD_SQL_PASSWORD,
    database: 'evolve-db',
    entities: [__dirname + '/src/**/*.entity{.ts,.js}'],
    synchronize: true,
    ssl: false
});

AppDataSource.initialize()
    .then(() => {
        console.log("✅ Conectado ao banco de dados e sincronizando tabelas...");
        AppDataSource.destroy();
        console.log("✅ Tabelas sincronizadas com sucesso. Processo finalizado.");
    })
    .catch((error) => {
        console.error("❌ Erro durante a sincronização:", error.message);
        process.exit(1); // Encerra o processo com erro
    });