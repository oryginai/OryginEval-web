import axios, { AxiosRequestConfig, AxiosResponse, isAxiosError } from 'axios';

type ApiResult<T> =
  | {
      data: T;
      error?: never;
    }
  | {
      data?: never;
      error: {
        message: string;
        status: number;
        details?: Record<string, unknown>;
      };
    };

export class ApiClient {
  static async request<T>(config: AxiosRequestConfig): Promise<ApiResult<T>> {
    try {
      const isFormData = config.data instanceof FormData;

      const client = axios.create({
        baseURL: 'https://4psd65hvi6.execute-api.ap-south-1.amazonaws.com/eval',
        headers: {
          ...(config.data && !isFormData
            ? { 'Content-Type': 'application/json' }
            : {}),
          Authorization: `Bearer testtoken`,
        },
      });
      const response: AxiosResponse<T> = await client.request(config);
      return { data: response.data };
    } catch (err) {
      if (isAxiosError(err)) {
        console.log(`[API ERROR - ${config.url}]`, err.response?.data);
        return {
          error: {
            message: 'An unknown error occurred',
            details: err.response?.data,
            status: err.response?.status || 500,
          },
        };
      }
      console.log(`[API ERROR - ${config.url}]`, err);
      return {
        error: {
          message: 'An unknown error occurred',
          status: 500,
        },
      };
    }
  }

  static async get<T>(
    url: string,
    params?: Record<string, unknown>,
  ): Promise<ApiResult<T>> {
    return this.request<T>({ method: 'GET', url, params });
  }

  static async post<T, D = unknown>(
    url: string,
    data?: D,
  ): Promise<ApiResult<T>> {
    return this.request<T>({ method: 'POST', url, data });
  }

  static async put<T, D = unknown>(
    url: string,
    data?: D,
  ): Promise<ApiResult<T>> {
    return this.request<T>({ method: 'PUT', url, data });
  }

  static async patch<T, D = unknown>(
    url: string,
    data?: D,
  ): Promise<ApiResult<T>> {
    return this.request<T>({ method: 'PATCH', url, data });
  }

  static async delete<T>(
    url: string,
    params?: Record<string, unknown>,
  ): Promise<ApiResult<T>> {
    return this.request<T>({ method: 'DELETE', url, params });
  }
}
