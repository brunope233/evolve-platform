import { HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';
export declare class AppController {
    private health;
    private db;
    constructor(health: HealthCheckService, db: TypeOrmHealthIndicator);
    check(): Promise<import("@nestjs/terminus").HealthCheckResult>;
}
