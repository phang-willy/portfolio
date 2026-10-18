export interface Stack {
  readonly id: string;
  readonly name: string;
  readonly image: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface StackInput {
  readonly name: string;
  readonly image: string;
  readonly website?: string;
}

export interface StackDeleteInput {
  readonly website?: string;
}

export interface PageResponse<T> {
  readonly data: readonly T[];
  readonly pagination: {
    readonly page: number;
    readonly size: number;
    readonly totalItems: number;
    readonly totalPages: number;
  };
}
