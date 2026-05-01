export class Result<T> {
    protected constructor(
        readonly value?: T,
        readonly isSuccess: boolean = true,
        readonly errors?: string[],
    ) {}

    public IsSuccess(): boolean {
        return this.isSuccess;
    }

    public IsFailure(): boolean {
        return !this.isSuccess;
    }

    public GetError() {
        if (this.IsSuccess()) {
            throw new Error("[Error]: Result is success");
        }
        return this.errors;
    }

    public GetValue() {
        if (this.IsFailure()) {
            throw new Error("[Error]: Result is failure");
        }
        return this.value;
    }
}

class Success<T> extends Result<T> {
    constructor(value: T) {
        super(value);
    }
}

class Failure<E> extends Result<E> {
    constructor(errors: string[] | string) {
        super(undefined, false, typeof errors === "string" ? [errors] : errors);
    }
}

export function Ok<T>(value: T): Success<T> {
    return new Success(value);
}

export function Fail<E>(error: string[] | string): Failure<E> {
    return new Failure(error);
}
