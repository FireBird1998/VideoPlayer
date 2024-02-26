class ApiResponse {
/**
Represents a constructor for an HTTP response.
@constructor
@param {number} statusCode - The status code of the response.
@param {any} data - The data of the response.
@param {string} [message="Success"] - The message of the response. Default value is "Success".
*/
  constructor(statusCode, data, message = "Success") {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }
  /**
   * Sends the response to the client.
   * @param {import('express').Response} res - The response object.
   */
}

export { ApiResponse };
