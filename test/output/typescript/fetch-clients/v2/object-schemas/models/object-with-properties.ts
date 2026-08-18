export type ObjectWithProperties = {
    a?: string;
    b?: number;
    c?: number;
    d?: boolean;
    e?: (unknown)[];
    f?: {
      [key: string]: never;
    };
  };
