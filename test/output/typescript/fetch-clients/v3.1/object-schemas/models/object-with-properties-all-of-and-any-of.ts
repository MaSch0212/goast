export type ObjectWithPropertiesAllOfAndAnyOf =
  & ({
      a: string;
      b: number;
      c: number;
      d: boolean;
      e: (unknown)[];
      f: {
        [key: string]: never;
      };
    })
  & ({
      g?: string;
      h?: number;
      i?: number;
      j?: boolean;
      k?: (unknown)[];
      l?: {
        [key: string]: never;
      };
    })
  & ({
      m?: string;
      n?: number;
      o?: number;
      p?: boolean;
      q?: (unknown)[];
      r?: {
        [key: string]: never;
      };
    })
  & (Partial<{
        s?: string;
        t?: number;
        u?: number;
        v?: boolean;
        w?: (unknown)[];
        x?: {
          [key: string]: never;
        };
      }>)
  & (Partial<{
        y?: string;
        z?: number;
        aa?: number;
        bb?: boolean;
        cc?: (unknown)[];
        dd?: {
          [key: string]: never;
        };
      }>);
