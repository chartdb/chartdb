export class AppError extends Error {
    constructor(
        message: string,
        readonly statusCode: number,
        readonly code?: string
    ) {
        super(message);
        this.name = 'AppError';
    }
}
