export type ObjectWithNullableProperties = {
    a?: (string) | (null);
    b?: (number) | (null);
    c?: (number) | (null);
    d?: (boolean) | (null);
    e?: ((unknown)[]) | (null);
    f?: ({
        [key: string]: never;
      }) | (null);
  };
