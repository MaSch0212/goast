export type ObjectWithPropertiesAllOf = ({
      a: string;
      b: number;
      c: number;
      d: boolean;
      e: (unknown)[];
      f: {
        [key: string]: never;
      };
    }) & ({
      g?: string;
      h?: number;
      i?: number;
      j?: boolean;
      k?: (unknown)[];
      l?: {
        [key: string]: never;
      };
    }) & ({
      m?: string;
      n?: number;
      o?: number;
      p?: boolean;
      q?: (unknown)[];
      r?: {
        [key: string]: never;
      };
    });
