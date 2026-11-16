export type RecursiveThroughArray = {
    items?: ({
        nested?: RecursiveThroughArray;
      })[];
  };
