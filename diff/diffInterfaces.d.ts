
type DeepReadonly<T extends {}> = Readonly<{
  [P in keyof T]: T[P] extends {} ? DeepReadonly<T[P]> : T[P];
}>;

type DiffableObject = DeepReadonly<{
  [key: string]: Diffable;
}>;

type Diffable = number | string | boolean | DiffableObject;

interface SimpleDiffRecord<T extends Diffable> {
  before: T;
  after: T;
}

type DiffUndoer = <T extends Diffable>(
  after: T,
  diff: null | (T extends DiffableObject ? ObjectDiffRecord<T> : SimpleDiffRecord<T>),
) => T;

type DiffApplier = <T extends Diffable>(
  before: T,
  diff: null | (T extends DiffableObject ? ObjectDiffRecord<T> : SimpleDiffRecord<T>),
) => T;

type DiffCreator = <T extends Diffable>(
  before: T,
  after: T,
) => DiffType<T>;

interface ObjectDiffRecord<T extends DiffableObject> {
  added?: Partial<{
    [key in keyof T]: T[key];
  }>;
  removed?: Partial<{
    [key in keyof T]: T[key];
  }>;
  changed?: Partial<{
    [key in keyof T]: T[key] extends DiffableObject ? ObjectDiffRecord<T[key]> : SimpleDiffRecord<T[key]>;
  }>;
}

type DiffType<T extends Diffable> =
  null | (T extends DiffableObject ? ObjectDiffRecord<T> : SimpleDiffRecord<T>);
