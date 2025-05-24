export class ResponseDto {
  constructor(message: string, result: unknown) {
    this.message = message;
    this.result = result;
  }

  message: string;
  result: unknown;
}
