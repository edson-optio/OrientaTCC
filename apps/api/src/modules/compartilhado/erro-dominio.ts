export class ErroDominio extends Error {
  constructor(public status: 400 | 403 | 404 | 409, message: string) { super(message); }
}
