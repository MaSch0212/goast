export type RootSchema = {
    name: string;
    address?: {
      street?: string;
      city?: string;
    };
    tags?: (string)[];
  };
