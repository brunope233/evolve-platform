import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';

@Controller() // Controller raiz
export class AppController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
  ) {}

  @Get('health') // Rota dedicada para o health check
  @HealthCheck()
  check() {
    // O teste de saúde agora verifica se a aplicação consegue se comunicar com o banco de dados
    return this.health.check([
      () => this.db.pingCheck('database'),
    ]);
  }
}