export class ResponseDto {
  constructor(error: boolean, message: string, result: any) {
    this.error = error;
    this.message = message;
    this.result = result;
  }

  error: boolean;
  message: string;
  result: any;
}
