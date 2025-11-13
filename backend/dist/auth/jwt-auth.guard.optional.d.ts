declare const JwtAuthGuardOptional_base: import("@nestjs/passport").Type<import("@nestjs/passport").IAuthGuard>;
export declare class JwtAuthGuardOptional extends JwtAuthGuardOptional_base {
    handleRequest(err: any, user: any, info: any, context: any): any;
}
export {};
