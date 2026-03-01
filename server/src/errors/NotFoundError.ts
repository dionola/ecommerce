export class NotFoundError extends Error {
    public readonly statusCode: number = 404;

    constructor(message: string) {
        super(message);
        this.name = "NotFoundError";

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, NotFoundError);
        }
    }
}
