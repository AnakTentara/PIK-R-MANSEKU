
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model Candidate
 * 
 */
export type Candidate = $Result.DefaultSelection<Prisma.$CandidatePayload>
/**
 * Model Admin
 * 
 */
export type Admin = $Result.DefaultSelection<Prisma.$AdminPayload>
/**
 * Model Post
 * 
 */
export type Post = $Result.DefaultSelection<Prisma.$PostPayload>
/**
 * Model BlogPost
 * 
 */
export type BlogPost = $Result.DefaultSelection<Prisma.$BlogPostPayload>
/**
 * Model BlogComment
 * 
 */
export type BlogComment = $Result.DefaultSelection<Prisma.$BlogCommentPayload>
/**
 * Model BlogLike
 * 
 */
export type BlogLike = $Result.DefaultSelection<Prisma.$BlogLikePayload>
/**
 * Model Setting
 * 
 */
export type Setting = $Result.DefaultSelection<Prisma.$SettingPayload>
/**
 * Model Member
 * 
 */
export type Member = $Result.DefaultSelection<Prisma.$MemberPayload>
/**
 * Model OrgMember
 * 
 */
export type OrgMember = $Result.DefaultSelection<Prisma.$OrgMemberPayload>
/**
 * Model PasswordResetOtp
 * 
 */
export type PasswordResetOtp = $Result.DefaultSelection<Prisma.$PasswordResetOtpPayload>
/**
 * Model AlumniTestimonial
 * 
 */
export type AlumniTestimonial = $Result.DefaultSelection<Prisma.$AlumniTestimonialPayload>

/**
 * Enums
 */
export namespace $Enums {
  export const Status: {
  PENDING: 'PENDING',
  LULUS: 'LULUS',
  TIDAK_LULUS: 'TIDAK_LULUS'
};

export type Status = (typeof Status)[keyof typeof Status]


export const MemberStatus: {
  ACTIVE: 'ACTIVE',
  ALUMNI: 'ALUMNI'
};

export type MemberStatus = (typeof MemberStatus)[keyof typeof MemberStatus]

}

export type Status = $Enums.Status

export const Status: typeof $Enums.Status

export type MemberStatus = $Enums.MemberStatus

export const MemberStatus: typeof $Enums.MemberStatus

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Candidates
 * const candidates = await prisma.candidate.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Candidates
   * const candidates = await prisma.candidate.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.candidate`: Exposes CRUD operations for the **Candidate** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Candidates
    * const candidates = await prisma.candidate.findMany()
    * ```
    */
  get candidate(): Prisma.CandidateDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.admin`: Exposes CRUD operations for the **Admin** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Admins
    * const admins = await prisma.admin.findMany()
    * ```
    */
  get admin(): Prisma.AdminDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.post`: Exposes CRUD operations for the **Post** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Posts
    * const posts = await prisma.post.findMany()
    * ```
    */
  get post(): Prisma.PostDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.blogPost`: Exposes CRUD operations for the **BlogPost** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more BlogPosts
    * const blogPosts = await prisma.blogPost.findMany()
    * ```
    */
  get blogPost(): Prisma.BlogPostDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.blogComment`: Exposes CRUD operations for the **BlogComment** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more BlogComments
    * const blogComments = await prisma.blogComment.findMany()
    * ```
    */
  get blogComment(): Prisma.BlogCommentDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.blogLike`: Exposes CRUD operations for the **BlogLike** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more BlogLikes
    * const blogLikes = await prisma.blogLike.findMany()
    * ```
    */
  get blogLike(): Prisma.BlogLikeDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.setting`: Exposes CRUD operations for the **Setting** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Settings
    * const settings = await prisma.setting.findMany()
    * ```
    */
  get setting(): Prisma.SettingDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.member`: Exposes CRUD operations for the **Member** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Members
    * const members = await prisma.member.findMany()
    * ```
    */
  get member(): Prisma.MemberDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.orgMember`: Exposes CRUD operations for the **OrgMember** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more OrgMembers
    * const orgMembers = await prisma.orgMember.findMany()
    * ```
    */
  get orgMember(): Prisma.OrgMemberDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.passwordResetOtp`: Exposes CRUD operations for the **PasswordResetOtp** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more PasswordResetOtps
    * const passwordResetOtps = await prisma.passwordResetOtp.findMany()
    * ```
    */
  get passwordResetOtp(): Prisma.PasswordResetOtpDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.alumniTestimonial`: Exposes CRUD operations for the **AlumniTestimonial** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more AlumniTestimonials
    * const alumniTestimonials = await prisma.alumniTestimonial.findMany()
    * ```
    */
  get alumniTestimonial(): Prisma.AlumniTestimonialDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.19.3
   * Query Engine version: c2990dca591cba766e3b7ef5d9e8a84796e47ab7
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import Bytes = runtime.Bytes
  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    Candidate: 'Candidate',
    Admin: 'Admin',
    Post: 'Post',
    BlogPost: 'BlogPost',
    BlogComment: 'BlogComment',
    BlogLike: 'BlogLike',
    Setting: 'Setting',
    Member: 'Member',
    OrgMember: 'OrgMember',
    PasswordResetOtp: 'PasswordResetOtp',
    AlumniTestimonial: 'AlumniTestimonial'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "candidate" | "admin" | "post" | "blogPost" | "blogComment" | "blogLike" | "setting" | "member" | "orgMember" | "passwordResetOtp" | "alumniTestimonial"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      Candidate: {
        payload: Prisma.$CandidatePayload<ExtArgs>
        fields: Prisma.CandidateFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CandidateFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CandidatePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CandidateFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CandidatePayload>
          }
          findFirst: {
            args: Prisma.CandidateFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CandidatePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CandidateFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CandidatePayload>
          }
          findMany: {
            args: Prisma.CandidateFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CandidatePayload>[]
          }
          create: {
            args: Prisma.CandidateCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CandidatePayload>
          }
          createMany: {
            args: Prisma.CandidateCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.CandidateDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CandidatePayload>
          }
          update: {
            args: Prisma.CandidateUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CandidatePayload>
          }
          deleteMany: {
            args: Prisma.CandidateDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CandidateUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.CandidateUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CandidatePayload>
          }
          aggregate: {
            args: Prisma.CandidateAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCandidate>
          }
          groupBy: {
            args: Prisma.CandidateGroupByArgs<ExtArgs>
            result: $Utils.Optional<CandidateGroupByOutputType>[]
          }
          count: {
            args: Prisma.CandidateCountArgs<ExtArgs>
            result: $Utils.Optional<CandidateCountAggregateOutputType> | number
          }
        }
      }
      Admin: {
        payload: Prisma.$AdminPayload<ExtArgs>
        fields: Prisma.AdminFieldRefs
        operations: {
          findUnique: {
            args: Prisma.AdminFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AdminPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.AdminFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AdminPayload>
          }
          findFirst: {
            args: Prisma.AdminFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AdminPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.AdminFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AdminPayload>
          }
          findMany: {
            args: Prisma.AdminFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AdminPayload>[]
          }
          create: {
            args: Prisma.AdminCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AdminPayload>
          }
          createMany: {
            args: Prisma.AdminCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.AdminDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AdminPayload>
          }
          update: {
            args: Prisma.AdminUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AdminPayload>
          }
          deleteMany: {
            args: Prisma.AdminDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.AdminUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.AdminUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AdminPayload>
          }
          aggregate: {
            args: Prisma.AdminAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateAdmin>
          }
          groupBy: {
            args: Prisma.AdminGroupByArgs<ExtArgs>
            result: $Utils.Optional<AdminGroupByOutputType>[]
          }
          count: {
            args: Prisma.AdminCountArgs<ExtArgs>
            result: $Utils.Optional<AdminCountAggregateOutputType> | number
          }
        }
      }
      Post: {
        payload: Prisma.$PostPayload<ExtArgs>
        fields: Prisma.PostFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PostFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PostPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PostFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PostPayload>
          }
          findFirst: {
            args: Prisma.PostFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PostPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PostFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PostPayload>
          }
          findMany: {
            args: Prisma.PostFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PostPayload>[]
          }
          create: {
            args: Prisma.PostCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PostPayload>
          }
          createMany: {
            args: Prisma.PostCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.PostDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PostPayload>
          }
          update: {
            args: Prisma.PostUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PostPayload>
          }
          deleteMany: {
            args: Prisma.PostDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PostUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.PostUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PostPayload>
          }
          aggregate: {
            args: Prisma.PostAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePost>
          }
          groupBy: {
            args: Prisma.PostGroupByArgs<ExtArgs>
            result: $Utils.Optional<PostGroupByOutputType>[]
          }
          count: {
            args: Prisma.PostCountArgs<ExtArgs>
            result: $Utils.Optional<PostCountAggregateOutputType> | number
          }
        }
      }
      BlogPost: {
        payload: Prisma.$BlogPostPayload<ExtArgs>
        fields: Prisma.BlogPostFieldRefs
        operations: {
          findUnique: {
            args: Prisma.BlogPostFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BlogPostPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.BlogPostFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BlogPostPayload>
          }
          findFirst: {
            args: Prisma.BlogPostFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BlogPostPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.BlogPostFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BlogPostPayload>
          }
          findMany: {
            args: Prisma.BlogPostFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BlogPostPayload>[]
          }
          create: {
            args: Prisma.BlogPostCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BlogPostPayload>
          }
          createMany: {
            args: Prisma.BlogPostCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.BlogPostDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BlogPostPayload>
          }
          update: {
            args: Prisma.BlogPostUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BlogPostPayload>
          }
          deleteMany: {
            args: Prisma.BlogPostDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.BlogPostUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.BlogPostUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BlogPostPayload>
          }
          aggregate: {
            args: Prisma.BlogPostAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateBlogPost>
          }
          groupBy: {
            args: Prisma.BlogPostGroupByArgs<ExtArgs>
            result: $Utils.Optional<BlogPostGroupByOutputType>[]
          }
          count: {
            args: Prisma.BlogPostCountArgs<ExtArgs>
            result: $Utils.Optional<BlogPostCountAggregateOutputType> | number
          }
        }
      }
      BlogComment: {
        payload: Prisma.$BlogCommentPayload<ExtArgs>
        fields: Prisma.BlogCommentFieldRefs
        operations: {
          findUnique: {
            args: Prisma.BlogCommentFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BlogCommentPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.BlogCommentFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BlogCommentPayload>
          }
          findFirst: {
            args: Prisma.BlogCommentFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BlogCommentPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.BlogCommentFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BlogCommentPayload>
          }
          findMany: {
            args: Prisma.BlogCommentFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BlogCommentPayload>[]
          }
          create: {
            args: Prisma.BlogCommentCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BlogCommentPayload>
          }
          createMany: {
            args: Prisma.BlogCommentCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.BlogCommentDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BlogCommentPayload>
          }
          update: {
            args: Prisma.BlogCommentUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BlogCommentPayload>
          }
          deleteMany: {
            args: Prisma.BlogCommentDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.BlogCommentUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.BlogCommentUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BlogCommentPayload>
          }
          aggregate: {
            args: Prisma.BlogCommentAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateBlogComment>
          }
          groupBy: {
            args: Prisma.BlogCommentGroupByArgs<ExtArgs>
            result: $Utils.Optional<BlogCommentGroupByOutputType>[]
          }
          count: {
            args: Prisma.BlogCommentCountArgs<ExtArgs>
            result: $Utils.Optional<BlogCommentCountAggregateOutputType> | number
          }
        }
      }
      BlogLike: {
        payload: Prisma.$BlogLikePayload<ExtArgs>
        fields: Prisma.BlogLikeFieldRefs
        operations: {
          findUnique: {
            args: Prisma.BlogLikeFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BlogLikePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.BlogLikeFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BlogLikePayload>
          }
          findFirst: {
            args: Prisma.BlogLikeFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BlogLikePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.BlogLikeFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BlogLikePayload>
          }
          findMany: {
            args: Prisma.BlogLikeFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BlogLikePayload>[]
          }
          create: {
            args: Prisma.BlogLikeCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BlogLikePayload>
          }
          createMany: {
            args: Prisma.BlogLikeCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.BlogLikeDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BlogLikePayload>
          }
          update: {
            args: Prisma.BlogLikeUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BlogLikePayload>
          }
          deleteMany: {
            args: Prisma.BlogLikeDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.BlogLikeUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.BlogLikeUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BlogLikePayload>
          }
          aggregate: {
            args: Prisma.BlogLikeAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateBlogLike>
          }
          groupBy: {
            args: Prisma.BlogLikeGroupByArgs<ExtArgs>
            result: $Utils.Optional<BlogLikeGroupByOutputType>[]
          }
          count: {
            args: Prisma.BlogLikeCountArgs<ExtArgs>
            result: $Utils.Optional<BlogLikeCountAggregateOutputType> | number
          }
        }
      }
      Setting: {
        payload: Prisma.$SettingPayload<ExtArgs>
        fields: Prisma.SettingFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SettingFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SettingPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SettingFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SettingPayload>
          }
          findFirst: {
            args: Prisma.SettingFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SettingPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SettingFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SettingPayload>
          }
          findMany: {
            args: Prisma.SettingFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SettingPayload>[]
          }
          create: {
            args: Prisma.SettingCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SettingPayload>
          }
          createMany: {
            args: Prisma.SettingCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.SettingDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SettingPayload>
          }
          update: {
            args: Prisma.SettingUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SettingPayload>
          }
          deleteMany: {
            args: Prisma.SettingDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SettingUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.SettingUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SettingPayload>
          }
          aggregate: {
            args: Prisma.SettingAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSetting>
          }
          groupBy: {
            args: Prisma.SettingGroupByArgs<ExtArgs>
            result: $Utils.Optional<SettingGroupByOutputType>[]
          }
          count: {
            args: Prisma.SettingCountArgs<ExtArgs>
            result: $Utils.Optional<SettingCountAggregateOutputType> | number
          }
        }
      }
      Member: {
        payload: Prisma.$MemberPayload<ExtArgs>
        fields: Prisma.MemberFieldRefs
        operations: {
          findUnique: {
            args: Prisma.MemberFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MemberPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.MemberFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MemberPayload>
          }
          findFirst: {
            args: Prisma.MemberFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MemberPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.MemberFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MemberPayload>
          }
          findMany: {
            args: Prisma.MemberFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MemberPayload>[]
          }
          create: {
            args: Prisma.MemberCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MemberPayload>
          }
          createMany: {
            args: Prisma.MemberCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.MemberDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MemberPayload>
          }
          update: {
            args: Prisma.MemberUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MemberPayload>
          }
          deleteMany: {
            args: Prisma.MemberDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.MemberUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.MemberUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MemberPayload>
          }
          aggregate: {
            args: Prisma.MemberAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateMember>
          }
          groupBy: {
            args: Prisma.MemberGroupByArgs<ExtArgs>
            result: $Utils.Optional<MemberGroupByOutputType>[]
          }
          count: {
            args: Prisma.MemberCountArgs<ExtArgs>
            result: $Utils.Optional<MemberCountAggregateOutputType> | number
          }
        }
      }
      OrgMember: {
        payload: Prisma.$OrgMemberPayload<ExtArgs>
        fields: Prisma.OrgMemberFieldRefs
        operations: {
          findUnique: {
            args: Prisma.OrgMemberFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrgMemberPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.OrgMemberFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrgMemberPayload>
          }
          findFirst: {
            args: Prisma.OrgMemberFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrgMemberPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.OrgMemberFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrgMemberPayload>
          }
          findMany: {
            args: Prisma.OrgMemberFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrgMemberPayload>[]
          }
          create: {
            args: Prisma.OrgMemberCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrgMemberPayload>
          }
          createMany: {
            args: Prisma.OrgMemberCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.OrgMemberDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrgMemberPayload>
          }
          update: {
            args: Prisma.OrgMemberUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrgMemberPayload>
          }
          deleteMany: {
            args: Prisma.OrgMemberDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.OrgMemberUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.OrgMemberUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrgMemberPayload>
          }
          aggregate: {
            args: Prisma.OrgMemberAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateOrgMember>
          }
          groupBy: {
            args: Prisma.OrgMemberGroupByArgs<ExtArgs>
            result: $Utils.Optional<OrgMemberGroupByOutputType>[]
          }
          count: {
            args: Prisma.OrgMemberCountArgs<ExtArgs>
            result: $Utils.Optional<OrgMemberCountAggregateOutputType> | number
          }
        }
      }
      PasswordResetOtp: {
        payload: Prisma.$PasswordResetOtpPayload<ExtArgs>
        fields: Prisma.PasswordResetOtpFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PasswordResetOtpFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PasswordResetOtpPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PasswordResetOtpFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PasswordResetOtpPayload>
          }
          findFirst: {
            args: Prisma.PasswordResetOtpFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PasswordResetOtpPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PasswordResetOtpFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PasswordResetOtpPayload>
          }
          findMany: {
            args: Prisma.PasswordResetOtpFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PasswordResetOtpPayload>[]
          }
          create: {
            args: Prisma.PasswordResetOtpCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PasswordResetOtpPayload>
          }
          createMany: {
            args: Prisma.PasswordResetOtpCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.PasswordResetOtpDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PasswordResetOtpPayload>
          }
          update: {
            args: Prisma.PasswordResetOtpUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PasswordResetOtpPayload>
          }
          deleteMany: {
            args: Prisma.PasswordResetOtpDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PasswordResetOtpUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.PasswordResetOtpUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PasswordResetOtpPayload>
          }
          aggregate: {
            args: Prisma.PasswordResetOtpAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePasswordResetOtp>
          }
          groupBy: {
            args: Prisma.PasswordResetOtpGroupByArgs<ExtArgs>
            result: $Utils.Optional<PasswordResetOtpGroupByOutputType>[]
          }
          count: {
            args: Prisma.PasswordResetOtpCountArgs<ExtArgs>
            result: $Utils.Optional<PasswordResetOtpCountAggregateOutputType> | number
          }
        }
      }
      AlumniTestimonial: {
        payload: Prisma.$AlumniTestimonialPayload<ExtArgs>
        fields: Prisma.AlumniTestimonialFieldRefs
        operations: {
          findUnique: {
            args: Prisma.AlumniTestimonialFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AlumniTestimonialPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.AlumniTestimonialFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AlumniTestimonialPayload>
          }
          findFirst: {
            args: Prisma.AlumniTestimonialFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AlumniTestimonialPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.AlumniTestimonialFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AlumniTestimonialPayload>
          }
          findMany: {
            args: Prisma.AlumniTestimonialFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AlumniTestimonialPayload>[]
          }
          create: {
            args: Prisma.AlumniTestimonialCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AlumniTestimonialPayload>
          }
          createMany: {
            args: Prisma.AlumniTestimonialCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.AlumniTestimonialDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AlumniTestimonialPayload>
          }
          update: {
            args: Prisma.AlumniTestimonialUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AlumniTestimonialPayload>
          }
          deleteMany: {
            args: Prisma.AlumniTestimonialDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.AlumniTestimonialUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.AlumniTestimonialUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AlumniTestimonialPayload>
          }
          aggregate: {
            args: Prisma.AlumniTestimonialAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateAlumniTestimonial>
          }
          groupBy: {
            args: Prisma.AlumniTestimonialGroupByArgs<ExtArgs>
            result: $Utils.Optional<AlumniTestimonialGroupByOutputType>[]
          }
          count: {
            args: Prisma.AlumniTestimonialCountArgs<ExtArgs>
            result: $Utils.Optional<AlumniTestimonialCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-planetscale`
     */
    adapter?: runtime.SqlDriverAdapterFactory | null
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    candidate?: CandidateOmit
    admin?: AdminOmit
    post?: PostOmit
    blogPost?: BlogPostOmit
    blogComment?: BlogCommentOmit
    blogLike?: BlogLikeOmit
    setting?: SettingOmit
    member?: MemberOmit
    orgMember?: OrgMemberOmit
    passwordResetOtp?: PasswordResetOtpOmit
    alumniTestimonial?: AlumniTestimonialOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type AdminCountOutputType
   */

  export type AdminCountOutputType = {
    posts: number
    blogPosts: number
  }

  export type AdminCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    posts?: boolean | AdminCountOutputTypeCountPostsArgs
    blogPosts?: boolean | AdminCountOutputTypeCountBlogPostsArgs
  }

  // Custom InputTypes
  /**
   * AdminCountOutputType without action
   */
  export type AdminCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AdminCountOutputType
     */
    select?: AdminCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * AdminCountOutputType without action
   */
  export type AdminCountOutputTypeCountPostsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PostWhereInput
  }

  /**
   * AdminCountOutputType without action
   */
  export type AdminCountOutputTypeCountBlogPostsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: BlogPostWhereInput
  }


  /**
   * Count Type BlogPostCountOutputType
   */

  export type BlogPostCountOutputType = {
    comments: number
    likes: number
  }

  export type BlogPostCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    comments?: boolean | BlogPostCountOutputTypeCountCommentsArgs
    likes?: boolean | BlogPostCountOutputTypeCountLikesArgs
  }

  // Custom InputTypes
  /**
   * BlogPostCountOutputType without action
   */
  export type BlogPostCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BlogPostCountOutputType
     */
    select?: BlogPostCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * BlogPostCountOutputType without action
   */
  export type BlogPostCountOutputTypeCountCommentsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: BlogCommentWhereInput
  }

  /**
   * BlogPostCountOutputType without action
   */
  export type BlogPostCountOutputTypeCountLikesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: BlogLikeWhereInput
  }


  /**
   * Count Type BlogCommentCountOutputType
   */

  export type BlogCommentCountOutputType = {
    replies: number
  }

  export type BlogCommentCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    replies?: boolean | BlogCommentCountOutputTypeCountRepliesArgs
  }

  // Custom InputTypes
  /**
   * BlogCommentCountOutputType without action
   */
  export type BlogCommentCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BlogCommentCountOutputType
     */
    select?: BlogCommentCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * BlogCommentCountOutputType without action
   */
  export type BlogCommentCountOutputTypeCountRepliesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: BlogCommentWhereInput
  }


  /**
   * Count Type MemberCountOutputType
   */

  export type MemberCountOutputType = {
    blogPosts: number
    blogComments: number
    blogLikes: number
  }

  export type MemberCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    blogPosts?: boolean | MemberCountOutputTypeCountBlogPostsArgs
    blogComments?: boolean | MemberCountOutputTypeCountBlogCommentsArgs
    blogLikes?: boolean | MemberCountOutputTypeCountBlogLikesArgs
  }

  // Custom InputTypes
  /**
   * MemberCountOutputType without action
   */
  export type MemberCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MemberCountOutputType
     */
    select?: MemberCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * MemberCountOutputType without action
   */
  export type MemberCountOutputTypeCountBlogPostsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: BlogPostWhereInput
  }

  /**
   * MemberCountOutputType without action
   */
  export type MemberCountOutputTypeCountBlogCommentsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: BlogCommentWhereInput
  }

  /**
   * MemberCountOutputType without action
   */
  export type MemberCountOutputTypeCountBlogLikesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: BlogLikeWhereInput
  }


  /**
   * Models
   */

  /**
   * Model Candidate
   */

  export type AggregateCandidate = {
    _count: CandidateCountAggregateOutputType | null
    _min: CandidateMinAggregateOutputType | null
    _max: CandidateMaxAggregateOutputType | null
  }

  export type CandidateMinAggregateOutputType = {
    id: string | null
    nisn: string | null
    name: string | null
    className: string | null
    whatsappNumber: string | null
    email: string | null
    gender: string | null
    asalSekolah: string | null
    reason: string | null
    status: $Enums.Status | null
    photoPath: string | null
    password: string | null
    plainPassword: string | null
    emailNotified: boolean | null
    waNotified: boolean | null
    lastStatus: $Enums.Status | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type CandidateMaxAggregateOutputType = {
    id: string | null
    nisn: string | null
    name: string | null
    className: string | null
    whatsappNumber: string | null
    email: string | null
    gender: string | null
    asalSekolah: string | null
    reason: string | null
    status: $Enums.Status | null
    photoPath: string | null
    password: string | null
    plainPassword: string | null
    emailNotified: boolean | null
    waNotified: boolean | null
    lastStatus: $Enums.Status | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type CandidateCountAggregateOutputType = {
    id: number
    nisn: number
    name: number
    className: number
    whatsappNumber: number
    email: number
    gender: number
    asalSekolah: number
    reason: number
    status: number
    photoPath: number
    password: number
    plainPassword: number
    emailNotified: number
    waNotified: number
    lastStatus: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type CandidateMinAggregateInputType = {
    id?: true
    nisn?: true
    name?: true
    className?: true
    whatsappNumber?: true
    email?: true
    gender?: true
    asalSekolah?: true
    reason?: true
    status?: true
    photoPath?: true
    password?: true
    plainPassword?: true
    emailNotified?: true
    waNotified?: true
    lastStatus?: true
    createdAt?: true
    updatedAt?: true
  }

  export type CandidateMaxAggregateInputType = {
    id?: true
    nisn?: true
    name?: true
    className?: true
    whatsappNumber?: true
    email?: true
    gender?: true
    asalSekolah?: true
    reason?: true
    status?: true
    photoPath?: true
    password?: true
    plainPassword?: true
    emailNotified?: true
    waNotified?: true
    lastStatus?: true
    createdAt?: true
    updatedAt?: true
  }

  export type CandidateCountAggregateInputType = {
    id?: true
    nisn?: true
    name?: true
    className?: true
    whatsappNumber?: true
    email?: true
    gender?: true
    asalSekolah?: true
    reason?: true
    status?: true
    photoPath?: true
    password?: true
    plainPassword?: true
    emailNotified?: true
    waNotified?: true
    lastStatus?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type CandidateAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Candidate to aggregate.
     */
    where?: CandidateWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Candidates to fetch.
     */
    orderBy?: CandidateOrderByWithRelationInput | CandidateOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: CandidateWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Candidates from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Candidates.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Candidates
    **/
    _count?: true | CandidateCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: CandidateMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: CandidateMaxAggregateInputType
  }

  export type GetCandidateAggregateType<T extends CandidateAggregateArgs> = {
        [P in keyof T & keyof AggregateCandidate]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCandidate[P]>
      : GetScalarType<T[P], AggregateCandidate[P]>
  }




  export type CandidateGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CandidateWhereInput
    orderBy?: CandidateOrderByWithAggregationInput | CandidateOrderByWithAggregationInput[]
    by: CandidateScalarFieldEnum[] | CandidateScalarFieldEnum
    having?: CandidateScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CandidateCountAggregateInputType | true
    _min?: CandidateMinAggregateInputType
    _max?: CandidateMaxAggregateInputType
  }

  export type CandidateGroupByOutputType = {
    id: string
    nisn: string
    name: string
    className: string
    whatsappNumber: string
    email: string
    gender: string
    asalSekolah: string
    reason: string
    status: $Enums.Status
    photoPath: string | null
    password: string | null
    plainPassword: string | null
    emailNotified: boolean
    waNotified: boolean
    lastStatus: $Enums.Status
    createdAt: Date
    updatedAt: Date
    _count: CandidateCountAggregateOutputType | null
    _min: CandidateMinAggregateOutputType | null
    _max: CandidateMaxAggregateOutputType | null
  }

  type GetCandidateGroupByPayload<T extends CandidateGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CandidateGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CandidateGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CandidateGroupByOutputType[P]>
            : GetScalarType<T[P], CandidateGroupByOutputType[P]>
        }
      >
    >


  export type CandidateSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    nisn?: boolean
    name?: boolean
    className?: boolean
    whatsappNumber?: boolean
    email?: boolean
    gender?: boolean
    asalSekolah?: boolean
    reason?: boolean
    status?: boolean
    photoPath?: boolean
    password?: boolean
    plainPassword?: boolean
    emailNotified?: boolean
    waNotified?: boolean
    lastStatus?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["candidate"]>



  export type CandidateSelectScalar = {
    id?: boolean
    nisn?: boolean
    name?: boolean
    className?: boolean
    whatsappNumber?: boolean
    email?: boolean
    gender?: boolean
    asalSekolah?: boolean
    reason?: boolean
    status?: boolean
    photoPath?: boolean
    password?: boolean
    plainPassword?: boolean
    emailNotified?: boolean
    waNotified?: boolean
    lastStatus?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type CandidateOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "nisn" | "name" | "className" | "whatsappNumber" | "email" | "gender" | "asalSekolah" | "reason" | "status" | "photoPath" | "password" | "plainPassword" | "emailNotified" | "waNotified" | "lastStatus" | "createdAt" | "updatedAt", ExtArgs["result"]["candidate"]>

  export type $CandidatePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Candidate"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      nisn: string
      name: string
      className: string
      whatsappNumber: string
      email: string
      gender: string
      asalSekolah: string
      reason: string
      status: $Enums.Status
      photoPath: string | null
      password: string | null
      plainPassword: string | null
      emailNotified: boolean
      waNotified: boolean
      lastStatus: $Enums.Status
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["candidate"]>
    composites: {}
  }

  type CandidateGetPayload<S extends boolean | null | undefined | CandidateDefaultArgs> = $Result.GetResult<Prisma.$CandidatePayload, S>

  type CandidateCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<CandidateFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: CandidateCountAggregateInputType | true
    }

  export interface CandidateDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Candidate'], meta: { name: 'Candidate' } }
    /**
     * Find zero or one Candidate that matches the filter.
     * @param {CandidateFindUniqueArgs} args - Arguments to find a Candidate
     * @example
     * // Get one Candidate
     * const candidate = await prisma.candidate.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CandidateFindUniqueArgs>(args: SelectSubset<T, CandidateFindUniqueArgs<ExtArgs>>): Prisma__CandidateClient<$Result.GetResult<Prisma.$CandidatePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Candidate that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {CandidateFindUniqueOrThrowArgs} args - Arguments to find a Candidate
     * @example
     * // Get one Candidate
     * const candidate = await prisma.candidate.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CandidateFindUniqueOrThrowArgs>(args: SelectSubset<T, CandidateFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CandidateClient<$Result.GetResult<Prisma.$CandidatePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Candidate that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CandidateFindFirstArgs} args - Arguments to find a Candidate
     * @example
     * // Get one Candidate
     * const candidate = await prisma.candidate.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CandidateFindFirstArgs>(args?: SelectSubset<T, CandidateFindFirstArgs<ExtArgs>>): Prisma__CandidateClient<$Result.GetResult<Prisma.$CandidatePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Candidate that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CandidateFindFirstOrThrowArgs} args - Arguments to find a Candidate
     * @example
     * // Get one Candidate
     * const candidate = await prisma.candidate.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CandidateFindFirstOrThrowArgs>(args?: SelectSubset<T, CandidateFindFirstOrThrowArgs<ExtArgs>>): Prisma__CandidateClient<$Result.GetResult<Prisma.$CandidatePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Candidates that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CandidateFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Candidates
     * const candidates = await prisma.candidate.findMany()
     * 
     * // Get first 10 Candidates
     * const candidates = await prisma.candidate.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const candidateWithIdOnly = await prisma.candidate.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends CandidateFindManyArgs>(args?: SelectSubset<T, CandidateFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CandidatePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Candidate.
     * @param {CandidateCreateArgs} args - Arguments to create a Candidate.
     * @example
     * // Create one Candidate
     * const Candidate = await prisma.candidate.create({
     *   data: {
     *     // ... data to create a Candidate
     *   }
     * })
     * 
     */
    create<T extends CandidateCreateArgs>(args: SelectSubset<T, CandidateCreateArgs<ExtArgs>>): Prisma__CandidateClient<$Result.GetResult<Prisma.$CandidatePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Candidates.
     * @param {CandidateCreateManyArgs} args - Arguments to create many Candidates.
     * @example
     * // Create many Candidates
     * const candidate = await prisma.candidate.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends CandidateCreateManyArgs>(args?: SelectSubset<T, CandidateCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a Candidate.
     * @param {CandidateDeleteArgs} args - Arguments to delete one Candidate.
     * @example
     * // Delete one Candidate
     * const Candidate = await prisma.candidate.delete({
     *   where: {
     *     // ... filter to delete one Candidate
     *   }
     * })
     * 
     */
    delete<T extends CandidateDeleteArgs>(args: SelectSubset<T, CandidateDeleteArgs<ExtArgs>>): Prisma__CandidateClient<$Result.GetResult<Prisma.$CandidatePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Candidate.
     * @param {CandidateUpdateArgs} args - Arguments to update one Candidate.
     * @example
     * // Update one Candidate
     * const candidate = await prisma.candidate.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends CandidateUpdateArgs>(args: SelectSubset<T, CandidateUpdateArgs<ExtArgs>>): Prisma__CandidateClient<$Result.GetResult<Prisma.$CandidatePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Candidates.
     * @param {CandidateDeleteManyArgs} args - Arguments to filter Candidates to delete.
     * @example
     * // Delete a few Candidates
     * const { count } = await prisma.candidate.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends CandidateDeleteManyArgs>(args?: SelectSubset<T, CandidateDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Candidates.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CandidateUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Candidates
     * const candidate = await prisma.candidate.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends CandidateUpdateManyArgs>(args: SelectSubset<T, CandidateUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Candidate.
     * @param {CandidateUpsertArgs} args - Arguments to update or create a Candidate.
     * @example
     * // Update or create a Candidate
     * const candidate = await prisma.candidate.upsert({
     *   create: {
     *     // ... data to create a Candidate
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Candidate we want to update
     *   }
     * })
     */
    upsert<T extends CandidateUpsertArgs>(args: SelectSubset<T, CandidateUpsertArgs<ExtArgs>>): Prisma__CandidateClient<$Result.GetResult<Prisma.$CandidatePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Candidates.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CandidateCountArgs} args - Arguments to filter Candidates to count.
     * @example
     * // Count the number of Candidates
     * const count = await prisma.candidate.count({
     *   where: {
     *     // ... the filter for the Candidates we want to count
     *   }
     * })
    **/
    count<T extends CandidateCountArgs>(
      args?: Subset<T, CandidateCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CandidateCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Candidate.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CandidateAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends CandidateAggregateArgs>(args: Subset<T, CandidateAggregateArgs>): Prisma.PrismaPromise<GetCandidateAggregateType<T>>

    /**
     * Group by Candidate.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CandidateGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends CandidateGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CandidateGroupByArgs['orderBy'] }
        : { orderBy?: CandidateGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, CandidateGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCandidateGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Candidate model
   */
  readonly fields: CandidateFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Candidate.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CandidateClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Candidate model
   */
  interface CandidateFieldRefs {
    readonly id: FieldRef<"Candidate", 'String'>
    readonly nisn: FieldRef<"Candidate", 'String'>
    readonly name: FieldRef<"Candidate", 'String'>
    readonly className: FieldRef<"Candidate", 'String'>
    readonly whatsappNumber: FieldRef<"Candidate", 'String'>
    readonly email: FieldRef<"Candidate", 'String'>
    readonly gender: FieldRef<"Candidate", 'String'>
    readonly asalSekolah: FieldRef<"Candidate", 'String'>
    readonly reason: FieldRef<"Candidate", 'String'>
    readonly status: FieldRef<"Candidate", 'Status'>
    readonly photoPath: FieldRef<"Candidate", 'String'>
    readonly password: FieldRef<"Candidate", 'String'>
    readonly plainPassword: FieldRef<"Candidate", 'String'>
    readonly emailNotified: FieldRef<"Candidate", 'Boolean'>
    readonly waNotified: FieldRef<"Candidate", 'Boolean'>
    readonly lastStatus: FieldRef<"Candidate", 'Status'>
    readonly createdAt: FieldRef<"Candidate", 'DateTime'>
    readonly updatedAt: FieldRef<"Candidate", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Candidate findUnique
   */
  export type CandidateFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Candidate
     */
    select?: CandidateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Candidate
     */
    omit?: CandidateOmit<ExtArgs> | null
    /**
     * Filter, which Candidate to fetch.
     */
    where: CandidateWhereUniqueInput
  }

  /**
   * Candidate findUniqueOrThrow
   */
  export type CandidateFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Candidate
     */
    select?: CandidateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Candidate
     */
    omit?: CandidateOmit<ExtArgs> | null
    /**
     * Filter, which Candidate to fetch.
     */
    where: CandidateWhereUniqueInput
  }

  /**
   * Candidate findFirst
   */
  export type CandidateFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Candidate
     */
    select?: CandidateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Candidate
     */
    omit?: CandidateOmit<ExtArgs> | null
    /**
     * Filter, which Candidate to fetch.
     */
    where?: CandidateWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Candidates to fetch.
     */
    orderBy?: CandidateOrderByWithRelationInput | CandidateOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Candidates.
     */
    cursor?: CandidateWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Candidates from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Candidates.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Candidates.
     */
    distinct?: CandidateScalarFieldEnum | CandidateScalarFieldEnum[]
  }

  /**
   * Candidate findFirstOrThrow
   */
  export type CandidateFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Candidate
     */
    select?: CandidateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Candidate
     */
    omit?: CandidateOmit<ExtArgs> | null
    /**
     * Filter, which Candidate to fetch.
     */
    where?: CandidateWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Candidates to fetch.
     */
    orderBy?: CandidateOrderByWithRelationInput | CandidateOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Candidates.
     */
    cursor?: CandidateWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Candidates from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Candidates.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Candidates.
     */
    distinct?: CandidateScalarFieldEnum | CandidateScalarFieldEnum[]
  }

  /**
   * Candidate findMany
   */
  export type CandidateFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Candidate
     */
    select?: CandidateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Candidate
     */
    omit?: CandidateOmit<ExtArgs> | null
    /**
     * Filter, which Candidates to fetch.
     */
    where?: CandidateWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Candidates to fetch.
     */
    orderBy?: CandidateOrderByWithRelationInput | CandidateOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Candidates.
     */
    cursor?: CandidateWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Candidates from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Candidates.
     */
    skip?: number
    distinct?: CandidateScalarFieldEnum | CandidateScalarFieldEnum[]
  }

  /**
   * Candidate create
   */
  export type CandidateCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Candidate
     */
    select?: CandidateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Candidate
     */
    omit?: CandidateOmit<ExtArgs> | null
    /**
     * The data needed to create a Candidate.
     */
    data: XOR<CandidateCreateInput, CandidateUncheckedCreateInput>
  }

  /**
   * Candidate createMany
   */
  export type CandidateCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Candidates.
     */
    data: CandidateCreateManyInput | CandidateCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Candidate update
   */
  export type CandidateUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Candidate
     */
    select?: CandidateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Candidate
     */
    omit?: CandidateOmit<ExtArgs> | null
    /**
     * The data needed to update a Candidate.
     */
    data: XOR<CandidateUpdateInput, CandidateUncheckedUpdateInput>
    /**
     * Choose, which Candidate to update.
     */
    where: CandidateWhereUniqueInput
  }

  /**
   * Candidate updateMany
   */
  export type CandidateUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Candidates.
     */
    data: XOR<CandidateUpdateManyMutationInput, CandidateUncheckedUpdateManyInput>
    /**
     * Filter which Candidates to update
     */
    where?: CandidateWhereInput
    /**
     * Limit how many Candidates to update.
     */
    limit?: number
  }

  /**
   * Candidate upsert
   */
  export type CandidateUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Candidate
     */
    select?: CandidateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Candidate
     */
    omit?: CandidateOmit<ExtArgs> | null
    /**
     * The filter to search for the Candidate to update in case it exists.
     */
    where: CandidateWhereUniqueInput
    /**
     * In case the Candidate found by the `where` argument doesn't exist, create a new Candidate with this data.
     */
    create: XOR<CandidateCreateInput, CandidateUncheckedCreateInput>
    /**
     * In case the Candidate was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CandidateUpdateInput, CandidateUncheckedUpdateInput>
  }

  /**
   * Candidate delete
   */
  export type CandidateDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Candidate
     */
    select?: CandidateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Candidate
     */
    omit?: CandidateOmit<ExtArgs> | null
    /**
     * Filter which Candidate to delete.
     */
    where: CandidateWhereUniqueInput
  }

  /**
   * Candidate deleteMany
   */
  export type CandidateDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Candidates to delete
     */
    where?: CandidateWhereInput
    /**
     * Limit how many Candidates to delete.
     */
    limit?: number
  }

  /**
   * Candidate without action
   */
  export type CandidateDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Candidate
     */
    select?: CandidateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Candidate
     */
    omit?: CandidateOmit<ExtArgs> | null
  }


  /**
   * Model Admin
   */

  export type AggregateAdmin = {
    _count: AdminCountAggregateOutputType | null
    _min: AdminMinAggregateOutputType | null
    _max: AdminMaxAggregateOutputType | null
  }

  export type AdminMinAggregateOutputType = {
    id: string | null
    username: string | null
    password: string | null
    role: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type AdminMaxAggregateOutputType = {
    id: string | null
    username: string | null
    password: string | null
    role: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type AdminCountAggregateOutputType = {
    id: number
    username: number
    password: number
    role: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type AdminMinAggregateInputType = {
    id?: true
    username?: true
    password?: true
    role?: true
    createdAt?: true
    updatedAt?: true
  }

  export type AdminMaxAggregateInputType = {
    id?: true
    username?: true
    password?: true
    role?: true
    createdAt?: true
    updatedAt?: true
  }

  export type AdminCountAggregateInputType = {
    id?: true
    username?: true
    password?: true
    role?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type AdminAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Admin to aggregate.
     */
    where?: AdminWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Admins to fetch.
     */
    orderBy?: AdminOrderByWithRelationInput | AdminOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: AdminWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Admins from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Admins.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Admins
    **/
    _count?: true | AdminCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: AdminMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: AdminMaxAggregateInputType
  }

  export type GetAdminAggregateType<T extends AdminAggregateArgs> = {
        [P in keyof T & keyof AggregateAdmin]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateAdmin[P]>
      : GetScalarType<T[P], AggregateAdmin[P]>
  }




  export type AdminGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AdminWhereInput
    orderBy?: AdminOrderByWithAggregationInput | AdminOrderByWithAggregationInput[]
    by: AdminScalarFieldEnum[] | AdminScalarFieldEnum
    having?: AdminScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: AdminCountAggregateInputType | true
    _min?: AdminMinAggregateInputType
    _max?: AdminMaxAggregateInputType
  }

  export type AdminGroupByOutputType = {
    id: string
    username: string
    password: string
    role: string
    createdAt: Date
    updatedAt: Date
    _count: AdminCountAggregateOutputType | null
    _min: AdminMinAggregateOutputType | null
    _max: AdminMaxAggregateOutputType | null
  }

  type GetAdminGroupByPayload<T extends AdminGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<AdminGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof AdminGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], AdminGroupByOutputType[P]>
            : GetScalarType<T[P], AdminGroupByOutputType[P]>
        }
      >
    >


  export type AdminSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    username?: boolean
    password?: boolean
    role?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    posts?: boolean | Admin$postsArgs<ExtArgs>
    blogPosts?: boolean | Admin$blogPostsArgs<ExtArgs>
    _count?: boolean | AdminCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["admin"]>



  export type AdminSelectScalar = {
    id?: boolean
    username?: boolean
    password?: boolean
    role?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type AdminOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "username" | "password" | "role" | "createdAt" | "updatedAt", ExtArgs["result"]["admin"]>
  export type AdminInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    posts?: boolean | Admin$postsArgs<ExtArgs>
    blogPosts?: boolean | Admin$blogPostsArgs<ExtArgs>
    _count?: boolean | AdminCountOutputTypeDefaultArgs<ExtArgs>
  }

  export type $AdminPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Admin"
    objects: {
      posts: Prisma.$PostPayload<ExtArgs>[]
      blogPosts: Prisma.$BlogPostPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      username: string
      password: string
      role: string
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["admin"]>
    composites: {}
  }

  type AdminGetPayload<S extends boolean | null | undefined | AdminDefaultArgs> = $Result.GetResult<Prisma.$AdminPayload, S>

  type AdminCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<AdminFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: AdminCountAggregateInputType | true
    }

  export interface AdminDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Admin'], meta: { name: 'Admin' } }
    /**
     * Find zero or one Admin that matches the filter.
     * @param {AdminFindUniqueArgs} args - Arguments to find a Admin
     * @example
     * // Get one Admin
     * const admin = await prisma.admin.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends AdminFindUniqueArgs>(args: SelectSubset<T, AdminFindUniqueArgs<ExtArgs>>): Prisma__AdminClient<$Result.GetResult<Prisma.$AdminPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Admin that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {AdminFindUniqueOrThrowArgs} args - Arguments to find a Admin
     * @example
     * // Get one Admin
     * const admin = await prisma.admin.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends AdminFindUniqueOrThrowArgs>(args: SelectSubset<T, AdminFindUniqueOrThrowArgs<ExtArgs>>): Prisma__AdminClient<$Result.GetResult<Prisma.$AdminPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Admin that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AdminFindFirstArgs} args - Arguments to find a Admin
     * @example
     * // Get one Admin
     * const admin = await prisma.admin.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends AdminFindFirstArgs>(args?: SelectSubset<T, AdminFindFirstArgs<ExtArgs>>): Prisma__AdminClient<$Result.GetResult<Prisma.$AdminPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Admin that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AdminFindFirstOrThrowArgs} args - Arguments to find a Admin
     * @example
     * // Get one Admin
     * const admin = await prisma.admin.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends AdminFindFirstOrThrowArgs>(args?: SelectSubset<T, AdminFindFirstOrThrowArgs<ExtArgs>>): Prisma__AdminClient<$Result.GetResult<Prisma.$AdminPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Admins that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AdminFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Admins
     * const admins = await prisma.admin.findMany()
     * 
     * // Get first 10 Admins
     * const admins = await prisma.admin.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const adminWithIdOnly = await prisma.admin.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends AdminFindManyArgs>(args?: SelectSubset<T, AdminFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AdminPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Admin.
     * @param {AdminCreateArgs} args - Arguments to create a Admin.
     * @example
     * // Create one Admin
     * const Admin = await prisma.admin.create({
     *   data: {
     *     // ... data to create a Admin
     *   }
     * })
     * 
     */
    create<T extends AdminCreateArgs>(args: SelectSubset<T, AdminCreateArgs<ExtArgs>>): Prisma__AdminClient<$Result.GetResult<Prisma.$AdminPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Admins.
     * @param {AdminCreateManyArgs} args - Arguments to create many Admins.
     * @example
     * // Create many Admins
     * const admin = await prisma.admin.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends AdminCreateManyArgs>(args?: SelectSubset<T, AdminCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a Admin.
     * @param {AdminDeleteArgs} args - Arguments to delete one Admin.
     * @example
     * // Delete one Admin
     * const Admin = await prisma.admin.delete({
     *   where: {
     *     // ... filter to delete one Admin
     *   }
     * })
     * 
     */
    delete<T extends AdminDeleteArgs>(args: SelectSubset<T, AdminDeleteArgs<ExtArgs>>): Prisma__AdminClient<$Result.GetResult<Prisma.$AdminPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Admin.
     * @param {AdminUpdateArgs} args - Arguments to update one Admin.
     * @example
     * // Update one Admin
     * const admin = await prisma.admin.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends AdminUpdateArgs>(args: SelectSubset<T, AdminUpdateArgs<ExtArgs>>): Prisma__AdminClient<$Result.GetResult<Prisma.$AdminPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Admins.
     * @param {AdminDeleteManyArgs} args - Arguments to filter Admins to delete.
     * @example
     * // Delete a few Admins
     * const { count } = await prisma.admin.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends AdminDeleteManyArgs>(args?: SelectSubset<T, AdminDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Admins.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AdminUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Admins
     * const admin = await prisma.admin.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends AdminUpdateManyArgs>(args: SelectSubset<T, AdminUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Admin.
     * @param {AdminUpsertArgs} args - Arguments to update or create a Admin.
     * @example
     * // Update or create a Admin
     * const admin = await prisma.admin.upsert({
     *   create: {
     *     // ... data to create a Admin
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Admin we want to update
     *   }
     * })
     */
    upsert<T extends AdminUpsertArgs>(args: SelectSubset<T, AdminUpsertArgs<ExtArgs>>): Prisma__AdminClient<$Result.GetResult<Prisma.$AdminPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Admins.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AdminCountArgs} args - Arguments to filter Admins to count.
     * @example
     * // Count the number of Admins
     * const count = await prisma.admin.count({
     *   where: {
     *     // ... the filter for the Admins we want to count
     *   }
     * })
    **/
    count<T extends AdminCountArgs>(
      args?: Subset<T, AdminCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], AdminCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Admin.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AdminAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends AdminAggregateArgs>(args: Subset<T, AdminAggregateArgs>): Prisma.PrismaPromise<GetAdminAggregateType<T>>

    /**
     * Group by Admin.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AdminGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends AdminGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: AdminGroupByArgs['orderBy'] }
        : { orderBy?: AdminGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, AdminGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetAdminGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Admin model
   */
  readonly fields: AdminFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Admin.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__AdminClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    posts<T extends Admin$postsArgs<ExtArgs> = {}>(args?: Subset<T, Admin$postsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    blogPosts<T extends Admin$blogPostsArgs<ExtArgs> = {}>(args?: Subset<T, Admin$blogPostsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BlogPostPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Admin model
   */
  interface AdminFieldRefs {
    readonly id: FieldRef<"Admin", 'String'>
    readonly username: FieldRef<"Admin", 'String'>
    readonly password: FieldRef<"Admin", 'String'>
    readonly role: FieldRef<"Admin", 'String'>
    readonly createdAt: FieldRef<"Admin", 'DateTime'>
    readonly updatedAt: FieldRef<"Admin", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Admin findUnique
   */
  export type AdminFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Admin
     */
    select?: AdminSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Admin
     */
    omit?: AdminOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AdminInclude<ExtArgs> | null
    /**
     * Filter, which Admin to fetch.
     */
    where: AdminWhereUniqueInput
  }

  /**
   * Admin findUniqueOrThrow
   */
  export type AdminFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Admin
     */
    select?: AdminSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Admin
     */
    omit?: AdminOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AdminInclude<ExtArgs> | null
    /**
     * Filter, which Admin to fetch.
     */
    where: AdminWhereUniqueInput
  }

  /**
   * Admin findFirst
   */
  export type AdminFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Admin
     */
    select?: AdminSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Admin
     */
    omit?: AdminOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AdminInclude<ExtArgs> | null
    /**
     * Filter, which Admin to fetch.
     */
    where?: AdminWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Admins to fetch.
     */
    orderBy?: AdminOrderByWithRelationInput | AdminOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Admins.
     */
    cursor?: AdminWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Admins from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Admins.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Admins.
     */
    distinct?: AdminScalarFieldEnum | AdminScalarFieldEnum[]
  }

  /**
   * Admin findFirstOrThrow
   */
  export type AdminFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Admin
     */
    select?: AdminSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Admin
     */
    omit?: AdminOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AdminInclude<ExtArgs> | null
    /**
     * Filter, which Admin to fetch.
     */
    where?: AdminWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Admins to fetch.
     */
    orderBy?: AdminOrderByWithRelationInput | AdminOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Admins.
     */
    cursor?: AdminWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Admins from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Admins.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Admins.
     */
    distinct?: AdminScalarFieldEnum | AdminScalarFieldEnum[]
  }

  /**
   * Admin findMany
   */
  export type AdminFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Admin
     */
    select?: AdminSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Admin
     */
    omit?: AdminOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AdminInclude<ExtArgs> | null
    /**
     * Filter, which Admins to fetch.
     */
    where?: AdminWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Admins to fetch.
     */
    orderBy?: AdminOrderByWithRelationInput | AdminOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Admins.
     */
    cursor?: AdminWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Admins from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Admins.
     */
    skip?: number
    distinct?: AdminScalarFieldEnum | AdminScalarFieldEnum[]
  }

  /**
   * Admin create
   */
  export type AdminCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Admin
     */
    select?: AdminSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Admin
     */
    omit?: AdminOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AdminInclude<ExtArgs> | null
    /**
     * The data needed to create a Admin.
     */
    data: XOR<AdminCreateInput, AdminUncheckedCreateInput>
  }

  /**
   * Admin createMany
   */
  export type AdminCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Admins.
     */
    data: AdminCreateManyInput | AdminCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Admin update
   */
  export type AdminUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Admin
     */
    select?: AdminSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Admin
     */
    omit?: AdminOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AdminInclude<ExtArgs> | null
    /**
     * The data needed to update a Admin.
     */
    data: XOR<AdminUpdateInput, AdminUncheckedUpdateInput>
    /**
     * Choose, which Admin to update.
     */
    where: AdminWhereUniqueInput
  }

  /**
   * Admin updateMany
   */
  export type AdminUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Admins.
     */
    data: XOR<AdminUpdateManyMutationInput, AdminUncheckedUpdateManyInput>
    /**
     * Filter which Admins to update
     */
    where?: AdminWhereInput
    /**
     * Limit how many Admins to update.
     */
    limit?: number
  }

  /**
   * Admin upsert
   */
  export type AdminUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Admin
     */
    select?: AdminSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Admin
     */
    omit?: AdminOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AdminInclude<ExtArgs> | null
    /**
     * The filter to search for the Admin to update in case it exists.
     */
    where: AdminWhereUniqueInput
    /**
     * In case the Admin found by the `where` argument doesn't exist, create a new Admin with this data.
     */
    create: XOR<AdminCreateInput, AdminUncheckedCreateInput>
    /**
     * In case the Admin was found with the provided `where` argument, update it with this data.
     */
    update: XOR<AdminUpdateInput, AdminUncheckedUpdateInput>
  }

  /**
   * Admin delete
   */
  export type AdminDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Admin
     */
    select?: AdminSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Admin
     */
    omit?: AdminOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AdminInclude<ExtArgs> | null
    /**
     * Filter which Admin to delete.
     */
    where: AdminWhereUniqueInput
  }

  /**
   * Admin deleteMany
   */
  export type AdminDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Admins to delete
     */
    where?: AdminWhereInput
    /**
     * Limit how many Admins to delete.
     */
    limit?: number
  }

  /**
   * Admin.posts
   */
  export type Admin$postsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Post
     */
    omit?: PostOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PostInclude<ExtArgs> | null
    where?: PostWhereInput
    orderBy?: PostOrderByWithRelationInput | PostOrderByWithRelationInput[]
    cursor?: PostWhereUniqueInput
    take?: number
    skip?: number
    distinct?: PostScalarFieldEnum | PostScalarFieldEnum[]
  }

  /**
   * Admin.blogPosts
   */
  export type Admin$blogPostsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BlogPost
     */
    select?: BlogPostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BlogPost
     */
    omit?: BlogPostOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlogPostInclude<ExtArgs> | null
    where?: BlogPostWhereInput
    orderBy?: BlogPostOrderByWithRelationInput | BlogPostOrderByWithRelationInput[]
    cursor?: BlogPostWhereUniqueInput
    take?: number
    skip?: number
    distinct?: BlogPostScalarFieldEnum | BlogPostScalarFieldEnum[]
  }

  /**
   * Admin without action
   */
  export type AdminDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Admin
     */
    select?: AdminSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Admin
     */
    omit?: AdminOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AdminInclude<ExtArgs> | null
  }


  /**
   * Model Post
   */

  export type AggregatePost = {
    _count: PostCountAggregateOutputType | null
    _avg: PostAvgAggregateOutputType | null
    _sum: PostSumAggregateOutputType | null
    _min: PostMinAggregateOutputType | null
    _max: PostMaxAggregateOutputType | null
  }

  export type PostAvgAggregateOutputType = {
    views: number | null
  }

  export type PostSumAggregateOutputType = {
    views: number | null
  }

  export type PostMinAggregateOutputType = {
    id: string | null
    title: string | null
    slug: string | null
    content: string | null
    authorId: string | null
    views: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type PostMaxAggregateOutputType = {
    id: string | null
    title: string | null
    slug: string | null
    content: string | null
    authorId: string | null
    views: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type PostCountAggregateOutputType = {
    id: number
    title: number
    slug: number
    content: number
    authorId: number
    views: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type PostAvgAggregateInputType = {
    views?: true
  }

  export type PostSumAggregateInputType = {
    views?: true
  }

  export type PostMinAggregateInputType = {
    id?: true
    title?: true
    slug?: true
    content?: true
    authorId?: true
    views?: true
    createdAt?: true
    updatedAt?: true
  }

  export type PostMaxAggregateInputType = {
    id?: true
    title?: true
    slug?: true
    content?: true
    authorId?: true
    views?: true
    createdAt?: true
    updatedAt?: true
  }

  export type PostCountAggregateInputType = {
    id?: true
    title?: true
    slug?: true
    content?: true
    authorId?: true
    views?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type PostAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Post to aggregate.
     */
    where?: PostWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Posts to fetch.
     */
    orderBy?: PostOrderByWithRelationInput | PostOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PostWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Posts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Posts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Posts
    **/
    _count?: true | PostCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: PostAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: PostSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PostMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PostMaxAggregateInputType
  }

  export type GetPostAggregateType<T extends PostAggregateArgs> = {
        [P in keyof T & keyof AggregatePost]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePost[P]>
      : GetScalarType<T[P], AggregatePost[P]>
  }




  export type PostGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PostWhereInput
    orderBy?: PostOrderByWithAggregationInput | PostOrderByWithAggregationInput[]
    by: PostScalarFieldEnum[] | PostScalarFieldEnum
    having?: PostScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PostCountAggregateInputType | true
    _avg?: PostAvgAggregateInputType
    _sum?: PostSumAggregateInputType
    _min?: PostMinAggregateInputType
    _max?: PostMaxAggregateInputType
  }

  export type PostGroupByOutputType = {
    id: string
    title: string
    slug: string
    content: string
    authorId: string
    views: number
    createdAt: Date
    updatedAt: Date
    _count: PostCountAggregateOutputType | null
    _avg: PostAvgAggregateOutputType | null
    _sum: PostSumAggregateOutputType | null
    _min: PostMinAggregateOutputType | null
    _max: PostMaxAggregateOutputType | null
  }

  type GetPostGroupByPayload<T extends PostGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PostGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PostGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PostGroupByOutputType[P]>
            : GetScalarType<T[P], PostGroupByOutputType[P]>
        }
      >
    >


  export type PostSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    slug?: boolean
    content?: boolean
    authorId?: boolean
    views?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    author?: boolean | AdminDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["post"]>



  export type PostSelectScalar = {
    id?: boolean
    title?: boolean
    slug?: boolean
    content?: boolean
    authorId?: boolean
    views?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type PostOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "title" | "slug" | "content" | "authorId" | "views" | "createdAt" | "updatedAt", ExtArgs["result"]["post"]>
  export type PostInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    author?: boolean | AdminDefaultArgs<ExtArgs>
  }

  export type $PostPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Post"
    objects: {
      author: Prisma.$AdminPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      title: string
      slug: string
      content: string
      authorId: string
      views: number
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["post"]>
    composites: {}
  }

  type PostGetPayload<S extends boolean | null | undefined | PostDefaultArgs> = $Result.GetResult<Prisma.$PostPayload, S>

  type PostCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<PostFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: PostCountAggregateInputType | true
    }

  export interface PostDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Post'], meta: { name: 'Post' } }
    /**
     * Find zero or one Post that matches the filter.
     * @param {PostFindUniqueArgs} args - Arguments to find a Post
     * @example
     * // Get one Post
     * const post = await prisma.post.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PostFindUniqueArgs>(args: SelectSubset<T, PostFindUniqueArgs<ExtArgs>>): Prisma__PostClient<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Post that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {PostFindUniqueOrThrowArgs} args - Arguments to find a Post
     * @example
     * // Get one Post
     * const post = await prisma.post.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PostFindUniqueOrThrowArgs>(args: SelectSubset<T, PostFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PostClient<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Post that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PostFindFirstArgs} args - Arguments to find a Post
     * @example
     * // Get one Post
     * const post = await prisma.post.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PostFindFirstArgs>(args?: SelectSubset<T, PostFindFirstArgs<ExtArgs>>): Prisma__PostClient<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Post that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PostFindFirstOrThrowArgs} args - Arguments to find a Post
     * @example
     * // Get one Post
     * const post = await prisma.post.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PostFindFirstOrThrowArgs>(args?: SelectSubset<T, PostFindFirstOrThrowArgs<ExtArgs>>): Prisma__PostClient<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Posts that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PostFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Posts
     * const posts = await prisma.post.findMany()
     * 
     * // Get first 10 Posts
     * const posts = await prisma.post.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const postWithIdOnly = await prisma.post.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends PostFindManyArgs>(args?: SelectSubset<T, PostFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Post.
     * @param {PostCreateArgs} args - Arguments to create a Post.
     * @example
     * // Create one Post
     * const Post = await prisma.post.create({
     *   data: {
     *     // ... data to create a Post
     *   }
     * })
     * 
     */
    create<T extends PostCreateArgs>(args: SelectSubset<T, PostCreateArgs<ExtArgs>>): Prisma__PostClient<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Posts.
     * @param {PostCreateManyArgs} args - Arguments to create many Posts.
     * @example
     * // Create many Posts
     * const post = await prisma.post.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PostCreateManyArgs>(args?: SelectSubset<T, PostCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a Post.
     * @param {PostDeleteArgs} args - Arguments to delete one Post.
     * @example
     * // Delete one Post
     * const Post = await prisma.post.delete({
     *   where: {
     *     // ... filter to delete one Post
     *   }
     * })
     * 
     */
    delete<T extends PostDeleteArgs>(args: SelectSubset<T, PostDeleteArgs<ExtArgs>>): Prisma__PostClient<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Post.
     * @param {PostUpdateArgs} args - Arguments to update one Post.
     * @example
     * // Update one Post
     * const post = await prisma.post.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PostUpdateArgs>(args: SelectSubset<T, PostUpdateArgs<ExtArgs>>): Prisma__PostClient<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Posts.
     * @param {PostDeleteManyArgs} args - Arguments to filter Posts to delete.
     * @example
     * // Delete a few Posts
     * const { count } = await prisma.post.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PostDeleteManyArgs>(args?: SelectSubset<T, PostDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Posts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PostUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Posts
     * const post = await prisma.post.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PostUpdateManyArgs>(args: SelectSubset<T, PostUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Post.
     * @param {PostUpsertArgs} args - Arguments to update or create a Post.
     * @example
     * // Update or create a Post
     * const post = await prisma.post.upsert({
     *   create: {
     *     // ... data to create a Post
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Post we want to update
     *   }
     * })
     */
    upsert<T extends PostUpsertArgs>(args: SelectSubset<T, PostUpsertArgs<ExtArgs>>): Prisma__PostClient<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Posts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PostCountArgs} args - Arguments to filter Posts to count.
     * @example
     * // Count the number of Posts
     * const count = await prisma.post.count({
     *   where: {
     *     // ... the filter for the Posts we want to count
     *   }
     * })
    **/
    count<T extends PostCountArgs>(
      args?: Subset<T, PostCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PostCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Post.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PostAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends PostAggregateArgs>(args: Subset<T, PostAggregateArgs>): Prisma.PrismaPromise<GetPostAggregateType<T>>

    /**
     * Group by Post.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PostGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends PostGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PostGroupByArgs['orderBy'] }
        : { orderBy?: PostGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, PostGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPostGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Post model
   */
  readonly fields: PostFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Post.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PostClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    author<T extends AdminDefaultArgs<ExtArgs> = {}>(args?: Subset<T, AdminDefaultArgs<ExtArgs>>): Prisma__AdminClient<$Result.GetResult<Prisma.$AdminPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Post model
   */
  interface PostFieldRefs {
    readonly id: FieldRef<"Post", 'String'>
    readonly title: FieldRef<"Post", 'String'>
    readonly slug: FieldRef<"Post", 'String'>
    readonly content: FieldRef<"Post", 'String'>
    readonly authorId: FieldRef<"Post", 'String'>
    readonly views: FieldRef<"Post", 'Int'>
    readonly createdAt: FieldRef<"Post", 'DateTime'>
    readonly updatedAt: FieldRef<"Post", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Post findUnique
   */
  export type PostFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Post
     */
    omit?: PostOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PostInclude<ExtArgs> | null
    /**
     * Filter, which Post to fetch.
     */
    where: PostWhereUniqueInput
  }

  /**
   * Post findUniqueOrThrow
   */
  export type PostFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Post
     */
    omit?: PostOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PostInclude<ExtArgs> | null
    /**
     * Filter, which Post to fetch.
     */
    where: PostWhereUniqueInput
  }

  /**
   * Post findFirst
   */
  export type PostFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Post
     */
    omit?: PostOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PostInclude<ExtArgs> | null
    /**
     * Filter, which Post to fetch.
     */
    where?: PostWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Posts to fetch.
     */
    orderBy?: PostOrderByWithRelationInput | PostOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Posts.
     */
    cursor?: PostWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Posts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Posts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Posts.
     */
    distinct?: PostScalarFieldEnum | PostScalarFieldEnum[]
  }

  /**
   * Post findFirstOrThrow
   */
  export type PostFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Post
     */
    omit?: PostOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PostInclude<ExtArgs> | null
    /**
     * Filter, which Post to fetch.
     */
    where?: PostWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Posts to fetch.
     */
    orderBy?: PostOrderByWithRelationInput | PostOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Posts.
     */
    cursor?: PostWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Posts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Posts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Posts.
     */
    distinct?: PostScalarFieldEnum | PostScalarFieldEnum[]
  }

  /**
   * Post findMany
   */
  export type PostFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Post
     */
    omit?: PostOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PostInclude<ExtArgs> | null
    /**
     * Filter, which Posts to fetch.
     */
    where?: PostWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Posts to fetch.
     */
    orderBy?: PostOrderByWithRelationInput | PostOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Posts.
     */
    cursor?: PostWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Posts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Posts.
     */
    skip?: number
    distinct?: PostScalarFieldEnum | PostScalarFieldEnum[]
  }

  /**
   * Post create
   */
  export type PostCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Post
     */
    omit?: PostOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PostInclude<ExtArgs> | null
    /**
     * The data needed to create a Post.
     */
    data: XOR<PostCreateInput, PostUncheckedCreateInput>
  }

  /**
   * Post createMany
   */
  export type PostCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Posts.
     */
    data: PostCreateManyInput | PostCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Post update
   */
  export type PostUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Post
     */
    omit?: PostOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PostInclude<ExtArgs> | null
    /**
     * The data needed to update a Post.
     */
    data: XOR<PostUpdateInput, PostUncheckedUpdateInput>
    /**
     * Choose, which Post to update.
     */
    where: PostWhereUniqueInput
  }

  /**
   * Post updateMany
   */
  export type PostUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Posts.
     */
    data: XOR<PostUpdateManyMutationInput, PostUncheckedUpdateManyInput>
    /**
     * Filter which Posts to update
     */
    where?: PostWhereInput
    /**
     * Limit how many Posts to update.
     */
    limit?: number
  }

  /**
   * Post upsert
   */
  export type PostUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Post
     */
    omit?: PostOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PostInclude<ExtArgs> | null
    /**
     * The filter to search for the Post to update in case it exists.
     */
    where: PostWhereUniqueInput
    /**
     * In case the Post found by the `where` argument doesn't exist, create a new Post with this data.
     */
    create: XOR<PostCreateInput, PostUncheckedCreateInput>
    /**
     * In case the Post was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PostUpdateInput, PostUncheckedUpdateInput>
  }

  /**
   * Post delete
   */
  export type PostDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Post
     */
    omit?: PostOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PostInclude<ExtArgs> | null
    /**
     * Filter which Post to delete.
     */
    where: PostWhereUniqueInput
  }

  /**
   * Post deleteMany
   */
  export type PostDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Posts to delete
     */
    where?: PostWhereInput
    /**
     * Limit how many Posts to delete.
     */
    limit?: number
  }

  /**
   * Post without action
   */
  export type PostDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Post
     */
    omit?: PostOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PostInclude<ExtArgs> | null
  }


  /**
   * Model BlogPost
   */

  export type AggregateBlogPost = {
    _count: BlogPostCountAggregateOutputType | null
    _avg: BlogPostAvgAggregateOutputType | null
    _sum: BlogPostSumAggregateOutputType | null
    _min: BlogPostMinAggregateOutputType | null
    _max: BlogPostMaxAggregateOutputType | null
  }

  export type BlogPostAvgAggregateOutputType = {
    views: number | null
  }

  export type BlogPostSumAggregateOutputType = {
    views: number | null
  }

  export type BlogPostMinAggregateOutputType = {
    id: string | null
    title: string | null
    slug: string | null
    content: string | null
    category: string | null
    tags: string | null
    status: string | null
    featuredImg: string | null
    views: number | null
    authorId: string | null
    memberId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type BlogPostMaxAggregateOutputType = {
    id: string | null
    title: string | null
    slug: string | null
    content: string | null
    category: string | null
    tags: string | null
    status: string | null
    featuredImg: string | null
    views: number | null
    authorId: string | null
    memberId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type BlogPostCountAggregateOutputType = {
    id: number
    title: number
    slug: number
    content: number
    category: number
    tags: number
    status: number
    featuredImg: number
    views: number
    authorId: number
    memberId: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type BlogPostAvgAggregateInputType = {
    views?: true
  }

  export type BlogPostSumAggregateInputType = {
    views?: true
  }

  export type BlogPostMinAggregateInputType = {
    id?: true
    title?: true
    slug?: true
    content?: true
    category?: true
    tags?: true
    status?: true
    featuredImg?: true
    views?: true
    authorId?: true
    memberId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type BlogPostMaxAggregateInputType = {
    id?: true
    title?: true
    slug?: true
    content?: true
    category?: true
    tags?: true
    status?: true
    featuredImg?: true
    views?: true
    authorId?: true
    memberId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type BlogPostCountAggregateInputType = {
    id?: true
    title?: true
    slug?: true
    content?: true
    category?: true
    tags?: true
    status?: true
    featuredImg?: true
    views?: true
    authorId?: true
    memberId?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type BlogPostAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which BlogPost to aggregate.
     */
    where?: BlogPostWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of BlogPosts to fetch.
     */
    orderBy?: BlogPostOrderByWithRelationInput | BlogPostOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: BlogPostWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` BlogPosts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` BlogPosts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned BlogPosts
    **/
    _count?: true | BlogPostCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: BlogPostAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: BlogPostSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: BlogPostMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: BlogPostMaxAggregateInputType
  }

  export type GetBlogPostAggregateType<T extends BlogPostAggregateArgs> = {
        [P in keyof T & keyof AggregateBlogPost]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateBlogPost[P]>
      : GetScalarType<T[P], AggregateBlogPost[P]>
  }




  export type BlogPostGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: BlogPostWhereInput
    orderBy?: BlogPostOrderByWithAggregationInput | BlogPostOrderByWithAggregationInput[]
    by: BlogPostScalarFieldEnum[] | BlogPostScalarFieldEnum
    having?: BlogPostScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: BlogPostCountAggregateInputType | true
    _avg?: BlogPostAvgAggregateInputType
    _sum?: BlogPostSumAggregateInputType
    _min?: BlogPostMinAggregateInputType
    _max?: BlogPostMaxAggregateInputType
  }

  export type BlogPostGroupByOutputType = {
    id: string
    title: string
    slug: string
    content: string
    category: string
    tags: string
    status: string
    featuredImg: string | null
    views: number
    authorId: string | null
    memberId: string | null
    createdAt: Date
    updatedAt: Date
    _count: BlogPostCountAggregateOutputType | null
    _avg: BlogPostAvgAggregateOutputType | null
    _sum: BlogPostSumAggregateOutputType | null
    _min: BlogPostMinAggregateOutputType | null
    _max: BlogPostMaxAggregateOutputType | null
  }

  type GetBlogPostGroupByPayload<T extends BlogPostGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<BlogPostGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof BlogPostGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], BlogPostGroupByOutputType[P]>
            : GetScalarType<T[P], BlogPostGroupByOutputType[P]>
        }
      >
    >


  export type BlogPostSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    slug?: boolean
    content?: boolean
    category?: boolean
    tags?: boolean
    status?: boolean
    featuredImg?: boolean
    views?: boolean
    authorId?: boolean
    memberId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    author?: boolean | BlogPost$authorArgs<ExtArgs>
    memberAuthor?: boolean | BlogPost$memberAuthorArgs<ExtArgs>
    comments?: boolean | BlogPost$commentsArgs<ExtArgs>
    likes?: boolean | BlogPost$likesArgs<ExtArgs>
    _count?: boolean | BlogPostCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["blogPost"]>



  export type BlogPostSelectScalar = {
    id?: boolean
    title?: boolean
    slug?: boolean
    content?: boolean
    category?: boolean
    tags?: boolean
    status?: boolean
    featuredImg?: boolean
    views?: boolean
    authorId?: boolean
    memberId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type BlogPostOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "title" | "slug" | "content" | "category" | "tags" | "status" | "featuredImg" | "views" | "authorId" | "memberId" | "createdAt" | "updatedAt", ExtArgs["result"]["blogPost"]>
  export type BlogPostInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    author?: boolean | BlogPost$authorArgs<ExtArgs>
    memberAuthor?: boolean | BlogPost$memberAuthorArgs<ExtArgs>
    comments?: boolean | BlogPost$commentsArgs<ExtArgs>
    likes?: boolean | BlogPost$likesArgs<ExtArgs>
    _count?: boolean | BlogPostCountOutputTypeDefaultArgs<ExtArgs>
  }

  export type $BlogPostPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "BlogPost"
    objects: {
      author: Prisma.$AdminPayload<ExtArgs> | null
      memberAuthor: Prisma.$MemberPayload<ExtArgs> | null
      comments: Prisma.$BlogCommentPayload<ExtArgs>[]
      likes: Prisma.$BlogLikePayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      title: string
      slug: string
      content: string
      category: string
      tags: string
      status: string
      featuredImg: string | null
      views: number
      authorId: string | null
      memberId: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["blogPost"]>
    composites: {}
  }

  type BlogPostGetPayload<S extends boolean | null | undefined | BlogPostDefaultArgs> = $Result.GetResult<Prisma.$BlogPostPayload, S>

  type BlogPostCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<BlogPostFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: BlogPostCountAggregateInputType | true
    }

  export interface BlogPostDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['BlogPost'], meta: { name: 'BlogPost' } }
    /**
     * Find zero or one BlogPost that matches the filter.
     * @param {BlogPostFindUniqueArgs} args - Arguments to find a BlogPost
     * @example
     * // Get one BlogPost
     * const blogPost = await prisma.blogPost.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends BlogPostFindUniqueArgs>(args: SelectSubset<T, BlogPostFindUniqueArgs<ExtArgs>>): Prisma__BlogPostClient<$Result.GetResult<Prisma.$BlogPostPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one BlogPost that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {BlogPostFindUniqueOrThrowArgs} args - Arguments to find a BlogPost
     * @example
     * // Get one BlogPost
     * const blogPost = await prisma.blogPost.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends BlogPostFindUniqueOrThrowArgs>(args: SelectSubset<T, BlogPostFindUniqueOrThrowArgs<ExtArgs>>): Prisma__BlogPostClient<$Result.GetResult<Prisma.$BlogPostPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first BlogPost that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BlogPostFindFirstArgs} args - Arguments to find a BlogPost
     * @example
     * // Get one BlogPost
     * const blogPost = await prisma.blogPost.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends BlogPostFindFirstArgs>(args?: SelectSubset<T, BlogPostFindFirstArgs<ExtArgs>>): Prisma__BlogPostClient<$Result.GetResult<Prisma.$BlogPostPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first BlogPost that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BlogPostFindFirstOrThrowArgs} args - Arguments to find a BlogPost
     * @example
     * // Get one BlogPost
     * const blogPost = await prisma.blogPost.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends BlogPostFindFirstOrThrowArgs>(args?: SelectSubset<T, BlogPostFindFirstOrThrowArgs<ExtArgs>>): Prisma__BlogPostClient<$Result.GetResult<Prisma.$BlogPostPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more BlogPosts that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BlogPostFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all BlogPosts
     * const blogPosts = await prisma.blogPost.findMany()
     * 
     * // Get first 10 BlogPosts
     * const blogPosts = await prisma.blogPost.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const blogPostWithIdOnly = await prisma.blogPost.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends BlogPostFindManyArgs>(args?: SelectSubset<T, BlogPostFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BlogPostPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a BlogPost.
     * @param {BlogPostCreateArgs} args - Arguments to create a BlogPost.
     * @example
     * // Create one BlogPost
     * const BlogPost = await prisma.blogPost.create({
     *   data: {
     *     // ... data to create a BlogPost
     *   }
     * })
     * 
     */
    create<T extends BlogPostCreateArgs>(args: SelectSubset<T, BlogPostCreateArgs<ExtArgs>>): Prisma__BlogPostClient<$Result.GetResult<Prisma.$BlogPostPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many BlogPosts.
     * @param {BlogPostCreateManyArgs} args - Arguments to create many BlogPosts.
     * @example
     * // Create many BlogPosts
     * const blogPost = await prisma.blogPost.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends BlogPostCreateManyArgs>(args?: SelectSubset<T, BlogPostCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a BlogPost.
     * @param {BlogPostDeleteArgs} args - Arguments to delete one BlogPost.
     * @example
     * // Delete one BlogPost
     * const BlogPost = await prisma.blogPost.delete({
     *   where: {
     *     // ... filter to delete one BlogPost
     *   }
     * })
     * 
     */
    delete<T extends BlogPostDeleteArgs>(args: SelectSubset<T, BlogPostDeleteArgs<ExtArgs>>): Prisma__BlogPostClient<$Result.GetResult<Prisma.$BlogPostPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one BlogPost.
     * @param {BlogPostUpdateArgs} args - Arguments to update one BlogPost.
     * @example
     * // Update one BlogPost
     * const blogPost = await prisma.blogPost.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends BlogPostUpdateArgs>(args: SelectSubset<T, BlogPostUpdateArgs<ExtArgs>>): Prisma__BlogPostClient<$Result.GetResult<Prisma.$BlogPostPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more BlogPosts.
     * @param {BlogPostDeleteManyArgs} args - Arguments to filter BlogPosts to delete.
     * @example
     * // Delete a few BlogPosts
     * const { count } = await prisma.blogPost.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends BlogPostDeleteManyArgs>(args?: SelectSubset<T, BlogPostDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more BlogPosts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BlogPostUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many BlogPosts
     * const blogPost = await prisma.blogPost.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends BlogPostUpdateManyArgs>(args: SelectSubset<T, BlogPostUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one BlogPost.
     * @param {BlogPostUpsertArgs} args - Arguments to update or create a BlogPost.
     * @example
     * // Update or create a BlogPost
     * const blogPost = await prisma.blogPost.upsert({
     *   create: {
     *     // ... data to create a BlogPost
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the BlogPost we want to update
     *   }
     * })
     */
    upsert<T extends BlogPostUpsertArgs>(args: SelectSubset<T, BlogPostUpsertArgs<ExtArgs>>): Prisma__BlogPostClient<$Result.GetResult<Prisma.$BlogPostPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of BlogPosts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BlogPostCountArgs} args - Arguments to filter BlogPosts to count.
     * @example
     * // Count the number of BlogPosts
     * const count = await prisma.blogPost.count({
     *   where: {
     *     // ... the filter for the BlogPosts we want to count
     *   }
     * })
    **/
    count<T extends BlogPostCountArgs>(
      args?: Subset<T, BlogPostCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], BlogPostCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a BlogPost.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BlogPostAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends BlogPostAggregateArgs>(args: Subset<T, BlogPostAggregateArgs>): Prisma.PrismaPromise<GetBlogPostAggregateType<T>>

    /**
     * Group by BlogPost.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BlogPostGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends BlogPostGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: BlogPostGroupByArgs['orderBy'] }
        : { orderBy?: BlogPostGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, BlogPostGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetBlogPostGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the BlogPost model
   */
  readonly fields: BlogPostFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for BlogPost.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__BlogPostClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    author<T extends BlogPost$authorArgs<ExtArgs> = {}>(args?: Subset<T, BlogPost$authorArgs<ExtArgs>>): Prisma__AdminClient<$Result.GetResult<Prisma.$AdminPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    memberAuthor<T extends BlogPost$memberAuthorArgs<ExtArgs> = {}>(args?: Subset<T, BlogPost$memberAuthorArgs<ExtArgs>>): Prisma__MemberClient<$Result.GetResult<Prisma.$MemberPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    comments<T extends BlogPost$commentsArgs<ExtArgs> = {}>(args?: Subset<T, BlogPost$commentsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BlogCommentPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    likes<T extends BlogPost$likesArgs<ExtArgs> = {}>(args?: Subset<T, BlogPost$likesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BlogLikePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the BlogPost model
   */
  interface BlogPostFieldRefs {
    readonly id: FieldRef<"BlogPost", 'String'>
    readonly title: FieldRef<"BlogPost", 'String'>
    readonly slug: FieldRef<"BlogPost", 'String'>
    readonly content: FieldRef<"BlogPost", 'String'>
    readonly category: FieldRef<"BlogPost", 'String'>
    readonly tags: FieldRef<"BlogPost", 'String'>
    readonly status: FieldRef<"BlogPost", 'String'>
    readonly featuredImg: FieldRef<"BlogPost", 'String'>
    readonly views: FieldRef<"BlogPost", 'Int'>
    readonly authorId: FieldRef<"BlogPost", 'String'>
    readonly memberId: FieldRef<"BlogPost", 'String'>
    readonly createdAt: FieldRef<"BlogPost", 'DateTime'>
    readonly updatedAt: FieldRef<"BlogPost", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * BlogPost findUnique
   */
  export type BlogPostFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BlogPost
     */
    select?: BlogPostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BlogPost
     */
    omit?: BlogPostOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlogPostInclude<ExtArgs> | null
    /**
     * Filter, which BlogPost to fetch.
     */
    where: BlogPostWhereUniqueInput
  }

  /**
   * BlogPost findUniqueOrThrow
   */
  export type BlogPostFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BlogPost
     */
    select?: BlogPostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BlogPost
     */
    omit?: BlogPostOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlogPostInclude<ExtArgs> | null
    /**
     * Filter, which BlogPost to fetch.
     */
    where: BlogPostWhereUniqueInput
  }

  /**
   * BlogPost findFirst
   */
  export type BlogPostFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BlogPost
     */
    select?: BlogPostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BlogPost
     */
    omit?: BlogPostOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlogPostInclude<ExtArgs> | null
    /**
     * Filter, which BlogPost to fetch.
     */
    where?: BlogPostWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of BlogPosts to fetch.
     */
    orderBy?: BlogPostOrderByWithRelationInput | BlogPostOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for BlogPosts.
     */
    cursor?: BlogPostWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` BlogPosts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` BlogPosts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of BlogPosts.
     */
    distinct?: BlogPostScalarFieldEnum | BlogPostScalarFieldEnum[]
  }

  /**
   * BlogPost findFirstOrThrow
   */
  export type BlogPostFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BlogPost
     */
    select?: BlogPostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BlogPost
     */
    omit?: BlogPostOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlogPostInclude<ExtArgs> | null
    /**
     * Filter, which BlogPost to fetch.
     */
    where?: BlogPostWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of BlogPosts to fetch.
     */
    orderBy?: BlogPostOrderByWithRelationInput | BlogPostOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for BlogPosts.
     */
    cursor?: BlogPostWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` BlogPosts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` BlogPosts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of BlogPosts.
     */
    distinct?: BlogPostScalarFieldEnum | BlogPostScalarFieldEnum[]
  }

  /**
   * BlogPost findMany
   */
  export type BlogPostFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BlogPost
     */
    select?: BlogPostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BlogPost
     */
    omit?: BlogPostOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlogPostInclude<ExtArgs> | null
    /**
     * Filter, which BlogPosts to fetch.
     */
    where?: BlogPostWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of BlogPosts to fetch.
     */
    orderBy?: BlogPostOrderByWithRelationInput | BlogPostOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing BlogPosts.
     */
    cursor?: BlogPostWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` BlogPosts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` BlogPosts.
     */
    skip?: number
    distinct?: BlogPostScalarFieldEnum | BlogPostScalarFieldEnum[]
  }

  /**
   * BlogPost create
   */
  export type BlogPostCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BlogPost
     */
    select?: BlogPostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BlogPost
     */
    omit?: BlogPostOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlogPostInclude<ExtArgs> | null
    /**
     * The data needed to create a BlogPost.
     */
    data: XOR<BlogPostCreateInput, BlogPostUncheckedCreateInput>
  }

  /**
   * BlogPost createMany
   */
  export type BlogPostCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many BlogPosts.
     */
    data: BlogPostCreateManyInput | BlogPostCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * BlogPost update
   */
  export type BlogPostUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BlogPost
     */
    select?: BlogPostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BlogPost
     */
    omit?: BlogPostOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlogPostInclude<ExtArgs> | null
    /**
     * The data needed to update a BlogPost.
     */
    data: XOR<BlogPostUpdateInput, BlogPostUncheckedUpdateInput>
    /**
     * Choose, which BlogPost to update.
     */
    where: BlogPostWhereUniqueInput
  }

  /**
   * BlogPost updateMany
   */
  export type BlogPostUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update BlogPosts.
     */
    data: XOR<BlogPostUpdateManyMutationInput, BlogPostUncheckedUpdateManyInput>
    /**
     * Filter which BlogPosts to update
     */
    where?: BlogPostWhereInput
    /**
     * Limit how many BlogPosts to update.
     */
    limit?: number
  }

  /**
   * BlogPost upsert
   */
  export type BlogPostUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BlogPost
     */
    select?: BlogPostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BlogPost
     */
    omit?: BlogPostOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlogPostInclude<ExtArgs> | null
    /**
     * The filter to search for the BlogPost to update in case it exists.
     */
    where: BlogPostWhereUniqueInput
    /**
     * In case the BlogPost found by the `where` argument doesn't exist, create a new BlogPost with this data.
     */
    create: XOR<BlogPostCreateInput, BlogPostUncheckedCreateInput>
    /**
     * In case the BlogPost was found with the provided `where` argument, update it with this data.
     */
    update: XOR<BlogPostUpdateInput, BlogPostUncheckedUpdateInput>
  }

  /**
   * BlogPost delete
   */
  export type BlogPostDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BlogPost
     */
    select?: BlogPostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BlogPost
     */
    omit?: BlogPostOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlogPostInclude<ExtArgs> | null
    /**
     * Filter which BlogPost to delete.
     */
    where: BlogPostWhereUniqueInput
  }

  /**
   * BlogPost deleteMany
   */
  export type BlogPostDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which BlogPosts to delete
     */
    where?: BlogPostWhereInput
    /**
     * Limit how many BlogPosts to delete.
     */
    limit?: number
  }

  /**
   * BlogPost.author
   */
  export type BlogPost$authorArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Admin
     */
    select?: AdminSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Admin
     */
    omit?: AdminOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AdminInclude<ExtArgs> | null
    where?: AdminWhereInput
  }

  /**
   * BlogPost.memberAuthor
   */
  export type BlogPost$memberAuthorArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Member
     */
    select?: MemberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Member
     */
    omit?: MemberOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MemberInclude<ExtArgs> | null
    where?: MemberWhereInput
  }

  /**
   * BlogPost.comments
   */
  export type BlogPost$commentsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BlogComment
     */
    select?: BlogCommentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BlogComment
     */
    omit?: BlogCommentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlogCommentInclude<ExtArgs> | null
    where?: BlogCommentWhereInput
    orderBy?: BlogCommentOrderByWithRelationInput | BlogCommentOrderByWithRelationInput[]
    cursor?: BlogCommentWhereUniqueInput
    take?: number
    skip?: number
    distinct?: BlogCommentScalarFieldEnum | BlogCommentScalarFieldEnum[]
  }

  /**
   * BlogPost.likes
   */
  export type BlogPost$likesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BlogLike
     */
    select?: BlogLikeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BlogLike
     */
    omit?: BlogLikeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlogLikeInclude<ExtArgs> | null
    where?: BlogLikeWhereInput
    orderBy?: BlogLikeOrderByWithRelationInput | BlogLikeOrderByWithRelationInput[]
    cursor?: BlogLikeWhereUniqueInput
    take?: number
    skip?: number
    distinct?: BlogLikeScalarFieldEnum | BlogLikeScalarFieldEnum[]
  }

  /**
   * BlogPost without action
   */
  export type BlogPostDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BlogPost
     */
    select?: BlogPostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BlogPost
     */
    omit?: BlogPostOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlogPostInclude<ExtArgs> | null
  }


  /**
   * Model BlogComment
   */

  export type AggregateBlogComment = {
    _count: BlogCommentCountAggregateOutputType | null
    _min: BlogCommentMinAggregateOutputType | null
    _max: BlogCommentMaxAggregateOutputType | null
  }

  export type BlogCommentMinAggregateOutputType = {
    id: string | null
    postId: string | null
    content: string | null
    memberId: string | null
    username: string | null
    parentId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type BlogCommentMaxAggregateOutputType = {
    id: string | null
    postId: string | null
    content: string | null
    memberId: string | null
    username: string | null
    parentId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type BlogCommentCountAggregateOutputType = {
    id: number
    postId: number
    content: number
    memberId: number
    username: number
    parentId: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type BlogCommentMinAggregateInputType = {
    id?: true
    postId?: true
    content?: true
    memberId?: true
    username?: true
    parentId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type BlogCommentMaxAggregateInputType = {
    id?: true
    postId?: true
    content?: true
    memberId?: true
    username?: true
    parentId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type BlogCommentCountAggregateInputType = {
    id?: true
    postId?: true
    content?: true
    memberId?: true
    username?: true
    parentId?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type BlogCommentAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which BlogComment to aggregate.
     */
    where?: BlogCommentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of BlogComments to fetch.
     */
    orderBy?: BlogCommentOrderByWithRelationInput | BlogCommentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: BlogCommentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` BlogComments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` BlogComments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned BlogComments
    **/
    _count?: true | BlogCommentCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: BlogCommentMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: BlogCommentMaxAggregateInputType
  }

  export type GetBlogCommentAggregateType<T extends BlogCommentAggregateArgs> = {
        [P in keyof T & keyof AggregateBlogComment]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateBlogComment[P]>
      : GetScalarType<T[P], AggregateBlogComment[P]>
  }




  export type BlogCommentGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: BlogCommentWhereInput
    orderBy?: BlogCommentOrderByWithAggregationInput | BlogCommentOrderByWithAggregationInput[]
    by: BlogCommentScalarFieldEnum[] | BlogCommentScalarFieldEnum
    having?: BlogCommentScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: BlogCommentCountAggregateInputType | true
    _min?: BlogCommentMinAggregateInputType
    _max?: BlogCommentMaxAggregateInputType
  }

  export type BlogCommentGroupByOutputType = {
    id: string
    postId: string
    content: string
    memberId: string | null
    username: string
    parentId: string | null
    createdAt: Date
    updatedAt: Date
    _count: BlogCommentCountAggregateOutputType | null
    _min: BlogCommentMinAggregateOutputType | null
    _max: BlogCommentMaxAggregateOutputType | null
  }

  type GetBlogCommentGroupByPayload<T extends BlogCommentGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<BlogCommentGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof BlogCommentGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], BlogCommentGroupByOutputType[P]>
            : GetScalarType<T[P], BlogCommentGroupByOutputType[P]>
        }
      >
    >


  export type BlogCommentSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    postId?: boolean
    content?: boolean
    memberId?: boolean
    username?: boolean
    parentId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    post?: boolean | BlogPostDefaultArgs<ExtArgs>
    member?: boolean | BlogComment$memberArgs<ExtArgs>
    parent?: boolean | BlogComment$parentArgs<ExtArgs>
    replies?: boolean | BlogComment$repliesArgs<ExtArgs>
    _count?: boolean | BlogCommentCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["blogComment"]>



  export type BlogCommentSelectScalar = {
    id?: boolean
    postId?: boolean
    content?: boolean
    memberId?: boolean
    username?: boolean
    parentId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type BlogCommentOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "postId" | "content" | "memberId" | "username" | "parentId" | "createdAt" | "updatedAt", ExtArgs["result"]["blogComment"]>
  export type BlogCommentInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    post?: boolean | BlogPostDefaultArgs<ExtArgs>
    member?: boolean | BlogComment$memberArgs<ExtArgs>
    parent?: boolean | BlogComment$parentArgs<ExtArgs>
    replies?: boolean | BlogComment$repliesArgs<ExtArgs>
    _count?: boolean | BlogCommentCountOutputTypeDefaultArgs<ExtArgs>
  }

  export type $BlogCommentPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "BlogComment"
    objects: {
      post: Prisma.$BlogPostPayload<ExtArgs>
      member: Prisma.$MemberPayload<ExtArgs> | null
      parent: Prisma.$BlogCommentPayload<ExtArgs> | null
      replies: Prisma.$BlogCommentPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      postId: string
      content: string
      memberId: string | null
      username: string
      parentId: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["blogComment"]>
    composites: {}
  }

  type BlogCommentGetPayload<S extends boolean | null | undefined | BlogCommentDefaultArgs> = $Result.GetResult<Prisma.$BlogCommentPayload, S>

  type BlogCommentCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<BlogCommentFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: BlogCommentCountAggregateInputType | true
    }

  export interface BlogCommentDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['BlogComment'], meta: { name: 'BlogComment' } }
    /**
     * Find zero or one BlogComment that matches the filter.
     * @param {BlogCommentFindUniqueArgs} args - Arguments to find a BlogComment
     * @example
     * // Get one BlogComment
     * const blogComment = await prisma.blogComment.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends BlogCommentFindUniqueArgs>(args: SelectSubset<T, BlogCommentFindUniqueArgs<ExtArgs>>): Prisma__BlogCommentClient<$Result.GetResult<Prisma.$BlogCommentPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one BlogComment that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {BlogCommentFindUniqueOrThrowArgs} args - Arguments to find a BlogComment
     * @example
     * // Get one BlogComment
     * const blogComment = await prisma.blogComment.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends BlogCommentFindUniqueOrThrowArgs>(args: SelectSubset<T, BlogCommentFindUniqueOrThrowArgs<ExtArgs>>): Prisma__BlogCommentClient<$Result.GetResult<Prisma.$BlogCommentPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first BlogComment that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BlogCommentFindFirstArgs} args - Arguments to find a BlogComment
     * @example
     * // Get one BlogComment
     * const blogComment = await prisma.blogComment.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends BlogCommentFindFirstArgs>(args?: SelectSubset<T, BlogCommentFindFirstArgs<ExtArgs>>): Prisma__BlogCommentClient<$Result.GetResult<Prisma.$BlogCommentPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first BlogComment that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BlogCommentFindFirstOrThrowArgs} args - Arguments to find a BlogComment
     * @example
     * // Get one BlogComment
     * const blogComment = await prisma.blogComment.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends BlogCommentFindFirstOrThrowArgs>(args?: SelectSubset<T, BlogCommentFindFirstOrThrowArgs<ExtArgs>>): Prisma__BlogCommentClient<$Result.GetResult<Prisma.$BlogCommentPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more BlogComments that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BlogCommentFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all BlogComments
     * const blogComments = await prisma.blogComment.findMany()
     * 
     * // Get first 10 BlogComments
     * const blogComments = await prisma.blogComment.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const blogCommentWithIdOnly = await prisma.blogComment.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends BlogCommentFindManyArgs>(args?: SelectSubset<T, BlogCommentFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BlogCommentPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a BlogComment.
     * @param {BlogCommentCreateArgs} args - Arguments to create a BlogComment.
     * @example
     * // Create one BlogComment
     * const BlogComment = await prisma.blogComment.create({
     *   data: {
     *     // ... data to create a BlogComment
     *   }
     * })
     * 
     */
    create<T extends BlogCommentCreateArgs>(args: SelectSubset<T, BlogCommentCreateArgs<ExtArgs>>): Prisma__BlogCommentClient<$Result.GetResult<Prisma.$BlogCommentPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many BlogComments.
     * @param {BlogCommentCreateManyArgs} args - Arguments to create many BlogComments.
     * @example
     * // Create many BlogComments
     * const blogComment = await prisma.blogComment.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends BlogCommentCreateManyArgs>(args?: SelectSubset<T, BlogCommentCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a BlogComment.
     * @param {BlogCommentDeleteArgs} args - Arguments to delete one BlogComment.
     * @example
     * // Delete one BlogComment
     * const BlogComment = await prisma.blogComment.delete({
     *   where: {
     *     // ... filter to delete one BlogComment
     *   }
     * })
     * 
     */
    delete<T extends BlogCommentDeleteArgs>(args: SelectSubset<T, BlogCommentDeleteArgs<ExtArgs>>): Prisma__BlogCommentClient<$Result.GetResult<Prisma.$BlogCommentPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one BlogComment.
     * @param {BlogCommentUpdateArgs} args - Arguments to update one BlogComment.
     * @example
     * // Update one BlogComment
     * const blogComment = await prisma.blogComment.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends BlogCommentUpdateArgs>(args: SelectSubset<T, BlogCommentUpdateArgs<ExtArgs>>): Prisma__BlogCommentClient<$Result.GetResult<Prisma.$BlogCommentPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more BlogComments.
     * @param {BlogCommentDeleteManyArgs} args - Arguments to filter BlogComments to delete.
     * @example
     * // Delete a few BlogComments
     * const { count } = await prisma.blogComment.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends BlogCommentDeleteManyArgs>(args?: SelectSubset<T, BlogCommentDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more BlogComments.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BlogCommentUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many BlogComments
     * const blogComment = await prisma.blogComment.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends BlogCommentUpdateManyArgs>(args: SelectSubset<T, BlogCommentUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one BlogComment.
     * @param {BlogCommentUpsertArgs} args - Arguments to update or create a BlogComment.
     * @example
     * // Update or create a BlogComment
     * const blogComment = await prisma.blogComment.upsert({
     *   create: {
     *     // ... data to create a BlogComment
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the BlogComment we want to update
     *   }
     * })
     */
    upsert<T extends BlogCommentUpsertArgs>(args: SelectSubset<T, BlogCommentUpsertArgs<ExtArgs>>): Prisma__BlogCommentClient<$Result.GetResult<Prisma.$BlogCommentPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of BlogComments.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BlogCommentCountArgs} args - Arguments to filter BlogComments to count.
     * @example
     * // Count the number of BlogComments
     * const count = await prisma.blogComment.count({
     *   where: {
     *     // ... the filter for the BlogComments we want to count
     *   }
     * })
    **/
    count<T extends BlogCommentCountArgs>(
      args?: Subset<T, BlogCommentCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], BlogCommentCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a BlogComment.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BlogCommentAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends BlogCommentAggregateArgs>(args: Subset<T, BlogCommentAggregateArgs>): Prisma.PrismaPromise<GetBlogCommentAggregateType<T>>

    /**
     * Group by BlogComment.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BlogCommentGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends BlogCommentGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: BlogCommentGroupByArgs['orderBy'] }
        : { orderBy?: BlogCommentGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, BlogCommentGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetBlogCommentGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the BlogComment model
   */
  readonly fields: BlogCommentFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for BlogComment.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__BlogCommentClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    post<T extends BlogPostDefaultArgs<ExtArgs> = {}>(args?: Subset<T, BlogPostDefaultArgs<ExtArgs>>): Prisma__BlogPostClient<$Result.GetResult<Prisma.$BlogPostPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    member<T extends BlogComment$memberArgs<ExtArgs> = {}>(args?: Subset<T, BlogComment$memberArgs<ExtArgs>>): Prisma__MemberClient<$Result.GetResult<Prisma.$MemberPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    parent<T extends BlogComment$parentArgs<ExtArgs> = {}>(args?: Subset<T, BlogComment$parentArgs<ExtArgs>>): Prisma__BlogCommentClient<$Result.GetResult<Prisma.$BlogCommentPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    replies<T extends BlogComment$repliesArgs<ExtArgs> = {}>(args?: Subset<T, BlogComment$repliesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BlogCommentPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the BlogComment model
   */
  interface BlogCommentFieldRefs {
    readonly id: FieldRef<"BlogComment", 'String'>
    readonly postId: FieldRef<"BlogComment", 'String'>
    readonly content: FieldRef<"BlogComment", 'String'>
    readonly memberId: FieldRef<"BlogComment", 'String'>
    readonly username: FieldRef<"BlogComment", 'String'>
    readonly parentId: FieldRef<"BlogComment", 'String'>
    readonly createdAt: FieldRef<"BlogComment", 'DateTime'>
    readonly updatedAt: FieldRef<"BlogComment", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * BlogComment findUnique
   */
  export type BlogCommentFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BlogComment
     */
    select?: BlogCommentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BlogComment
     */
    omit?: BlogCommentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlogCommentInclude<ExtArgs> | null
    /**
     * Filter, which BlogComment to fetch.
     */
    where: BlogCommentWhereUniqueInput
  }

  /**
   * BlogComment findUniqueOrThrow
   */
  export type BlogCommentFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BlogComment
     */
    select?: BlogCommentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BlogComment
     */
    omit?: BlogCommentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlogCommentInclude<ExtArgs> | null
    /**
     * Filter, which BlogComment to fetch.
     */
    where: BlogCommentWhereUniqueInput
  }

  /**
   * BlogComment findFirst
   */
  export type BlogCommentFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BlogComment
     */
    select?: BlogCommentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BlogComment
     */
    omit?: BlogCommentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlogCommentInclude<ExtArgs> | null
    /**
     * Filter, which BlogComment to fetch.
     */
    where?: BlogCommentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of BlogComments to fetch.
     */
    orderBy?: BlogCommentOrderByWithRelationInput | BlogCommentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for BlogComments.
     */
    cursor?: BlogCommentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` BlogComments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` BlogComments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of BlogComments.
     */
    distinct?: BlogCommentScalarFieldEnum | BlogCommentScalarFieldEnum[]
  }

  /**
   * BlogComment findFirstOrThrow
   */
  export type BlogCommentFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BlogComment
     */
    select?: BlogCommentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BlogComment
     */
    omit?: BlogCommentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlogCommentInclude<ExtArgs> | null
    /**
     * Filter, which BlogComment to fetch.
     */
    where?: BlogCommentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of BlogComments to fetch.
     */
    orderBy?: BlogCommentOrderByWithRelationInput | BlogCommentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for BlogComments.
     */
    cursor?: BlogCommentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` BlogComments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` BlogComments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of BlogComments.
     */
    distinct?: BlogCommentScalarFieldEnum | BlogCommentScalarFieldEnum[]
  }

  /**
   * BlogComment findMany
   */
  export type BlogCommentFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BlogComment
     */
    select?: BlogCommentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BlogComment
     */
    omit?: BlogCommentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlogCommentInclude<ExtArgs> | null
    /**
     * Filter, which BlogComments to fetch.
     */
    where?: BlogCommentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of BlogComments to fetch.
     */
    orderBy?: BlogCommentOrderByWithRelationInput | BlogCommentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing BlogComments.
     */
    cursor?: BlogCommentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` BlogComments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` BlogComments.
     */
    skip?: number
    distinct?: BlogCommentScalarFieldEnum | BlogCommentScalarFieldEnum[]
  }

  /**
   * BlogComment create
   */
  export type BlogCommentCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BlogComment
     */
    select?: BlogCommentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BlogComment
     */
    omit?: BlogCommentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlogCommentInclude<ExtArgs> | null
    /**
     * The data needed to create a BlogComment.
     */
    data: XOR<BlogCommentCreateInput, BlogCommentUncheckedCreateInput>
  }

  /**
   * BlogComment createMany
   */
  export type BlogCommentCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many BlogComments.
     */
    data: BlogCommentCreateManyInput | BlogCommentCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * BlogComment update
   */
  export type BlogCommentUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BlogComment
     */
    select?: BlogCommentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BlogComment
     */
    omit?: BlogCommentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlogCommentInclude<ExtArgs> | null
    /**
     * The data needed to update a BlogComment.
     */
    data: XOR<BlogCommentUpdateInput, BlogCommentUncheckedUpdateInput>
    /**
     * Choose, which BlogComment to update.
     */
    where: BlogCommentWhereUniqueInput
  }

  /**
   * BlogComment updateMany
   */
  export type BlogCommentUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update BlogComments.
     */
    data: XOR<BlogCommentUpdateManyMutationInput, BlogCommentUncheckedUpdateManyInput>
    /**
     * Filter which BlogComments to update
     */
    where?: BlogCommentWhereInput
    /**
     * Limit how many BlogComments to update.
     */
    limit?: number
  }

  /**
   * BlogComment upsert
   */
  export type BlogCommentUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BlogComment
     */
    select?: BlogCommentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BlogComment
     */
    omit?: BlogCommentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlogCommentInclude<ExtArgs> | null
    /**
     * The filter to search for the BlogComment to update in case it exists.
     */
    where: BlogCommentWhereUniqueInput
    /**
     * In case the BlogComment found by the `where` argument doesn't exist, create a new BlogComment with this data.
     */
    create: XOR<BlogCommentCreateInput, BlogCommentUncheckedCreateInput>
    /**
     * In case the BlogComment was found with the provided `where` argument, update it with this data.
     */
    update: XOR<BlogCommentUpdateInput, BlogCommentUncheckedUpdateInput>
  }

  /**
   * BlogComment delete
   */
  export type BlogCommentDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BlogComment
     */
    select?: BlogCommentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BlogComment
     */
    omit?: BlogCommentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlogCommentInclude<ExtArgs> | null
    /**
     * Filter which BlogComment to delete.
     */
    where: BlogCommentWhereUniqueInput
  }

  /**
   * BlogComment deleteMany
   */
  export type BlogCommentDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which BlogComments to delete
     */
    where?: BlogCommentWhereInput
    /**
     * Limit how many BlogComments to delete.
     */
    limit?: number
  }

  /**
   * BlogComment.member
   */
  export type BlogComment$memberArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Member
     */
    select?: MemberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Member
     */
    omit?: MemberOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MemberInclude<ExtArgs> | null
    where?: MemberWhereInput
  }

  /**
   * BlogComment.parent
   */
  export type BlogComment$parentArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BlogComment
     */
    select?: BlogCommentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BlogComment
     */
    omit?: BlogCommentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlogCommentInclude<ExtArgs> | null
    where?: BlogCommentWhereInput
  }

  /**
   * BlogComment.replies
   */
  export type BlogComment$repliesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BlogComment
     */
    select?: BlogCommentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BlogComment
     */
    omit?: BlogCommentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlogCommentInclude<ExtArgs> | null
    where?: BlogCommentWhereInput
    orderBy?: BlogCommentOrderByWithRelationInput | BlogCommentOrderByWithRelationInput[]
    cursor?: BlogCommentWhereUniqueInput
    take?: number
    skip?: number
    distinct?: BlogCommentScalarFieldEnum | BlogCommentScalarFieldEnum[]
  }

  /**
   * BlogComment without action
   */
  export type BlogCommentDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BlogComment
     */
    select?: BlogCommentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BlogComment
     */
    omit?: BlogCommentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlogCommentInclude<ExtArgs> | null
  }


  /**
   * Model BlogLike
   */

  export type AggregateBlogLike = {
    _count: BlogLikeCountAggregateOutputType | null
    _min: BlogLikeMinAggregateOutputType | null
    _max: BlogLikeMaxAggregateOutputType | null
  }

  export type BlogLikeMinAggregateOutputType = {
    id: string | null
    postId: string | null
    memberId: string | null
    guestId: string | null
    createdAt: Date | null
  }

  export type BlogLikeMaxAggregateOutputType = {
    id: string | null
    postId: string | null
    memberId: string | null
    guestId: string | null
    createdAt: Date | null
  }

  export type BlogLikeCountAggregateOutputType = {
    id: number
    postId: number
    memberId: number
    guestId: number
    createdAt: number
    _all: number
  }


  export type BlogLikeMinAggregateInputType = {
    id?: true
    postId?: true
    memberId?: true
    guestId?: true
    createdAt?: true
  }

  export type BlogLikeMaxAggregateInputType = {
    id?: true
    postId?: true
    memberId?: true
    guestId?: true
    createdAt?: true
  }

  export type BlogLikeCountAggregateInputType = {
    id?: true
    postId?: true
    memberId?: true
    guestId?: true
    createdAt?: true
    _all?: true
  }

  export type BlogLikeAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which BlogLike to aggregate.
     */
    where?: BlogLikeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of BlogLikes to fetch.
     */
    orderBy?: BlogLikeOrderByWithRelationInput | BlogLikeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: BlogLikeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` BlogLikes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` BlogLikes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned BlogLikes
    **/
    _count?: true | BlogLikeCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: BlogLikeMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: BlogLikeMaxAggregateInputType
  }

  export type GetBlogLikeAggregateType<T extends BlogLikeAggregateArgs> = {
        [P in keyof T & keyof AggregateBlogLike]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateBlogLike[P]>
      : GetScalarType<T[P], AggregateBlogLike[P]>
  }




  export type BlogLikeGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: BlogLikeWhereInput
    orderBy?: BlogLikeOrderByWithAggregationInput | BlogLikeOrderByWithAggregationInput[]
    by: BlogLikeScalarFieldEnum[] | BlogLikeScalarFieldEnum
    having?: BlogLikeScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: BlogLikeCountAggregateInputType | true
    _min?: BlogLikeMinAggregateInputType
    _max?: BlogLikeMaxAggregateInputType
  }

  export type BlogLikeGroupByOutputType = {
    id: string
    postId: string
    memberId: string | null
    guestId: string | null
    createdAt: Date
    _count: BlogLikeCountAggregateOutputType | null
    _min: BlogLikeMinAggregateOutputType | null
    _max: BlogLikeMaxAggregateOutputType | null
  }

  type GetBlogLikeGroupByPayload<T extends BlogLikeGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<BlogLikeGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof BlogLikeGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], BlogLikeGroupByOutputType[P]>
            : GetScalarType<T[P], BlogLikeGroupByOutputType[P]>
        }
      >
    >


  export type BlogLikeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    postId?: boolean
    memberId?: boolean
    guestId?: boolean
    createdAt?: boolean
    post?: boolean | BlogPostDefaultArgs<ExtArgs>
    member?: boolean | BlogLike$memberArgs<ExtArgs>
  }, ExtArgs["result"]["blogLike"]>



  export type BlogLikeSelectScalar = {
    id?: boolean
    postId?: boolean
    memberId?: boolean
    guestId?: boolean
    createdAt?: boolean
  }

  export type BlogLikeOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "postId" | "memberId" | "guestId" | "createdAt", ExtArgs["result"]["blogLike"]>
  export type BlogLikeInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    post?: boolean | BlogPostDefaultArgs<ExtArgs>
    member?: boolean | BlogLike$memberArgs<ExtArgs>
  }

  export type $BlogLikePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "BlogLike"
    objects: {
      post: Prisma.$BlogPostPayload<ExtArgs>
      member: Prisma.$MemberPayload<ExtArgs> | null
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      postId: string
      memberId: string | null
      guestId: string | null
      createdAt: Date
    }, ExtArgs["result"]["blogLike"]>
    composites: {}
  }

  type BlogLikeGetPayload<S extends boolean | null | undefined | BlogLikeDefaultArgs> = $Result.GetResult<Prisma.$BlogLikePayload, S>

  type BlogLikeCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<BlogLikeFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: BlogLikeCountAggregateInputType | true
    }

  export interface BlogLikeDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['BlogLike'], meta: { name: 'BlogLike' } }
    /**
     * Find zero or one BlogLike that matches the filter.
     * @param {BlogLikeFindUniqueArgs} args - Arguments to find a BlogLike
     * @example
     * // Get one BlogLike
     * const blogLike = await prisma.blogLike.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends BlogLikeFindUniqueArgs>(args: SelectSubset<T, BlogLikeFindUniqueArgs<ExtArgs>>): Prisma__BlogLikeClient<$Result.GetResult<Prisma.$BlogLikePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one BlogLike that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {BlogLikeFindUniqueOrThrowArgs} args - Arguments to find a BlogLike
     * @example
     * // Get one BlogLike
     * const blogLike = await prisma.blogLike.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends BlogLikeFindUniqueOrThrowArgs>(args: SelectSubset<T, BlogLikeFindUniqueOrThrowArgs<ExtArgs>>): Prisma__BlogLikeClient<$Result.GetResult<Prisma.$BlogLikePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first BlogLike that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BlogLikeFindFirstArgs} args - Arguments to find a BlogLike
     * @example
     * // Get one BlogLike
     * const blogLike = await prisma.blogLike.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends BlogLikeFindFirstArgs>(args?: SelectSubset<T, BlogLikeFindFirstArgs<ExtArgs>>): Prisma__BlogLikeClient<$Result.GetResult<Prisma.$BlogLikePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first BlogLike that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BlogLikeFindFirstOrThrowArgs} args - Arguments to find a BlogLike
     * @example
     * // Get one BlogLike
     * const blogLike = await prisma.blogLike.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends BlogLikeFindFirstOrThrowArgs>(args?: SelectSubset<T, BlogLikeFindFirstOrThrowArgs<ExtArgs>>): Prisma__BlogLikeClient<$Result.GetResult<Prisma.$BlogLikePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more BlogLikes that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BlogLikeFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all BlogLikes
     * const blogLikes = await prisma.blogLike.findMany()
     * 
     * // Get first 10 BlogLikes
     * const blogLikes = await prisma.blogLike.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const blogLikeWithIdOnly = await prisma.blogLike.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends BlogLikeFindManyArgs>(args?: SelectSubset<T, BlogLikeFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BlogLikePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a BlogLike.
     * @param {BlogLikeCreateArgs} args - Arguments to create a BlogLike.
     * @example
     * // Create one BlogLike
     * const BlogLike = await prisma.blogLike.create({
     *   data: {
     *     // ... data to create a BlogLike
     *   }
     * })
     * 
     */
    create<T extends BlogLikeCreateArgs>(args: SelectSubset<T, BlogLikeCreateArgs<ExtArgs>>): Prisma__BlogLikeClient<$Result.GetResult<Prisma.$BlogLikePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many BlogLikes.
     * @param {BlogLikeCreateManyArgs} args - Arguments to create many BlogLikes.
     * @example
     * // Create many BlogLikes
     * const blogLike = await prisma.blogLike.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends BlogLikeCreateManyArgs>(args?: SelectSubset<T, BlogLikeCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a BlogLike.
     * @param {BlogLikeDeleteArgs} args - Arguments to delete one BlogLike.
     * @example
     * // Delete one BlogLike
     * const BlogLike = await prisma.blogLike.delete({
     *   where: {
     *     // ... filter to delete one BlogLike
     *   }
     * })
     * 
     */
    delete<T extends BlogLikeDeleteArgs>(args: SelectSubset<T, BlogLikeDeleteArgs<ExtArgs>>): Prisma__BlogLikeClient<$Result.GetResult<Prisma.$BlogLikePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one BlogLike.
     * @param {BlogLikeUpdateArgs} args - Arguments to update one BlogLike.
     * @example
     * // Update one BlogLike
     * const blogLike = await prisma.blogLike.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends BlogLikeUpdateArgs>(args: SelectSubset<T, BlogLikeUpdateArgs<ExtArgs>>): Prisma__BlogLikeClient<$Result.GetResult<Prisma.$BlogLikePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more BlogLikes.
     * @param {BlogLikeDeleteManyArgs} args - Arguments to filter BlogLikes to delete.
     * @example
     * // Delete a few BlogLikes
     * const { count } = await prisma.blogLike.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends BlogLikeDeleteManyArgs>(args?: SelectSubset<T, BlogLikeDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more BlogLikes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BlogLikeUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many BlogLikes
     * const blogLike = await prisma.blogLike.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends BlogLikeUpdateManyArgs>(args: SelectSubset<T, BlogLikeUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one BlogLike.
     * @param {BlogLikeUpsertArgs} args - Arguments to update or create a BlogLike.
     * @example
     * // Update or create a BlogLike
     * const blogLike = await prisma.blogLike.upsert({
     *   create: {
     *     // ... data to create a BlogLike
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the BlogLike we want to update
     *   }
     * })
     */
    upsert<T extends BlogLikeUpsertArgs>(args: SelectSubset<T, BlogLikeUpsertArgs<ExtArgs>>): Prisma__BlogLikeClient<$Result.GetResult<Prisma.$BlogLikePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of BlogLikes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BlogLikeCountArgs} args - Arguments to filter BlogLikes to count.
     * @example
     * // Count the number of BlogLikes
     * const count = await prisma.blogLike.count({
     *   where: {
     *     // ... the filter for the BlogLikes we want to count
     *   }
     * })
    **/
    count<T extends BlogLikeCountArgs>(
      args?: Subset<T, BlogLikeCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], BlogLikeCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a BlogLike.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BlogLikeAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends BlogLikeAggregateArgs>(args: Subset<T, BlogLikeAggregateArgs>): Prisma.PrismaPromise<GetBlogLikeAggregateType<T>>

    /**
     * Group by BlogLike.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BlogLikeGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends BlogLikeGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: BlogLikeGroupByArgs['orderBy'] }
        : { orderBy?: BlogLikeGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, BlogLikeGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetBlogLikeGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the BlogLike model
   */
  readonly fields: BlogLikeFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for BlogLike.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__BlogLikeClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    post<T extends BlogPostDefaultArgs<ExtArgs> = {}>(args?: Subset<T, BlogPostDefaultArgs<ExtArgs>>): Prisma__BlogPostClient<$Result.GetResult<Prisma.$BlogPostPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    member<T extends BlogLike$memberArgs<ExtArgs> = {}>(args?: Subset<T, BlogLike$memberArgs<ExtArgs>>): Prisma__MemberClient<$Result.GetResult<Prisma.$MemberPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the BlogLike model
   */
  interface BlogLikeFieldRefs {
    readonly id: FieldRef<"BlogLike", 'String'>
    readonly postId: FieldRef<"BlogLike", 'String'>
    readonly memberId: FieldRef<"BlogLike", 'String'>
    readonly guestId: FieldRef<"BlogLike", 'String'>
    readonly createdAt: FieldRef<"BlogLike", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * BlogLike findUnique
   */
  export type BlogLikeFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BlogLike
     */
    select?: BlogLikeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BlogLike
     */
    omit?: BlogLikeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlogLikeInclude<ExtArgs> | null
    /**
     * Filter, which BlogLike to fetch.
     */
    where: BlogLikeWhereUniqueInput
  }

  /**
   * BlogLike findUniqueOrThrow
   */
  export type BlogLikeFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BlogLike
     */
    select?: BlogLikeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BlogLike
     */
    omit?: BlogLikeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlogLikeInclude<ExtArgs> | null
    /**
     * Filter, which BlogLike to fetch.
     */
    where: BlogLikeWhereUniqueInput
  }

  /**
   * BlogLike findFirst
   */
  export type BlogLikeFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BlogLike
     */
    select?: BlogLikeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BlogLike
     */
    omit?: BlogLikeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlogLikeInclude<ExtArgs> | null
    /**
     * Filter, which BlogLike to fetch.
     */
    where?: BlogLikeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of BlogLikes to fetch.
     */
    orderBy?: BlogLikeOrderByWithRelationInput | BlogLikeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for BlogLikes.
     */
    cursor?: BlogLikeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` BlogLikes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` BlogLikes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of BlogLikes.
     */
    distinct?: BlogLikeScalarFieldEnum | BlogLikeScalarFieldEnum[]
  }

  /**
   * BlogLike findFirstOrThrow
   */
  export type BlogLikeFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BlogLike
     */
    select?: BlogLikeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BlogLike
     */
    omit?: BlogLikeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlogLikeInclude<ExtArgs> | null
    /**
     * Filter, which BlogLike to fetch.
     */
    where?: BlogLikeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of BlogLikes to fetch.
     */
    orderBy?: BlogLikeOrderByWithRelationInput | BlogLikeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for BlogLikes.
     */
    cursor?: BlogLikeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` BlogLikes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` BlogLikes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of BlogLikes.
     */
    distinct?: BlogLikeScalarFieldEnum | BlogLikeScalarFieldEnum[]
  }

  /**
   * BlogLike findMany
   */
  export type BlogLikeFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BlogLike
     */
    select?: BlogLikeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BlogLike
     */
    omit?: BlogLikeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlogLikeInclude<ExtArgs> | null
    /**
     * Filter, which BlogLikes to fetch.
     */
    where?: BlogLikeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of BlogLikes to fetch.
     */
    orderBy?: BlogLikeOrderByWithRelationInput | BlogLikeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing BlogLikes.
     */
    cursor?: BlogLikeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` BlogLikes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` BlogLikes.
     */
    skip?: number
    distinct?: BlogLikeScalarFieldEnum | BlogLikeScalarFieldEnum[]
  }

  /**
   * BlogLike create
   */
  export type BlogLikeCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BlogLike
     */
    select?: BlogLikeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BlogLike
     */
    omit?: BlogLikeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlogLikeInclude<ExtArgs> | null
    /**
     * The data needed to create a BlogLike.
     */
    data: XOR<BlogLikeCreateInput, BlogLikeUncheckedCreateInput>
  }

  /**
   * BlogLike createMany
   */
  export type BlogLikeCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many BlogLikes.
     */
    data: BlogLikeCreateManyInput | BlogLikeCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * BlogLike update
   */
  export type BlogLikeUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BlogLike
     */
    select?: BlogLikeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BlogLike
     */
    omit?: BlogLikeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlogLikeInclude<ExtArgs> | null
    /**
     * The data needed to update a BlogLike.
     */
    data: XOR<BlogLikeUpdateInput, BlogLikeUncheckedUpdateInput>
    /**
     * Choose, which BlogLike to update.
     */
    where: BlogLikeWhereUniqueInput
  }

  /**
   * BlogLike updateMany
   */
  export type BlogLikeUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update BlogLikes.
     */
    data: XOR<BlogLikeUpdateManyMutationInput, BlogLikeUncheckedUpdateManyInput>
    /**
     * Filter which BlogLikes to update
     */
    where?: BlogLikeWhereInput
    /**
     * Limit how many BlogLikes to update.
     */
    limit?: number
  }

  /**
   * BlogLike upsert
   */
  export type BlogLikeUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BlogLike
     */
    select?: BlogLikeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BlogLike
     */
    omit?: BlogLikeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlogLikeInclude<ExtArgs> | null
    /**
     * The filter to search for the BlogLike to update in case it exists.
     */
    where: BlogLikeWhereUniqueInput
    /**
     * In case the BlogLike found by the `where` argument doesn't exist, create a new BlogLike with this data.
     */
    create: XOR<BlogLikeCreateInput, BlogLikeUncheckedCreateInput>
    /**
     * In case the BlogLike was found with the provided `where` argument, update it with this data.
     */
    update: XOR<BlogLikeUpdateInput, BlogLikeUncheckedUpdateInput>
  }

  /**
   * BlogLike delete
   */
  export type BlogLikeDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BlogLike
     */
    select?: BlogLikeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BlogLike
     */
    omit?: BlogLikeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlogLikeInclude<ExtArgs> | null
    /**
     * Filter which BlogLike to delete.
     */
    where: BlogLikeWhereUniqueInput
  }

  /**
   * BlogLike deleteMany
   */
  export type BlogLikeDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which BlogLikes to delete
     */
    where?: BlogLikeWhereInput
    /**
     * Limit how many BlogLikes to delete.
     */
    limit?: number
  }

  /**
   * BlogLike.member
   */
  export type BlogLike$memberArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Member
     */
    select?: MemberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Member
     */
    omit?: MemberOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MemberInclude<ExtArgs> | null
    where?: MemberWhereInput
  }

  /**
   * BlogLike without action
   */
  export type BlogLikeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BlogLike
     */
    select?: BlogLikeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BlogLike
     */
    omit?: BlogLikeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlogLikeInclude<ExtArgs> | null
  }


  /**
   * Model Setting
   */

  export type AggregateSetting = {
    _count: SettingCountAggregateOutputType | null
    _min: SettingMinAggregateOutputType | null
    _max: SettingMaxAggregateOutputType | null
  }

  export type SettingMinAggregateOutputType = {
    key: string | null
    value: string | null
  }

  export type SettingMaxAggregateOutputType = {
    key: string | null
    value: string | null
  }

  export type SettingCountAggregateOutputType = {
    key: number
    value: number
    _all: number
  }


  export type SettingMinAggregateInputType = {
    key?: true
    value?: true
  }

  export type SettingMaxAggregateInputType = {
    key?: true
    value?: true
  }

  export type SettingCountAggregateInputType = {
    key?: true
    value?: true
    _all?: true
  }

  export type SettingAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Setting to aggregate.
     */
    where?: SettingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Settings to fetch.
     */
    orderBy?: SettingOrderByWithRelationInput | SettingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SettingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Settings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Settings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Settings
    **/
    _count?: true | SettingCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SettingMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SettingMaxAggregateInputType
  }

  export type GetSettingAggregateType<T extends SettingAggregateArgs> = {
        [P in keyof T & keyof AggregateSetting]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSetting[P]>
      : GetScalarType<T[P], AggregateSetting[P]>
  }




  export type SettingGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SettingWhereInput
    orderBy?: SettingOrderByWithAggregationInput | SettingOrderByWithAggregationInput[]
    by: SettingScalarFieldEnum[] | SettingScalarFieldEnum
    having?: SettingScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SettingCountAggregateInputType | true
    _min?: SettingMinAggregateInputType
    _max?: SettingMaxAggregateInputType
  }

  export type SettingGroupByOutputType = {
    key: string
    value: string
    _count: SettingCountAggregateOutputType | null
    _min: SettingMinAggregateOutputType | null
    _max: SettingMaxAggregateOutputType | null
  }

  type GetSettingGroupByPayload<T extends SettingGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SettingGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SettingGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SettingGroupByOutputType[P]>
            : GetScalarType<T[P], SettingGroupByOutputType[P]>
        }
      >
    >


  export type SettingSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    key?: boolean
    value?: boolean
  }, ExtArgs["result"]["setting"]>



  export type SettingSelectScalar = {
    key?: boolean
    value?: boolean
  }

  export type SettingOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"key" | "value", ExtArgs["result"]["setting"]>

  export type $SettingPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Setting"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      key: string
      value: string
    }, ExtArgs["result"]["setting"]>
    composites: {}
  }

  type SettingGetPayload<S extends boolean | null | undefined | SettingDefaultArgs> = $Result.GetResult<Prisma.$SettingPayload, S>

  type SettingCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<SettingFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: SettingCountAggregateInputType | true
    }

  export interface SettingDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Setting'], meta: { name: 'Setting' } }
    /**
     * Find zero or one Setting that matches the filter.
     * @param {SettingFindUniqueArgs} args - Arguments to find a Setting
     * @example
     * // Get one Setting
     * const setting = await prisma.setting.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SettingFindUniqueArgs>(args: SelectSubset<T, SettingFindUniqueArgs<ExtArgs>>): Prisma__SettingClient<$Result.GetResult<Prisma.$SettingPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Setting that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {SettingFindUniqueOrThrowArgs} args - Arguments to find a Setting
     * @example
     * // Get one Setting
     * const setting = await prisma.setting.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SettingFindUniqueOrThrowArgs>(args: SelectSubset<T, SettingFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SettingClient<$Result.GetResult<Prisma.$SettingPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Setting that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SettingFindFirstArgs} args - Arguments to find a Setting
     * @example
     * // Get one Setting
     * const setting = await prisma.setting.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SettingFindFirstArgs>(args?: SelectSubset<T, SettingFindFirstArgs<ExtArgs>>): Prisma__SettingClient<$Result.GetResult<Prisma.$SettingPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Setting that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SettingFindFirstOrThrowArgs} args - Arguments to find a Setting
     * @example
     * // Get one Setting
     * const setting = await prisma.setting.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SettingFindFirstOrThrowArgs>(args?: SelectSubset<T, SettingFindFirstOrThrowArgs<ExtArgs>>): Prisma__SettingClient<$Result.GetResult<Prisma.$SettingPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Settings that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SettingFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Settings
     * const settings = await prisma.setting.findMany()
     * 
     * // Get first 10 Settings
     * const settings = await prisma.setting.findMany({ take: 10 })
     * 
     * // Only select the `key`
     * const settingWithKeyOnly = await prisma.setting.findMany({ select: { key: true } })
     * 
     */
    findMany<T extends SettingFindManyArgs>(args?: SelectSubset<T, SettingFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SettingPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Setting.
     * @param {SettingCreateArgs} args - Arguments to create a Setting.
     * @example
     * // Create one Setting
     * const Setting = await prisma.setting.create({
     *   data: {
     *     // ... data to create a Setting
     *   }
     * })
     * 
     */
    create<T extends SettingCreateArgs>(args: SelectSubset<T, SettingCreateArgs<ExtArgs>>): Prisma__SettingClient<$Result.GetResult<Prisma.$SettingPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Settings.
     * @param {SettingCreateManyArgs} args - Arguments to create many Settings.
     * @example
     * // Create many Settings
     * const setting = await prisma.setting.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SettingCreateManyArgs>(args?: SelectSubset<T, SettingCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a Setting.
     * @param {SettingDeleteArgs} args - Arguments to delete one Setting.
     * @example
     * // Delete one Setting
     * const Setting = await prisma.setting.delete({
     *   where: {
     *     // ... filter to delete one Setting
     *   }
     * })
     * 
     */
    delete<T extends SettingDeleteArgs>(args: SelectSubset<T, SettingDeleteArgs<ExtArgs>>): Prisma__SettingClient<$Result.GetResult<Prisma.$SettingPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Setting.
     * @param {SettingUpdateArgs} args - Arguments to update one Setting.
     * @example
     * // Update one Setting
     * const setting = await prisma.setting.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SettingUpdateArgs>(args: SelectSubset<T, SettingUpdateArgs<ExtArgs>>): Prisma__SettingClient<$Result.GetResult<Prisma.$SettingPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Settings.
     * @param {SettingDeleteManyArgs} args - Arguments to filter Settings to delete.
     * @example
     * // Delete a few Settings
     * const { count } = await prisma.setting.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SettingDeleteManyArgs>(args?: SelectSubset<T, SettingDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Settings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SettingUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Settings
     * const setting = await prisma.setting.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SettingUpdateManyArgs>(args: SelectSubset<T, SettingUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Setting.
     * @param {SettingUpsertArgs} args - Arguments to update or create a Setting.
     * @example
     * // Update or create a Setting
     * const setting = await prisma.setting.upsert({
     *   create: {
     *     // ... data to create a Setting
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Setting we want to update
     *   }
     * })
     */
    upsert<T extends SettingUpsertArgs>(args: SelectSubset<T, SettingUpsertArgs<ExtArgs>>): Prisma__SettingClient<$Result.GetResult<Prisma.$SettingPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Settings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SettingCountArgs} args - Arguments to filter Settings to count.
     * @example
     * // Count the number of Settings
     * const count = await prisma.setting.count({
     *   where: {
     *     // ... the filter for the Settings we want to count
     *   }
     * })
    **/
    count<T extends SettingCountArgs>(
      args?: Subset<T, SettingCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SettingCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Setting.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SettingAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SettingAggregateArgs>(args: Subset<T, SettingAggregateArgs>): Prisma.PrismaPromise<GetSettingAggregateType<T>>

    /**
     * Group by Setting.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SettingGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends SettingGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SettingGroupByArgs['orderBy'] }
        : { orderBy?: SettingGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SettingGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSettingGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Setting model
   */
  readonly fields: SettingFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Setting.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SettingClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Setting model
   */
  interface SettingFieldRefs {
    readonly key: FieldRef<"Setting", 'String'>
    readonly value: FieldRef<"Setting", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Setting findUnique
   */
  export type SettingFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Setting
     */
    select?: SettingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Setting
     */
    omit?: SettingOmit<ExtArgs> | null
    /**
     * Filter, which Setting to fetch.
     */
    where: SettingWhereUniqueInput
  }

  /**
   * Setting findUniqueOrThrow
   */
  export type SettingFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Setting
     */
    select?: SettingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Setting
     */
    omit?: SettingOmit<ExtArgs> | null
    /**
     * Filter, which Setting to fetch.
     */
    where: SettingWhereUniqueInput
  }

  /**
   * Setting findFirst
   */
  export type SettingFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Setting
     */
    select?: SettingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Setting
     */
    omit?: SettingOmit<ExtArgs> | null
    /**
     * Filter, which Setting to fetch.
     */
    where?: SettingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Settings to fetch.
     */
    orderBy?: SettingOrderByWithRelationInput | SettingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Settings.
     */
    cursor?: SettingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Settings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Settings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Settings.
     */
    distinct?: SettingScalarFieldEnum | SettingScalarFieldEnum[]
  }

  /**
   * Setting findFirstOrThrow
   */
  export type SettingFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Setting
     */
    select?: SettingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Setting
     */
    omit?: SettingOmit<ExtArgs> | null
    /**
     * Filter, which Setting to fetch.
     */
    where?: SettingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Settings to fetch.
     */
    orderBy?: SettingOrderByWithRelationInput | SettingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Settings.
     */
    cursor?: SettingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Settings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Settings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Settings.
     */
    distinct?: SettingScalarFieldEnum | SettingScalarFieldEnum[]
  }

  /**
   * Setting findMany
   */
  export type SettingFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Setting
     */
    select?: SettingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Setting
     */
    omit?: SettingOmit<ExtArgs> | null
    /**
     * Filter, which Settings to fetch.
     */
    where?: SettingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Settings to fetch.
     */
    orderBy?: SettingOrderByWithRelationInput | SettingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Settings.
     */
    cursor?: SettingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Settings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Settings.
     */
    skip?: number
    distinct?: SettingScalarFieldEnum | SettingScalarFieldEnum[]
  }

  /**
   * Setting create
   */
  export type SettingCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Setting
     */
    select?: SettingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Setting
     */
    omit?: SettingOmit<ExtArgs> | null
    /**
     * The data needed to create a Setting.
     */
    data: XOR<SettingCreateInput, SettingUncheckedCreateInput>
  }

  /**
   * Setting createMany
   */
  export type SettingCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Settings.
     */
    data: SettingCreateManyInput | SettingCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Setting update
   */
  export type SettingUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Setting
     */
    select?: SettingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Setting
     */
    omit?: SettingOmit<ExtArgs> | null
    /**
     * The data needed to update a Setting.
     */
    data: XOR<SettingUpdateInput, SettingUncheckedUpdateInput>
    /**
     * Choose, which Setting to update.
     */
    where: SettingWhereUniqueInput
  }

  /**
   * Setting updateMany
   */
  export type SettingUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Settings.
     */
    data: XOR<SettingUpdateManyMutationInput, SettingUncheckedUpdateManyInput>
    /**
     * Filter which Settings to update
     */
    where?: SettingWhereInput
    /**
     * Limit how many Settings to update.
     */
    limit?: number
  }

  /**
   * Setting upsert
   */
  export type SettingUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Setting
     */
    select?: SettingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Setting
     */
    omit?: SettingOmit<ExtArgs> | null
    /**
     * The filter to search for the Setting to update in case it exists.
     */
    where: SettingWhereUniqueInput
    /**
     * In case the Setting found by the `where` argument doesn't exist, create a new Setting with this data.
     */
    create: XOR<SettingCreateInput, SettingUncheckedCreateInput>
    /**
     * In case the Setting was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SettingUpdateInput, SettingUncheckedUpdateInput>
  }

  /**
   * Setting delete
   */
  export type SettingDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Setting
     */
    select?: SettingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Setting
     */
    omit?: SettingOmit<ExtArgs> | null
    /**
     * Filter which Setting to delete.
     */
    where: SettingWhereUniqueInput
  }

  /**
   * Setting deleteMany
   */
  export type SettingDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Settings to delete
     */
    where?: SettingWhereInput
    /**
     * Limit how many Settings to delete.
     */
    limit?: number
  }

  /**
   * Setting without action
   */
  export type SettingDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Setting
     */
    select?: SettingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Setting
     */
    omit?: SettingOmit<ExtArgs> | null
  }


  /**
   * Model Member
   */

  export type AggregateMember = {
    _count: MemberCountAggregateOutputType | null
    _avg: MemberAvgAggregateOutputType | null
    _sum: MemberSumAggregateOutputType | null
    _min: MemberMinAggregateOutputType | null
    _max: MemberMaxAggregateOutputType | null
  }

  export type MemberAvgAggregateOutputType = {
    joinYear: number | null
  }

  export type MemberSumAggregateOutputType = {
    joinYear: number | null
  }

  export type MemberMinAggregateOutputType = {
    id: string | null
    nisn: string | null
    name: string | null
    className: string | null
    whatsappNumber: string | null
    email: string | null
    gender: string | null
    asalSekolah: string | null
    password: string | null
    plainPassword: string | null
    status: $Enums.MemberStatus | null
    joinYear: number | null
    role: string | null
    photoPath: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type MemberMaxAggregateOutputType = {
    id: string | null
    nisn: string | null
    name: string | null
    className: string | null
    whatsappNumber: string | null
    email: string | null
    gender: string | null
    asalSekolah: string | null
    password: string | null
    plainPassword: string | null
    status: $Enums.MemberStatus | null
    joinYear: number | null
    role: string | null
    photoPath: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type MemberCountAggregateOutputType = {
    id: number
    nisn: number
    name: number
    className: number
    whatsappNumber: number
    email: number
    gender: number
    asalSekolah: number
    password: number
    plainPassword: number
    status: number
    joinYear: number
    role: number
    photoPath: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type MemberAvgAggregateInputType = {
    joinYear?: true
  }

  export type MemberSumAggregateInputType = {
    joinYear?: true
  }

  export type MemberMinAggregateInputType = {
    id?: true
    nisn?: true
    name?: true
    className?: true
    whatsappNumber?: true
    email?: true
    gender?: true
    asalSekolah?: true
    password?: true
    plainPassword?: true
    status?: true
    joinYear?: true
    role?: true
    photoPath?: true
    createdAt?: true
    updatedAt?: true
  }

  export type MemberMaxAggregateInputType = {
    id?: true
    nisn?: true
    name?: true
    className?: true
    whatsappNumber?: true
    email?: true
    gender?: true
    asalSekolah?: true
    password?: true
    plainPassword?: true
    status?: true
    joinYear?: true
    role?: true
    photoPath?: true
    createdAt?: true
    updatedAt?: true
  }

  export type MemberCountAggregateInputType = {
    id?: true
    nisn?: true
    name?: true
    className?: true
    whatsappNumber?: true
    email?: true
    gender?: true
    asalSekolah?: true
    password?: true
    plainPassword?: true
    status?: true
    joinYear?: true
    role?: true
    photoPath?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type MemberAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Member to aggregate.
     */
    where?: MemberWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Members to fetch.
     */
    orderBy?: MemberOrderByWithRelationInput | MemberOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: MemberWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Members from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Members.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Members
    **/
    _count?: true | MemberCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: MemberAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: MemberSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: MemberMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: MemberMaxAggregateInputType
  }

  export type GetMemberAggregateType<T extends MemberAggregateArgs> = {
        [P in keyof T & keyof AggregateMember]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateMember[P]>
      : GetScalarType<T[P], AggregateMember[P]>
  }




  export type MemberGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: MemberWhereInput
    orderBy?: MemberOrderByWithAggregationInput | MemberOrderByWithAggregationInput[]
    by: MemberScalarFieldEnum[] | MemberScalarFieldEnum
    having?: MemberScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: MemberCountAggregateInputType | true
    _avg?: MemberAvgAggregateInputType
    _sum?: MemberSumAggregateInputType
    _min?: MemberMinAggregateInputType
    _max?: MemberMaxAggregateInputType
  }

  export type MemberGroupByOutputType = {
    id: string
    nisn: string | null
    name: string
    className: string
    whatsappNumber: string
    email: string
    gender: string
    asalSekolah: string
    password: string
    plainPassword: string | null
    status: $Enums.MemberStatus
    joinYear: number
    role: string
    photoPath: string | null
    createdAt: Date
    updatedAt: Date
    _count: MemberCountAggregateOutputType | null
    _avg: MemberAvgAggregateOutputType | null
    _sum: MemberSumAggregateOutputType | null
    _min: MemberMinAggregateOutputType | null
    _max: MemberMaxAggregateOutputType | null
  }

  type GetMemberGroupByPayload<T extends MemberGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<MemberGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof MemberGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], MemberGroupByOutputType[P]>
            : GetScalarType<T[P], MemberGroupByOutputType[P]>
        }
      >
    >


  export type MemberSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    nisn?: boolean
    name?: boolean
    className?: boolean
    whatsappNumber?: boolean
    email?: boolean
    gender?: boolean
    asalSekolah?: boolean
    password?: boolean
    plainPassword?: boolean
    status?: boolean
    joinYear?: boolean
    role?: boolean
    photoPath?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    orgMember?: boolean | Member$orgMemberArgs<ExtArgs>
    blogPosts?: boolean | Member$blogPostsArgs<ExtArgs>
    blogComments?: boolean | Member$blogCommentsArgs<ExtArgs>
    blogLikes?: boolean | Member$blogLikesArgs<ExtArgs>
    _count?: boolean | MemberCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["member"]>



  export type MemberSelectScalar = {
    id?: boolean
    nisn?: boolean
    name?: boolean
    className?: boolean
    whatsappNumber?: boolean
    email?: boolean
    gender?: boolean
    asalSekolah?: boolean
    password?: boolean
    plainPassword?: boolean
    status?: boolean
    joinYear?: boolean
    role?: boolean
    photoPath?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type MemberOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "nisn" | "name" | "className" | "whatsappNumber" | "email" | "gender" | "asalSekolah" | "password" | "plainPassword" | "status" | "joinYear" | "role" | "photoPath" | "createdAt" | "updatedAt", ExtArgs["result"]["member"]>
  export type MemberInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    orgMember?: boolean | Member$orgMemberArgs<ExtArgs>
    blogPosts?: boolean | Member$blogPostsArgs<ExtArgs>
    blogComments?: boolean | Member$blogCommentsArgs<ExtArgs>
    blogLikes?: boolean | Member$blogLikesArgs<ExtArgs>
    _count?: boolean | MemberCountOutputTypeDefaultArgs<ExtArgs>
  }

  export type $MemberPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Member"
    objects: {
      orgMember: Prisma.$OrgMemberPayload<ExtArgs> | null
      blogPosts: Prisma.$BlogPostPayload<ExtArgs>[]
      blogComments: Prisma.$BlogCommentPayload<ExtArgs>[]
      blogLikes: Prisma.$BlogLikePayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      nisn: string | null
      name: string
      className: string
      whatsappNumber: string
      email: string
      gender: string
      asalSekolah: string
      password: string
      plainPassword: string | null
      status: $Enums.MemberStatus
      joinYear: number
      role: string
      photoPath: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["member"]>
    composites: {}
  }

  type MemberGetPayload<S extends boolean | null | undefined | MemberDefaultArgs> = $Result.GetResult<Prisma.$MemberPayload, S>

  type MemberCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<MemberFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: MemberCountAggregateInputType | true
    }

  export interface MemberDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Member'], meta: { name: 'Member' } }
    /**
     * Find zero or one Member that matches the filter.
     * @param {MemberFindUniqueArgs} args - Arguments to find a Member
     * @example
     * // Get one Member
     * const member = await prisma.member.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends MemberFindUniqueArgs>(args: SelectSubset<T, MemberFindUniqueArgs<ExtArgs>>): Prisma__MemberClient<$Result.GetResult<Prisma.$MemberPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Member that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {MemberFindUniqueOrThrowArgs} args - Arguments to find a Member
     * @example
     * // Get one Member
     * const member = await prisma.member.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends MemberFindUniqueOrThrowArgs>(args: SelectSubset<T, MemberFindUniqueOrThrowArgs<ExtArgs>>): Prisma__MemberClient<$Result.GetResult<Prisma.$MemberPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Member that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MemberFindFirstArgs} args - Arguments to find a Member
     * @example
     * // Get one Member
     * const member = await prisma.member.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends MemberFindFirstArgs>(args?: SelectSubset<T, MemberFindFirstArgs<ExtArgs>>): Prisma__MemberClient<$Result.GetResult<Prisma.$MemberPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Member that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MemberFindFirstOrThrowArgs} args - Arguments to find a Member
     * @example
     * // Get one Member
     * const member = await prisma.member.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends MemberFindFirstOrThrowArgs>(args?: SelectSubset<T, MemberFindFirstOrThrowArgs<ExtArgs>>): Prisma__MemberClient<$Result.GetResult<Prisma.$MemberPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Members that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MemberFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Members
     * const members = await prisma.member.findMany()
     * 
     * // Get first 10 Members
     * const members = await prisma.member.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const memberWithIdOnly = await prisma.member.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends MemberFindManyArgs>(args?: SelectSubset<T, MemberFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MemberPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Member.
     * @param {MemberCreateArgs} args - Arguments to create a Member.
     * @example
     * // Create one Member
     * const Member = await prisma.member.create({
     *   data: {
     *     // ... data to create a Member
     *   }
     * })
     * 
     */
    create<T extends MemberCreateArgs>(args: SelectSubset<T, MemberCreateArgs<ExtArgs>>): Prisma__MemberClient<$Result.GetResult<Prisma.$MemberPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Members.
     * @param {MemberCreateManyArgs} args - Arguments to create many Members.
     * @example
     * // Create many Members
     * const member = await prisma.member.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends MemberCreateManyArgs>(args?: SelectSubset<T, MemberCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a Member.
     * @param {MemberDeleteArgs} args - Arguments to delete one Member.
     * @example
     * // Delete one Member
     * const Member = await prisma.member.delete({
     *   where: {
     *     // ... filter to delete one Member
     *   }
     * })
     * 
     */
    delete<T extends MemberDeleteArgs>(args: SelectSubset<T, MemberDeleteArgs<ExtArgs>>): Prisma__MemberClient<$Result.GetResult<Prisma.$MemberPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Member.
     * @param {MemberUpdateArgs} args - Arguments to update one Member.
     * @example
     * // Update one Member
     * const member = await prisma.member.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends MemberUpdateArgs>(args: SelectSubset<T, MemberUpdateArgs<ExtArgs>>): Prisma__MemberClient<$Result.GetResult<Prisma.$MemberPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Members.
     * @param {MemberDeleteManyArgs} args - Arguments to filter Members to delete.
     * @example
     * // Delete a few Members
     * const { count } = await prisma.member.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends MemberDeleteManyArgs>(args?: SelectSubset<T, MemberDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Members.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MemberUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Members
     * const member = await prisma.member.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends MemberUpdateManyArgs>(args: SelectSubset<T, MemberUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Member.
     * @param {MemberUpsertArgs} args - Arguments to update or create a Member.
     * @example
     * // Update or create a Member
     * const member = await prisma.member.upsert({
     *   create: {
     *     // ... data to create a Member
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Member we want to update
     *   }
     * })
     */
    upsert<T extends MemberUpsertArgs>(args: SelectSubset<T, MemberUpsertArgs<ExtArgs>>): Prisma__MemberClient<$Result.GetResult<Prisma.$MemberPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Members.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MemberCountArgs} args - Arguments to filter Members to count.
     * @example
     * // Count the number of Members
     * const count = await prisma.member.count({
     *   where: {
     *     // ... the filter for the Members we want to count
     *   }
     * })
    **/
    count<T extends MemberCountArgs>(
      args?: Subset<T, MemberCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], MemberCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Member.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MemberAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends MemberAggregateArgs>(args: Subset<T, MemberAggregateArgs>): Prisma.PrismaPromise<GetMemberAggregateType<T>>

    /**
     * Group by Member.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MemberGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends MemberGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: MemberGroupByArgs['orderBy'] }
        : { orderBy?: MemberGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, MemberGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetMemberGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Member model
   */
  readonly fields: MemberFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Member.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__MemberClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    orgMember<T extends Member$orgMemberArgs<ExtArgs> = {}>(args?: Subset<T, Member$orgMemberArgs<ExtArgs>>): Prisma__OrgMemberClient<$Result.GetResult<Prisma.$OrgMemberPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    blogPosts<T extends Member$blogPostsArgs<ExtArgs> = {}>(args?: Subset<T, Member$blogPostsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BlogPostPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    blogComments<T extends Member$blogCommentsArgs<ExtArgs> = {}>(args?: Subset<T, Member$blogCommentsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BlogCommentPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    blogLikes<T extends Member$blogLikesArgs<ExtArgs> = {}>(args?: Subset<T, Member$blogLikesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BlogLikePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Member model
   */
  interface MemberFieldRefs {
    readonly id: FieldRef<"Member", 'String'>
    readonly nisn: FieldRef<"Member", 'String'>
    readonly name: FieldRef<"Member", 'String'>
    readonly className: FieldRef<"Member", 'String'>
    readonly whatsappNumber: FieldRef<"Member", 'String'>
    readonly email: FieldRef<"Member", 'String'>
    readonly gender: FieldRef<"Member", 'String'>
    readonly asalSekolah: FieldRef<"Member", 'String'>
    readonly password: FieldRef<"Member", 'String'>
    readonly plainPassword: FieldRef<"Member", 'String'>
    readonly status: FieldRef<"Member", 'MemberStatus'>
    readonly joinYear: FieldRef<"Member", 'Int'>
    readonly role: FieldRef<"Member", 'String'>
    readonly photoPath: FieldRef<"Member", 'String'>
    readonly createdAt: FieldRef<"Member", 'DateTime'>
    readonly updatedAt: FieldRef<"Member", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Member findUnique
   */
  export type MemberFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Member
     */
    select?: MemberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Member
     */
    omit?: MemberOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MemberInclude<ExtArgs> | null
    /**
     * Filter, which Member to fetch.
     */
    where: MemberWhereUniqueInput
  }

  /**
   * Member findUniqueOrThrow
   */
  export type MemberFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Member
     */
    select?: MemberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Member
     */
    omit?: MemberOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MemberInclude<ExtArgs> | null
    /**
     * Filter, which Member to fetch.
     */
    where: MemberWhereUniqueInput
  }

  /**
   * Member findFirst
   */
  export type MemberFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Member
     */
    select?: MemberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Member
     */
    omit?: MemberOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MemberInclude<ExtArgs> | null
    /**
     * Filter, which Member to fetch.
     */
    where?: MemberWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Members to fetch.
     */
    orderBy?: MemberOrderByWithRelationInput | MemberOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Members.
     */
    cursor?: MemberWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Members from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Members.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Members.
     */
    distinct?: MemberScalarFieldEnum | MemberScalarFieldEnum[]
  }

  /**
   * Member findFirstOrThrow
   */
  export type MemberFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Member
     */
    select?: MemberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Member
     */
    omit?: MemberOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MemberInclude<ExtArgs> | null
    /**
     * Filter, which Member to fetch.
     */
    where?: MemberWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Members to fetch.
     */
    orderBy?: MemberOrderByWithRelationInput | MemberOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Members.
     */
    cursor?: MemberWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Members from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Members.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Members.
     */
    distinct?: MemberScalarFieldEnum | MemberScalarFieldEnum[]
  }

  /**
   * Member findMany
   */
  export type MemberFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Member
     */
    select?: MemberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Member
     */
    omit?: MemberOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MemberInclude<ExtArgs> | null
    /**
     * Filter, which Members to fetch.
     */
    where?: MemberWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Members to fetch.
     */
    orderBy?: MemberOrderByWithRelationInput | MemberOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Members.
     */
    cursor?: MemberWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Members from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Members.
     */
    skip?: number
    distinct?: MemberScalarFieldEnum | MemberScalarFieldEnum[]
  }

  /**
   * Member create
   */
  export type MemberCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Member
     */
    select?: MemberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Member
     */
    omit?: MemberOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MemberInclude<ExtArgs> | null
    /**
     * The data needed to create a Member.
     */
    data: XOR<MemberCreateInput, MemberUncheckedCreateInput>
  }

  /**
   * Member createMany
   */
  export type MemberCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Members.
     */
    data: MemberCreateManyInput | MemberCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Member update
   */
  export type MemberUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Member
     */
    select?: MemberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Member
     */
    omit?: MemberOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MemberInclude<ExtArgs> | null
    /**
     * The data needed to update a Member.
     */
    data: XOR<MemberUpdateInput, MemberUncheckedUpdateInput>
    /**
     * Choose, which Member to update.
     */
    where: MemberWhereUniqueInput
  }

  /**
   * Member updateMany
   */
  export type MemberUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Members.
     */
    data: XOR<MemberUpdateManyMutationInput, MemberUncheckedUpdateManyInput>
    /**
     * Filter which Members to update
     */
    where?: MemberWhereInput
    /**
     * Limit how many Members to update.
     */
    limit?: number
  }

  /**
   * Member upsert
   */
  export type MemberUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Member
     */
    select?: MemberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Member
     */
    omit?: MemberOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MemberInclude<ExtArgs> | null
    /**
     * The filter to search for the Member to update in case it exists.
     */
    where: MemberWhereUniqueInput
    /**
     * In case the Member found by the `where` argument doesn't exist, create a new Member with this data.
     */
    create: XOR<MemberCreateInput, MemberUncheckedCreateInput>
    /**
     * In case the Member was found with the provided `where` argument, update it with this data.
     */
    update: XOR<MemberUpdateInput, MemberUncheckedUpdateInput>
  }

  /**
   * Member delete
   */
  export type MemberDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Member
     */
    select?: MemberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Member
     */
    omit?: MemberOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MemberInclude<ExtArgs> | null
    /**
     * Filter which Member to delete.
     */
    where: MemberWhereUniqueInput
  }

  /**
   * Member deleteMany
   */
  export type MemberDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Members to delete
     */
    where?: MemberWhereInput
    /**
     * Limit how many Members to delete.
     */
    limit?: number
  }

  /**
   * Member.orgMember
   */
  export type Member$orgMemberArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OrgMember
     */
    select?: OrgMemberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OrgMember
     */
    omit?: OrgMemberOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrgMemberInclude<ExtArgs> | null
    where?: OrgMemberWhereInput
  }

  /**
   * Member.blogPosts
   */
  export type Member$blogPostsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BlogPost
     */
    select?: BlogPostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BlogPost
     */
    omit?: BlogPostOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlogPostInclude<ExtArgs> | null
    where?: BlogPostWhereInput
    orderBy?: BlogPostOrderByWithRelationInput | BlogPostOrderByWithRelationInput[]
    cursor?: BlogPostWhereUniqueInput
    take?: number
    skip?: number
    distinct?: BlogPostScalarFieldEnum | BlogPostScalarFieldEnum[]
  }

  /**
   * Member.blogComments
   */
  export type Member$blogCommentsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BlogComment
     */
    select?: BlogCommentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BlogComment
     */
    omit?: BlogCommentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlogCommentInclude<ExtArgs> | null
    where?: BlogCommentWhereInput
    orderBy?: BlogCommentOrderByWithRelationInput | BlogCommentOrderByWithRelationInput[]
    cursor?: BlogCommentWhereUniqueInput
    take?: number
    skip?: number
    distinct?: BlogCommentScalarFieldEnum | BlogCommentScalarFieldEnum[]
  }

  /**
   * Member.blogLikes
   */
  export type Member$blogLikesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BlogLike
     */
    select?: BlogLikeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BlogLike
     */
    omit?: BlogLikeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlogLikeInclude<ExtArgs> | null
    where?: BlogLikeWhereInput
    orderBy?: BlogLikeOrderByWithRelationInput | BlogLikeOrderByWithRelationInput[]
    cursor?: BlogLikeWhereUniqueInput
    take?: number
    skip?: number
    distinct?: BlogLikeScalarFieldEnum | BlogLikeScalarFieldEnum[]
  }

  /**
   * Member without action
   */
  export type MemberDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Member
     */
    select?: MemberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Member
     */
    omit?: MemberOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MemberInclude<ExtArgs> | null
  }


  /**
   * Model OrgMember
   */

  export type AggregateOrgMember = {
    _count: OrgMemberCountAggregateOutputType | null
    _avg: OrgMemberAvgAggregateOutputType | null
    _sum: OrgMemberSumAggregateOutputType | null
    _min: OrgMemberMinAggregateOutputType | null
    _max: OrgMemberMaxAggregateOutputType | null
  }

  export type OrgMemberAvgAggregateOutputType = {
    yearStart: number | null
    yearEnd: number | null
  }

  export type OrgMemberSumAggregateOutputType = {
    yearStart: number | null
    yearEnd: number | null
  }

  export type OrgMemberMinAggregateOutputType = {
    id: string | null
    name: string | null
    role: string | null
    jabatan: string | null
    yearStart: number | null
    yearEnd: number | null
    isCurrent: boolean | null
    photoPath: string | null
    quote: string | null
    memberId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type OrgMemberMaxAggregateOutputType = {
    id: string | null
    name: string | null
    role: string | null
    jabatan: string | null
    yearStart: number | null
    yearEnd: number | null
    isCurrent: boolean | null
    photoPath: string | null
    quote: string | null
    memberId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type OrgMemberCountAggregateOutputType = {
    id: number
    name: number
    role: number
    jabatan: number
    yearStart: number
    yearEnd: number
    isCurrent: number
    photoPath: number
    quote: number
    memberId: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type OrgMemberAvgAggregateInputType = {
    yearStart?: true
    yearEnd?: true
  }

  export type OrgMemberSumAggregateInputType = {
    yearStart?: true
    yearEnd?: true
  }

  export type OrgMemberMinAggregateInputType = {
    id?: true
    name?: true
    role?: true
    jabatan?: true
    yearStart?: true
    yearEnd?: true
    isCurrent?: true
    photoPath?: true
    quote?: true
    memberId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type OrgMemberMaxAggregateInputType = {
    id?: true
    name?: true
    role?: true
    jabatan?: true
    yearStart?: true
    yearEnd?: true
    isCurrent?: true
    photoPath?: true
    quote?: true
    memberId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type OrgMemberCountAggregateInputType = {
    id?: true
    name?: true
    role?: true
    jabatan?: true
    yearStart?: true
    yearEnd?: true
    isCurrent?: true
    photoPath?: true
    quote?: true
    memberId?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type OrgMemberAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which OrgMember to aggregate.
     */
    where?: OrgMemberWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of OrgMembers to fetch.
     */
    orderBy?: OrgMemberOrderByWithRelationInput | OrgMemberOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: OrgMemberWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` OrgMembers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` OrgMembers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned OrgMembers
    **/
    _count?: true | OrgMemberCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: OrgMemberAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: OrgMemberSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: OrgMemberMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: OrgMemberMaxAggregateInputType
  }

  export type GetOrgMemberAggregateType<T extends OrgMemberAggregateArgs> = {
        [P in keyof T & keyof AggregateOrgMember]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateOrgMember[P]>
      : GetScalarType<T[P], AggregateOrgMember[P]>
  }




  export type OrgMemberGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: OrgMemberWhereInput
    orderBy?: OrgMemberOrderByWithAggregationInput | OrgMemberOrderByWithAggregationInput[]
    by: OrgMemberScalarFieldEnum[] | OrgMemberScalarFieldEnum
    having?: OrgMemberScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: OrgMemberCountAggregateInputType | true
    _avg?: OrgMemberAvgAggregateInputType
    _sum?: OrgMemberSumAggregateInputType
    _min?: OrgMemberMinAggregateInputType
    _max?: OrgMemberMaxAggregateInputType
  }

  export type OrgMemberGroupByOutputType = {
    id: string
    name: string
    role: string
    jabatan: string
    yearStart: number
    yearEnd: number | null
    isCurrent: boolean
    photoPath: string | null
    quote: string | null
    memberId: string | null
    createdAt: Date
    updatedAt: Date
    _count: OrgMemberCountAggregateOutputType | null
    _avg: OrgMemberAvgAggregateOutputType | null
    _sum: OrgMemberSumAggregateOutputType | null
    _min: OrgMemberMinAggregateOutputType | null
    _max: OrgMemberMaxAggregateOutputType | null
  }

  type GetOrgMemberGroupByPayload<T extends OrgMemberGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<OrgMemberGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof OrgMemberGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], OrgMemberGroupByOutputType[P]>
            : GetScalarType<T[P], OrgMemberGroupByOutputType[P]>
        }
      >
    >


  export type OrgMemberSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    role?: boolean
    jabatan?: boolean
    yearStart?: boolean
    yearEnd?: boolean
    isCurrent?: boolean
    photoPath?: boolean
    quote?: boolean
    memberId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    member?: boolean | OrgMember$memberArgs<ExtArgs>
  }, ExtArgs["result"]["orgMember"]>



  export type OrgMemberSelectScalar = {
    id?: boolean
    name?: boolean
    role?: boolean
    jabatan?: boolean
    yearStart?: boolean
    yearEnd?: boolean
    isCurrent?: boolean
    photoPath?: boolean
    quote?: boolean
    memberId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type OrgMemberOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "role" | "jabatan" | "yearStart" | "yearEnd" | "isCurrent" | "photoPath" | "quote" | "memberId" | "createdAt" | "updatedAt", ExtArgs["result"]["orgMember"]>
  export type OrgMemberInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    member?: boolean | OrgMember$memberArgs<ExtArgs>
  }

  export type $OrgMemberPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "OrgMember"
    objects: {
      member: Prisma.$MemberPayload<ExtArgs> | null
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      role: string
      jabatan: string
      yearStart: number
      yearEnd: number | null
      isCurrent: boolean
      photoPath: string | null
      quote: string | null
      memberId: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["orgMember"]>
    composites: {}
  }

  type OrgMemberGetPayload<S extends boolean | null | undefined | OrgMemberDefaultArgs> = $Result.GetResult<Prisma.$OrgMemberPayload, S>

  type OrgMemberCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<OrgMemberFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: OrgMemberCountAggregateInputType | true
    }

  export interface OrgMemberDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['OrgMember'], meta: { name: 'OrgMember' } }
    /**
     * Find zero or one OrgMember that matches the filter.
     * @param {OrgMemberFindUniqueArgs} args - Arguments to find a OrgMember
     * @example
     * // Get one OrgMember
     * const orgMember = await prisma.orgMember.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends OrgMemberFindUniqueArgs>(args: SelectSubset<T, OrgMemberFindUniqueArgs<ExtArgs>>): Prisma__OrgMemberClient<$Result.GetResult<Prisma.$OrgMemberPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one OrgMember that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {OrgMemberFindUniqueOrThrowArgs} args - Arguments to find a OrgMember
     * @example
     * // Get one OrgMember
     * const orgMember = await prisma.orgMember.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends OrgMemberFindUniqueOrThrowArgs>(args: SelectSubset<T, OrgMemberFindUniqueOrThrowArgs<ExtArgs>>): Prisma__OrgMemberClient<$Result.GetResult<Prisma.$OrgMemberPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first OrgMember that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OrgMemberFindFirstArgs} args - Arguments to find a OrgMember
     * @example
     * // Get one OrgMember
     * const orgMember = await prisma.orgMember.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends OrgMemberFindFirstArgs>(args?: SelectSubset<T, OrgMemberFindFirstArgs<ExtArgs>>): Prisma__OrgMemberClient<$Result.GetResult<Prisma.$OrgMemberPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first OrgMember that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OrgMemberFindFirstOrThrowArgs} args - Arguments to find a OrgMember
     * @example
     * // Get one OrgMember
     * const orgMember = await prisma.orgMember.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends OrgMemberFindFirstOrThrowArgs>(args?: SelectSubset<T, OrgMemberFindFirstOrThrowArgs<ExtArgs>>): Prisma__OrgMemberClient<$Result.GetResult<Prisma.$OrgMemberPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more OrgMembers that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OrgMemberFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all OrgMembers
     * const orgMembers = await prisma.orgMember.findMany()
     * 
     * // Get first 10 OrgMembers
     * const orgMembers = await prisma.orgMember.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const orgMemberWithIdOnly = await prisma.orgMember.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends OrgMemberFindManyArgs>(args?: SelectSubset<T, OrgMemberFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$OrgMemberPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a OrgMember.
     * @param {OrgMemberCreateArgs} args - Arguments to create a OrgMember.
     * @example
     * // Create one OrgMember
     * const OrgMember = await prisma.orgMember.create({
     *   data: {
     *     // ... data to create a OrgMember
     *   }
     * })
     * 
     */
    create<T extends OrgMemberCreateArgs>(args: SelectSubset<T, OrgMemberCreateArgs<ExtArgs>>): Prisma__OrgMemberClient<$Result.GetResult<Prisma.$OrgMemberPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many OrgMembers.
     * @param {OrgMemberCreateManyArgs} args - Arguments to create many OrgMembers.
     * @example
     * // Create many OrgMembers
     * const orgMember = await prisma.orgMember.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends OrgMemberCreateManyArgs>(args?: SelectSubset<T, OrgMemberCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a OrgMember.
     * @param {OrgMemberDeleteArgs} args - Arguments to delete one OrgMember.
     * @example
     * // Delete one OrgMember
     * const OrgMember = await prisma.orgMember.delete({
     *   where: {
     *     // ... filter to delete one OrgMember
     *   }
     * })
     * 
     */
    delete<T extends OrgMemberDeleteArgs>(args: SelectSubset<T, OrgMemberDeleteArgs<ExtArgs>>): Prisma__OrgMemberClient<$Result.GetResult<Prisma.$OrgMemberPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one OrgMember.
     * @param {OrgMemberUpdateArgs} args - Arguments to update one OrgMember.
     * @example
     * // Update one OrgMember
     * const orgMember = await prisma.orgMember.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends OrgMemberUpdateArgs>(args: SelectSubset<T, OrgMemberUpdateArgs<ExtArgs>>): Prisma__OrgMemberClient<$Result.GetResult<Prisma.$OrgMemberPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more OrgMembers.
     * @param {OrgMemberDeleteManyArgs} args - Arguments to filter OrgMembers to delete.
     * @example
     * // Delete a few OrgMembers
     * const { count } = await prisma.orgMember.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends OrgMemberDeleteManyArgs>(args?: SelectSubset<T, OrgMemberDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more OrgMembers.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OrgMemberUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many OrgMembers
     * const orgMember = await prisma.orgMember.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends OrgMemberUpdateManyArgs>(args: SelectSubset<T, OrgMemberUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one OrgMember.
     * @param {OrgMemberUpsertArgs} args - Arguments to update or create a OrgMember.
     * @example
     * // Update or create a OrgMember
     * const orgMember = await prisma.orgMember.upsert({
     *   create: {
     *     // ... data to create a OrgMember
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the OrgMember we want to update
     *   }
     * })
     */
    upsert<T extends OrgMemberUpsertArgs>(args: SelectSubset<T, OrgMemberUpsertArgs<ExtArgs>>): Prisma__OrgMemberClient<$Result.GetResult<Prisma.$OrgMemberPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of OrgMembers.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OrgMemberCountArgs} args - Arguments to filter OrgMembers to count.
     * @example
     * // Count the number of OrgMembers
     * const count = await prisma.orgMember.count({
     *   where: {
     *     // ... the filter for the OrgMembers we want to count
     *   }
     * })
    **/
    count<T extends OrgMemberCountArgs>(
      args?: Subset<T, OrgMemberCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], OrgMemberCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a OrgMember.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OrgMemberAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends OrgMemberAggregateArgs>(args: Subset<T, OrgMemberAggregateArgs>): Prisma.PrismaPromise<GetOrgMemberAggregateType<T>>

    /**
     * Group by OrgMember.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OrgMemberGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends OrgMemberGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: OrgMemberGroupByArgs['orderBy'] }
        : { orderBy?: OrgMemberGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, OrgMemberGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetOrgMemberGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the OrgMember model
   */
  readonly fields: OrgMemberFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for OrgMember.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__OrgMemberClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    member<T extends OrgMember$memberArgs<ExtArgs> = {}>(args?: Subset<T, OrgMember$memberArgs<ExtArgs>>): Prisma__MemberClient<$Result.GetResult<Prisma.$MemberPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the OrgMember model
   */
  interface OrgMemberFieldRefs {
    readonly id: FieldRef<"OrgMember", 'String'>
    readonly name: FieldRef<"OrgMember", 'String'>
    readonly role: FieldRef<"OrgMember", 'String'>
    readonly jabatan: FieldRef<"OrgMember", 'String'>
    readonly yearStart: FieldRef<"OrgMember", 'Int'>
    readonly yearEnd: FieldRef<"OrgMember", 'Int'>
    readonly isCurrent: FieldRef<"OrgMember", 'Boolean'>
    readonly photoPath: FieldRef<"OrgMember", 'String'>
    readonly quote: FieldRef<"OrgMember", 'String'>
    readonly memberId: FieldRef<"OrgMember", 'String'>
    readonly createdAt: FieldRef<"OrgMember", 'DateTime'>
    readonly updatedAt: FieldRef<"OrgMember", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * OrgMember findUnique
   */
  export type OrgMemberFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OrgMember
     */
    select?: OrgMemberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OrgMember
     */
    omit?: OrgMemberOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrgMemberInclude<ExtArgs> | null
    /**
     * Filter, which OrgMember to fetch.
     */
    where: OrgMemberWhereUniqueInput
  }

  /**
   * OrgMember findUniqueOrThrow
   */
  export type OrgMemberFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OrgMember
     */
    select?: OrgMemberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OrgMember
     */
    omit?: OrgMemberOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrgMemberInclude<ExtArgs> | null
    /**
     * Filter, which OrgMember to fetch.
     */
    where: OrgMemberWhereUniqueInput
  }

  /**
   * OrgMember findFirst
   */
  export type OrgMemberFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OrgMember
     */
    select?: OrgMemberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OrgMember
     */
    omit?: OrgMemberOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrgMemberInclude<ExtArgs> | null
    /**
     * Filter, which OrgMember to fetch.
     */
    where?: OrgMemberWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of OrgMembers to fetch.
     */
    orderBy?: OrgMemberOrderByWithRelationInput | OrgMemberOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for OrgMembers.
     */
    cursor?: OrgMemberWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` OrgMembers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` OrgMembers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of OrgMembers.
     */
    distinct?: OrgMemberScalarFieldEnum | OrgMemberScalarFieldEnum[]
  }

  /**
   * OrgMember findFirstOrThrow
   */
  export type OrgMemberFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OrgMember
     */
    select?: OrgMemberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OrgMember
     */
    omit?: OrgMemberOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrgMemberInclude<ExtArgs> | null
    /**
     * Filter, which OrgMember to fetch.
     */
    where?: OrgMemberWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of OrgMembers to fetch.
     */
    orderBy?: OrgMemberOrderByWithRelationInput | OrgMemberOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for OrgMembers.
     */
    cursor?: OrgMemberWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` OrgMembers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` OrgMembers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of OrgMembers.
     */
    distinct?: OrgMemberScalarFieldEnum | OrgMemberScalarFieldEnum[]
  }

  /**
   * OrgMember findMany
   */
  export type OrgMemberFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OrgMember
     */
    select?: OrgMemberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OrgMember
     */
    omit?: OrgMemberOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrgMemberInclude<ExtArgs> | null
    /**
     * Filter, which OrgMembers to fetch.
     */
    where?: OrgMemberWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of OrgMembers to fetch.
     */
    orderBy?: OrgMemberOrderByWithRelationInput | OrgMemberOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing OrgMembers.
     */
    cursor?: OrgMemberWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` OrgMembers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` OrgMembers.
     */
    skip?: number
    distinct?: OrgMemberScalarFieldEnum | OrgMemberScalarFieldEnum[]
  }

  /**
   * OrgMember create
   */
  export type OrgMemberCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OrgMember
     */
    select?: OrgMemberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OrgMember
     */
    omit?: OrgMemberOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrgMemberInclude<ExtArgs> | null
    /**
     * The data needed to create a OrgMember.
     */
    data: XOR<OrgMemberCreateInput, OrgMemberUncheckedCreateInput>
  }

  /**
   * OrgMember createMany
   */
  export type OrgMemberCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many OrgMembers.
     */
    data: OrgMemberCreateManyInput | OrgMemberCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * OrgMember update
   */
  export type OrgMemberUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OrgMember
     */
    select?: OrgMemberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OrgMember
     */
    omit?: OrgMemberOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrgMemberInclude<ExtArgs> | null
    /**
     * The data needed to update a OrgMember.
     */
    data: XOR<OrgMemberUpdateInput, OrgMemberUncheckedUpdateInput>
    /**
     * Choose, which OrgMember to update.
     */
    where: OrgMemberWhereUniqueInput
  }

  /**
   * OrgMember updateMany
   */
  export type OrgMemberUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update OrgMembers.
     */
    data: XOR<OrgMemberUpdateManyMutationInput, OrgMemberUncheckedUpdateManyInput>
    /**
     * Filter which OrgMembers to update
     */
    where?: OrgMemberWhereInput
    /**
     * Limit how many OrgMembers to update.
     */
    limit?: number
  }

  /**
   * OrgMember upsert
   */
  export type OrgMemberUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OrgMember
     */
    select?: OrgMemberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OrgMember
     */
    omit?: OrgMemberOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrgMemberInclude<ExtArgs> | null
    /**
     * The filter to search for the OrgMember to update in case it exists.
     */
    where: OrgMemberWhereUniqueInput
    /**
     * In case the OrgMember found by the `where` argument doesn't exist, create a new OrgMember with this data.
     */
    create: XOR<OrgMemberCreateInput, OrgMemberUncheckedCreateInput>
    /**
     * In case the OrgMember was found with the provided `where` argument, update it with this data.
     */
    update: XOR<OrgMemberUpdateInput, OrgMemberUncheckedUpdateInput>
  }

  /**
   * OrgMember delete
   */
  export type OrgMemberDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OrgMember
     */
    select?: OrgMemberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OrgMember
     */
    omit?: OrgMemberOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrgMemberInclude<ExtArgs> | null
    /**
     * Filter which OrgMember to delete.
     */
    where: OrgMemberWhereUniqueInput
  }

  /**
   * OrgMember deleteMany
   */
  export type OrgMemberDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which OrgMembers to delete
     */
    where?: OrgMemberWhereInput
    /**
     * Limit how many OrgMembers to delete.
     */
    limit?: number
  }

  /**
   * OrgMember.member
   */
  export type OrgMember$memberArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Member
     */
    select?: MemberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Member
     */
    omit?: MemberOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MemberInclude<ExtArgs> | null
    where?: MemberWhereInput
  }

  /**
   * OrgMember without action
   */
  export type OrgMemberDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OrgMember
     */
    select?: OrgMemberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OrgMember
     */
    omit?: OrgMemberOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrgMemberInclude<ExtArgs> | null
  }


  /**
   * Model PasswordResetOtp
   */

  export type AggregatePasswordResetOtp = {
    _count: PasswordResetOtpCountAggregateOutputType | null
    _min: PasswordResetOtpMinAggregateOutputType | null
    _max: PasswordResetOtpMaxAggregateOutputType | null
  }

  export type PasswordResetOtpMinAggregateOutputType = {
    id: string | null
    identifier: string | null
    otpCode: string | null
    expiresAt: Date | null
    isUsed: boolean | null
    createdAt: Date | null
  }

  export type PasswordResetOtpMaxAggregateOutputType = {
    id: string | null
    identifier: string | null
    otpCode: string | null
    expiresAt: Date | null
    isUsed: boolean | null
    createdAt: Date | null
  }

  export type PasswordResetOtpCountAggregateOutputType = {
    id: number
    identifier: number
    otpCode: number
    expiresAt: number
    isUsed: number
    createdAt: number
    _all: number
  }


  export type PasswordResetOtpMinAggregateInputType = {
    id?: true
    identifier?: true
    otpCode?: true
    expiresAt?: true
    isUsed?: true
    createdAt?: true
  }

  export type PasswordResetOtpMaxAggregateInputType = {
    id?: true
    identifier?: true
    otpCode?: true
    expiresAt?: true
    isUsed?: true
    createdAt?: true
  }

  export type PasswordResetOtpCountAggregateInputType = {
    id?: true
    identifier?: true
    otpCode?: true
    expiresAt?: true
    isUsed?: true
    createdAt?: true
    _all?: true
  }

  export type PasswordResetOtpAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PasswordResetOtp to aggregate.
     */
    where?: PasswordResetOtpWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PasswordResetOtps to fetch.
     */
    orderBy?: PasswordResetOtpOrderByWithRelationInput | PasswordResetOtpOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PasswordResetOtpWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PasswordResetOtps from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PasswordResetOtps.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned PasswordResetOtps
    **/
    _count?: true | PasswordResetOtpCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PasswordResetOtpMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PasswordResetOtpMaxAggregateInputType
  }

  export type GetPasswordResetOtpAggregateType<T extends PasswordResetOtpAggregateArgs> = {
        [P in keyof T & keyof AggregatePasswordResetOtp]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePasswordResetOtp[P]>
      : GetScalarType<T[P], AggregatePasswordResetOtp[P]>
  }




  export type PasswordResetOtpGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PasswordResetOtpWhereInput
    orderBy?: PasswordResetOtpOrderByWithAggregationInput | PasswordResetOtpOrderByWithAggregationInput[]
    by: PasswordResetOtpScalarFieldEnum[] | PasswordResetOtpScalarFieldEnum
    having?: PasswordResetOtpScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PasswordResetOtpCountAggregateInputType | true
    _min?: PasswordResetOtpMinAggregateInputType
    _max?: PasswordResetOtpMaxAggregateInputType
  }

  export type PasswordResetOtpGroupByOutputType = {
    id: string
    identifier: string
    otpCode: string
    expiresAt: Date
    isUsed: boolean
    createdAt: Date
    _count: PasswordResetOtpCountAggregateOutputType | null
    _min: PasswordResetOtpMinAggregateOutputType | null
    _max: PasswordResetOtpMaxAggregateOutputType | null
  }

  type GetPasswordResetOtpGroupByPayload<T extends PasswordResetOtpGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PasswordResetOtpGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PasswordResetOtpGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PasswordResetOtpGroupByOutputType[P]>
            : GetScalarType<T[P], PasswordResetOtpGroupByOutputType[P]>
        }
      >
    >


  export type PasswordResetOtpSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    identifier?: boolean
    otpCode?: boolean
    expiresAt?: boolean
    isUsed?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["passwordResetOtp"]>



  export type PasswordResetOtpSelectScalar = {
    id?: boolean
    identifier?: boolean
    otpCode?: boolean
    expiresAt?: boolean
    isUsed?: boolean
    createdAt?: boolean
  }

  export type PasswordResetOtpOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "identifier" | "otpCode" | "expiresAt" | "isUsed" | "createdAt", ExtArgs["result"]["passwordResetOtp"]>

  export type $PasswordResetOtpPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "PasswordResetOtp"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      identifier: string
      otpCode: string
      expiresAt: Date
      isUsed: boolean
      createdAt: Date
    }, ExtArgs["result"]["passwordResetOtp"]>
    composites: {}
  }

  type PasswordResetOtpGetPayload<S extends boolean | null | undefined | PasswordResetOtpDefaultArgs> = $Result.GetResult<Prisma.$PasswordResetOtpPayload, S>

  type PasswordResetOtpCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<PasswordResetOtpFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: PasswordResetOtpCountAggregateInputType | true
    }

  export interface PasswordResetOtpDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['PasswordResetOtp'], meta: { name: 'PasswordResetOtp' } }
    /**
     * Find zero or one PasswordResetOtp that matches the filter.
     * @param {PasswordResetOtpFindUniqueArgs} args - Arguments to find a PasswordResetOtp
     * @example
     * // Get one PasswordResetOtp
     * const passwordResetOtp = await prisma.passwordResetOtp.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PasswordResetOtpFindUniqueArgs>(args: SelectSubset<T, PasswordResetOtpFindUniqueArgs<ExtArgs>>): Prisma__PasswordResetOtpClient<$Result.GetResult<Prisma.$PasswordResetOtpPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one PasswordResetOtp that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {PasswordResetOtpFindUniqueOrThrowArgs} args - Arguments to find a PasswordResetOtp
     * @example
     * // Get one PasswordResetOtp
     * const passwordResetOtp = await prisma.passwordResetOtp.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PasswordResetOtpFindUniqueOrThrowArgs>(args: SelectSubset<T, PasswordResetOtpFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PasswordResetOtpClient<$Result.GetResult<Prisma.$PasswordResetOtpPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first PasswordResetOtp that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PasswordResetOtpFindFirstArgs} args - Arguments to find a PasswordResetOtp
     * @example
     * // Get one PasswordResetOtp
     * const passwordResetOtp = await prisma.passwordResetOtp.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PasswordResetOtpFindFirstArgs>(args?: SelectSubset<T, PasswordResetOtpFindFirstArgs<ExtArgs>>): Prisma__PasswordResetOtpClient<$Result.GetResult<Prisma.$PasswordResetOtpPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first PasswordResetOtp that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PasswordResetOtpFindFirstOrThrowArgs} args - Arguments to find a PasswordResetOtp
     * @example
     * // Get one PasswordResetOtp
     * const passwordResetOtp = await prisma.passwordResetOtp.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PasswordResetOtpFindFirstOrThrowArgs>(args?: SelectSubset<T, PasswordResetOtpFindFirstOrThrowArgs<ExtArgs>>): Prisma__PasswordResetOtpClient<$Result.GetResult<Prisma.$PasswordResetOtpPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more PasswordResetOtps that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PasswordResetOtpFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all PasswordResetOtps
     * const passwordResetOtps = await prisma.passwordResetOtp.findMany()
     * 
     * // Get first 10 PasswordResetOtps
     * const passwordResetOtps = await prisma.passwordResetOtp.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const passwordResetOtpWithIdOnly = await prisma.passwordResetOtp.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends PasswordResetOtpFindManyArgs>(args?: SelectSubset<T, PasswordResetOtpFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PasswordResetOtpPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a PasswordResetOtp.
     * @param {PasswordResetOtpCreateArgs} args - Arguments to create a PasswordResetOtp.
     * @example
     * // Create one PasswordResetOtp
     * const PasswordResetOtp = await prisma.passwordResetOtp.create({
     *   data: {
     *     // ... data to create a PasswordResetOtp
     *   }
     * })
     * 
     */
    create<T extends PasswordResetOtpCreateArgs>(args: SelectSubset<T, PasswordResetOtpCreateArgs<ExtArgs>>): Prisma__PasswordResetOtpClient<$Result.GetResult<Prisma.$PasswordResetOtpPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many PasswordResetOtps.
     * @param {PasswordResetOtpCreateManyArgs} args - Arguments to create many PasswordResetOtps.
     * @example
     * // Create many PasswordResetOtps
     * const passwordResetOtp = await prisma.passwordResetOtp.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PasswordResetOtpCreateManyArgs>(args?: SelectSubset<T, PasswordResetOtpCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a PasswordResetOtp.
     * @param {PasswordResetOtpDeleteArgs} args - Arguments to delete one PasswordResetOtp.
     * @example
     * // Delete one PasswordResetOtp
     * const PasswordResetOtp = await prisma.passwordResetOtp.delete({
     *   where: {
     *     // ... filter to delete one PasswordResetOtp
     *   }
     * })
     * 
     */
    delete<T extends PasswordResetOtpDeleteArgs>(args: SelectSubset<T, PasswordResetOtpDeleteArgs<ExtArgs>>): Prisma__PasswordResetOtpClient<$Result.GetResult<Prisma.$PasswordResetOtpPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one PasswordResetOtp.
     * @param {PasswordResetOtpUpdateArgs} args - Arguments to update one PasswordResetOtp.
     * @example
     * // Update one PasswordResetOtp
     * const passwordResetOtp = await prisma.passwordResetOtp.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PasswordResetOtpUpdateArgs>(args: SelectSubset<T, PasswordResetOtpUpdateArgs<ExtArgs>>): Prisma__PasswordResetOtpClient<$Result.GetResult<Prisma.$PasswordResetOtpPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more PasswordResetOtps.
     * @param {PasswordResetOtpDeleteManyArgs} args - Arguments to filter PasswordResetOtps to delete.
     * @example
     * // Delete a few PasswordResetOtps
     * const { count } = await prisma.passwordResetOtp.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PasswordResetOtpDeleteManyArgs>(args?: SelectSubset<T, PasswordResetOtpDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PasswordResetOtps.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PasswordResetOtpUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many PasswordResetOtps
     * const passwordResetOtp = await prisma.passwordResetOtp.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PasswordResetOtpUpdateManyArgs>(args: SelectSubset<T, PasswordResetOtpUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one PasswordResetOtp.
     * @param {PasswordResetOtpUpsertArgs} args - Arguments to update or create a PasswordResetOtp.
     * @example
     * // Update or create a PasswordResetOtp
     * const passwordResetOtp = await prisma.passwordResetOtp.upsert({
     *   create: {
     *     // ... data to create a PasswordResetOtp
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the PasswordResetOtp we want to update
     *   }
     * })
     */
    upsert<T extends PasswordResetOtpUpsertArgs>(args: SelectSubset<T, PasswordResetOtpUpsertArgs<ExtArgs>>): Prisma__PasswordResetOtpClient<$Result.GetResult<Prisma.$PasswordResetOtpPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of PasswordResetOtps.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PasswordResetOtpCountArgs} args - Arguments to filter PasswordResetOtps to count.
     * @example
     * // Count the number of PasswordResetOtps
     * const count = await prisma.passwordResetOtp.count({
     *   where: {
     *     // ... the filter for the PasswordResetOtps we want to count
     *   }
     * })
    **/
    count<T extends PasswordResetOtpCountArgs>(
      args?: Subset<T, PasswordResetOtpCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PasswordResetOtpCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a PasswordResetOtp.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PasswordResetOtpAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends PasswordResetOtpAggregateArgs>(args: Subset<T, PasswordResetOtpAggregateArgs>): Prisma.PrismaPromise<GetPasswordResetOtpAggregateType<T>>

    /**
     * Group by PasswordResetOtp.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PasswordResetOtpGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends PasswordResetOtpGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PasswordResetOtpGroupByArgs['orderBy'] }
        : { orderBy?: PasswordResetOtpGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, PasswordResetOtpGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPasswordResetOtpGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the PasswordResetOtp model
   */
  readonly fields: PasswordResetOtpFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for PasswordResetOtp.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PasswordResetOtpClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the PasswordResetOtp model
   */
  interface PasswordResetOtpFieldRefs {
    readonly id: FieldRef<"PasswordResetOtp", 'String'>
    readonly identifier: FieldRef<"PasswordResetOtp", 'String'>
    readonly otpCode: FieldRef<"PasswordResetOtp", 'String'>
    readonly expiresAt: FieldRef<"PasswordResetOtp", 'DateTime'>
    readonly isUsed: FieldRef<"PasswordResetOtp", 'Boolean'>
    readonly createdAt: FieldRef<"PasswordResetOtp", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * PasswordResetOtp findUnique
   */
  export type PasswordResetOtpFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PasswordResetOtp
     */
    select?: PasswordResetOtpSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PasswordResetOtp
     */
    omit?: PasswordResetOtpOmit<ExtArgs> | null
    /**
     * Filter, which PasswordResetOtp to fetch.
     */
    where: PasswordResetOtpWhereUniqueInput
  }

  /**
   * PasswordResetOtp findUniqueOrThrow
   */
  export type PasswordResetOtpFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PasswordResetOtp
     */
    select?: PasswordResetOtpSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PasswordResetOtp
     */
    omit?: PasswordResetOtpOmit<ExtArgs> | null
    /**
     * Filter, which PasswordResetOtp to fetch.
     */
    where: PasswordResetOtpWhereUniqueInput
  }

  /**
   * PasswordResetOtp findFirst
   */
  export type PasswordResetOtpFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PasswordResetOtp
     */
    select?: PasswordResetOtpSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PasswordResetOtp
     */
    omit?: PasswordResetOtpOmit<ExtArgs> | null
    /**
     * Filter, which PasswordResetOtp to fetch.
     */
    where?: PasswordResetOtpWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PasswordResetOtps to fetch.
     */
    orderBy?: PasswordResetOtpOrderByWithRelationInput | PasswordResetOtpOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PasswordResetOtps.
     */
    cursor?: PasswordResetOtpWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PasswordResetOtps from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PasswordResetOtps.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PasswordResetOtps.
     */
    distinct?: PasswordResetOtpScalarFieldEnum | PasswordResetOtpScalarFieldEnum[]
  }

  /**
   * PasswordResetOtp findFirstOrThrow
   */
  export type PasswordResetOtpFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PasswordResetOtp
     */
    select?: PasswordResetOtpSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PasswordResetOtp
     */
    omit?: PasswordResetOtpOmit<ExtArgs> | null
    /**
     * Filter, which PasswordResetOtp to fetch.
     */
    where?: PasswordResetOtpWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PasswordResetOtps to fetch.
     */
    orderBy?: PasswordResetOtpOrderByWithRelationInput | PasswordResetOtpOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PasswordResetOtps.
     */
    cursor?: PasswordResetOtpWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PasswordResetOtps from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PasswordResetOtps.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PasswordResetOtps.
     */
    distinct?: PasswordResetOtpScalarFieldEnum | PasswordResetOtpScalarFieldEnum[]
  }

  /**
   * PasswordResetOtp findMany
   */
  export type PasswordResetOtpFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PasswordResetOtp
     */
    select?: PasswordResetOtpSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PasswordResetOtp
     */
    omit?: PasswordResetOtpOmit<ExtArgs> | null
    /**
     * Filter, which PasswordResetOtps to fetch.
     */
    where?: PasswordResetOtpWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PasswordResetOtps to fetch.
     */
    orderBy?: PasswordResetOtpOrderByWithRelationInput | PasswordResetOtpOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing PasswordResetOtps.
     */
    cursor?: PasswordResetOtpWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PasswordResetOtps from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PasswordResetOtps.
     */
    skip?: number
    distinct?: PasswordResetOtpScalarFieldEnum | PasswordResetOtpScalarFieldEnum[]
  }

  /**
   * PasswordResetOtp create
   */
  export type PasswordResetOtpCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PasswordResetOtp
     */
    select?: PasswordResetOtpSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PasswordResetOtp
     */
    omit?: PasswordResetOtpOmit<ExtArgs> | null
    /**
     * The data needed to create a PasswordResetOtp.
     */
    data: XOR<PasswordResetOtpCreateInput, PasswordResetOtpUncheckedCreateInput>
  }

  /**
   * PasswordResetOtp createMany
   */
  export type PasswordResetOtpCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many PasswordResetOtps.
     */
    data: PasswordResetOtpCreateManyInput | PasswordResetOtpCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * PasswordResetOtp update
   */
  export type PasswordResetOtpUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PasswordResetOtp
     */
    select?: PasswordResetOtpSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PasswordResetOtp
     */
    omit?: PasswordResetOtpOmit<ExtArgs> | null
    /**
     * The data needed to update a PasswordResetOtp.
     */
    data: XOR<PasswordResetOtpUpdateInput, PasswordResetOtpUncheckedUpdateInput>
    /**
     * Choose, which PasswordResetOtp to update.
     */
    where: PasswordResetOtpWhereUniqueInput
  }

  /**
   * PasswordResetOtp updateMany
   */
  export type PasswordResetOtpUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update PasswordResetOtps.
     */
    data: XOR<PasswordResetOtpUpdateManyMutationInput, PasswordResetOtpUncheckedUpdateManyInput>
    /**
     * Filter which PasswordResetOtps to update
     */
    where?: PasswordResetOtpWhereInput
    /**
     * Limit how many PasswordResetOtps to update.
     */
    limit?: number
  }

  /**
   * PasswordResetOtp upsert
   */
  export type PasswordResetOtpUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PasswordResetOtp
     */
    select?: PasswordResetOtpSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PasswordResetOtp
     */
    omit?: PasswordResetOtpOmit<ExtArgs> | null
    /**
     * The filter to search for the PasswordResetOtp to update in case it exists.
     */
    where: PasswordResetOtpWhereUniqueInput
    /**
     * In case the PasswordResetOtp found by the `where` argument doesn't exist, create a new PasswordResetOtp with this data.
     */
    create: XOR<PasswordResetOtpCreateInput, PasswordResetOtpUncheckedCreateInput>
    /**
     * In case the PasswordResetOtp was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PasswordResetOtpUpdateInput, PasswordResetOtpUncheckedUpdateInput>
  }

  /**
   * PasswordResetOtp delete
   */
  export type PasswordResetOtpDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PasswordResetOtp
     */
    select?: PasswordResetOtpSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PasswordResetOtp
     */
    omit?: PasswordResetOtpOmit<ExtArgs> | null
    /**
     * Filter which PasswordResetOtp to delete.
     */
    where: PasswordResetOtpWhereUniqueInput
  }

  /**
   * PasswordResetOtp deleteMany
   */
  export type PasswordResetOtpDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PasswordResetOtps to delete
     */
    where?: PasswordResetOtpWhereInput
    /**
     * Limit how many PasswordResetOtps to delete.
     */
    limit?: number
  }

  /**
   * PasswordResetOtp without action
   */
  export type PasswordResetOtpDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PasswordResetOtp
     */
    select?: PasswordResetOtpSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PasswordResetOtp
     */
    omit?: PasswordResetOtpOmit<ExtArgs> | null
  }


  /**
   * Model AlumniTestimonial
   */

  export type AggregateAlumniTestimonial = {
    _count: AlumniTestimonialCountAggregateOutputType | null
    _min: AlumniTestimonialMinAggregateOutputType | null
    _max: AlumniTestimonialMaxAggregateOutputType | null
  }

  export type AlumniTestimonialMinAggregateOutputType = {
    id: string | null
    name: string | null
    angkatan: string | null
    photoPath: string | null
    content: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type AlumniTestimonialMaxAggregateOutputType = {
    id: string | null
    name: string | null
    angkatan: string | null
    photoPath: string | null
    content: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type AlumniTestimonialCountAggregateOutputType = {
    id: number
    name: number
    angkatan: number
    photoPath: number
    content: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type AlumniTestimonialMinAggregateInputType = {
    id?: true
    name?: true
    angkatan?: true
    photoPath?: true
    content?: true
    createdAt?: true
    updatedAt?: true
  }

  export type AlumniTestimonialMaxAggregateInputType = {
    id?: true
    name?: true
    angkatan?: true
    photoPath?: true
    content?: true
    createdAt?: true
    updatedAt?: true
  }

  export type AlumniTestimonialCountAggregateInputType = {
    id?: true
    name?: true
    angkatan?: true
    photoPath?: true
    content?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type AlumniTestimonialAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which AlumniTestimonial to aggregate.
     */
    where?: AlumniTestimonialWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AlumniTestimonials to fetch.
     */
    orderBy?: AlumniTestimonialOrderByWithRelationInput | AlumniTestimonialOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: AlumniTestimonialWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AlumniTestimonials from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AlumniTestimonials.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned AlumniTestimonials
    **/
    _count?: true | AlumniTestimonialCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: AlumniTestimonialMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: AlumniTestimonialMaxAggregateInputType
  }

  export type GetAlumniTestimonialAggregateType<T extends AlumniTestimonialAggregateArgs> = {
        [P in keyof T & keyof AggregateAlumniTestimonial]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateAlumniTestimonial[P]>
      : GetScalarType<T[P], AggregateAlumniTestimonial[P]>
  }




  export type AlumniTestimonialGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AlumniTestimonialWhereInput
    orderBy?: AlumniTestimonialOrderByWithAggregationInput | AlumniTestimonialOrderByWithAggregationInput[]
    by: AlumniTestimonialScalarFieldEnum[] | AlumniTestimonialScalarFieldEnum
    having?: AlumniTestimonialScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: AlumniTestimonialCountAggregateInputType | true
    _min?: AlumniTestimonialMinAggregateInputType
    _max?: AlumniTestimonialMaxAggregateInputType
  }

  export type AlumniTestimonialGroupByOutputType = {
    id: string
    name: string
    angkatan: string
    photoPath: string | null
    content: string
    createdAt: Date
    updatedAt: Date
    _count: AlumniTestimonialCountAggregateOutputType | null
    _min: AlumniTestimonialMinAggregateOutputType | null
    _max: AlumniTestimonialMaxAggregateOutputType | null
  }

  type GetAlumniTestimonialGroupByPayload<T extends AlumniTestimonialGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<AlumniTestimonialGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof AlumniTestimonialGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], AlumniTestimonialGroupByOutputType[P]>
            : GetScalarType<T[P], AlumniTestimonialGroupByOutputType[P]>
        }
      >
    >


  export type AlumniTestimonialSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    angkatan?: boolean
    photoPath?: boolean
    content?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["alumniTestimonial"]>



  export type AlumniTestimonialSelectScalar = {
    id?: boolean
    name?: boolean
    angkatan?: boolean
    photoPath?: boolean
    content?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type AlumniTestimonialOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "angkatan" | "photoPath" | "content" | "createdAt" | "updatedAt", ExtArgs["result"]["alumniTestimonial"]>

  export type $AlumniTestimonialPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "AlumniTestimonial"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      angkatan: string
      photoPath: string | null
      content: string
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["alumniTestimonial"]>
    composites: {}
  }

  type AlumniTestimonialGetPayload<S extends boolean | null | undefined | AlumniTestimonialDefaultArgs> = $Result.GetResult<Prisma.$AlumniTestimonialPayload, S>

  type AlumniTestimonialCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<AlumniTestimonialFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: AlumniTestimonialCountAggregateInputType | true
    }

  export interface AlumniTestimonialDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['AlumniTestimonial'], meta: { name: 'AlumniTestimonial' } }
    /**
     * Find zero or one AlumniTestimonial that matches the filter.
     * @param {AlumniTestimonialFindUniqueArgs} args - Arguments to find a AlumniTestimonial
     * @example
     * // Get one AlumniTestimonial
     * const alumniTestimonial = await prisma.alumniTestimonial.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends AlumniTestimonialFindUniqueArgs>(args: SelectSubset<T, AlumniTestimonialFindUniqueArgs<ExtArgs>>): Prisma__AlumniTestimonialClient<$Result.GetResult<Prisma.$AlumniTestimonialPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one AlumniTestimonial that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {AlumniTestimonialFindUniqueOrThrowArgs} args - Arguments to find a AlumniTestimonial
     * @example
     * // Get one AlumniTestimonial
     * const alumniTestimonial = await prisma.alumniTestimonial.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends AlumniTestimonialFindUniqueOrThrowArgs>(args: SelectSubset<T, AlumniTestimonialFindUniqueOrThrowArgs<ExtArgs>>): Prisma__AlumniTestimonialClient<$Result.GetResult<Prisma.$AlumniTestimonialPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first AlumniTestimonial that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AlumniTestimonialFindFirstArgs} args - Arguments to find a AlumniTestimonial
     * @example
     * // Get one AlumniTestimonial
     * const alumniTestimonial = await prisma.alumniTestimonial.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends AlumniTestimonialFindFirstArgs>(args?: SelectSubset<T, AlumniTestimonialFindFirstArgs<ExtArgs>>): Prisma__AlumniTestimonialClient<$Result.GetResult<Prisma.$AlumniTestimonialPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first AlumniTestimonial that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AlumniTestimonialFindFirstOrThrowArgs} args - Arguments to find a AlumniTestimonial
     * @example
     * // Get one AlumniTestimonial
     * const alumniTestimonial = await prisma.alumniTestimonial.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends AlumniTestimonialFindFirstOrThrowArgs>(args?: SelectSubset<T, AlumniTestimonialFindFirstOrThrowArgs<ExtArgs>>): Prisma__AlumniTestimonialClient<$Result.GetResult<Prisma.$AlumniTestimonialPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more AlumniTestimonials that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AlumniTestimonialFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all AlumniTestimonials
     * const alumniTestimonials = await prisma.alumniTestimonial.findMany()
     * 
     * // Get first 10 AlumniTestimonials
     * const alumniTestimonials = await prisma.alumniTestimonial.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const alumniTestimonialWithIdOnly = await prisma.alumniTestimonial.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends AlumniTestimonialFindManyArgs>(args?: SelectSubset<T, AlumniTestimonialFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AlumniTestimonialPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a AlumniTestimonial.
     * @param {AlumniTestimonialCreateArgs} args - Arguments to create a AlumniTestimonial.
     * @example
     * // Create one AlumniTestimonial
     * const AlumniTestimonial = await prisma.alumniTestimonial.create({
     *   data: {
     *     // ... data to create a AlumniTestimonial
     *   }
     * })
     * 
     */
    create<T extends AlumniTestimonialCreateArgs>(args: SelectSubset<T, AlumniTestimonialCreateArgs<ExtArgs>>): Prisma__AlumniTestimonialClient<$Result.GetResult<Prisma.$AlumniTestimonialPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many AlumniTestimonials.
     * @param {AlumniTestimonialCreateManyArgs} args - Arguments to create many AlumniTestimonials.
     * @example
     * // Create many AlumniTestimonials
     * const alumniTestimonial = await prisma.alumniTestimonial.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends AlumniTestimonialCreateManyArgs>(args?: SelectSubset<T, AlumniTestimonialCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a AlumniTestimonial.
     * @param {AlumniTestimonialDeleteArgs} args - Arguments to delete one AlumniTestimonial.
     * @example
     * // Delete one AlumniTestimonial
     * const AlumniTestimonial = await prisma.alumniTestimonial.delete({
     *   where: {
     *     // ... filter to delete one AlumniTestimonial
     *   }
     * })
     * 
     */
    delete<T extends AlumniTestimonialDeleteArgs>(args: SelectSubset<T, AlumniTestimonialDeleteArgs<ExtArgs>>): Prisma__AlumniTestimonialClient<$Result.GetResult<Prisma.$AlumniTestimonialPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one AlumniTestimonial.
     * @param {AlumniTestimonialUpdateArgs} args - Arguments to update one AlumniTestimonial.
     * @example
     * // Update one AlumniTestimonial
     * const alumniTestimonial = await prisma.alumniTestimonial.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends AlumniTestimonialUpdateArgs>(args: SelectSubset<T, AlumniTestimonialUpdateArgs<ExtArgs>>): Prisma__AlumniTestimonialClient<$Result.GetResult<Prisma.$AlumniTestimonialPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more AlumniTestimonials.
     * @param {AlumniTestimonialDeleteManyArgs} args - Arguments to filter AlumniTestimonials to delete.
     * @example
     * // Delete a few AlumniTestimonials
     * const { count } = await prisma.alumniTestimonial.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends AlumniTestimonialDeleteManyArgs>(args?: SelectSubset<T, AlumniTestimonialDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more AlumniTestimonials.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AlumniTestimonialUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many AlumniTestimonials
     * const alumniTestimonial = await prisma.alumniTestimonial.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends AlumniTestimonialUpdateManyArgs>(args: SelectSubset<T, AlumniTestimonialUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one AlumniTestimonial.
     * @param {AlumniTestimonialUpsertArgs} args - Arguments to update or create a AlumniTestimonial.
     * @example
     * // Update or create a AlumniTestimonial
     * const alumniTestimonial = await prisma.alumniTestimonial.upsert({
     *   create: {
     *     // ... data to create a AlumniTestimonial
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the AlumniTestimonial we want to update
     *   }
     * })
     */
    upsert<T extends AlumniTestimonialUpsertArgs>(args: SelectSubset<T, AlumniTestimonialUpsertArgs<ExtArgs>>): Prisma__AlumniTestimonialClient<$Result.GetResult<Prisma.$AlumniTestimonialPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of AlumniTestimonials.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AlumniTestimonialCountArgs} args - Arguments to filter AlumniTestimonials to count.
     * @example
     * // Count the number of AlumniTestimonials
     * const count = await prisma.alumniTestimonial.count({
     *   where: {
     *     // ... the filter for the AlumniTestimonials we want to count
     *   }
     * })
    **/
    count<T extends AlumniTestimonialCountArgs>(
      args?: Subset<T, AlumniTestimonialCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], AlumniTestimonialCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a AlumniTestimonial.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AlumniTestimonialAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends AlumniTestimonialAggregateArgs>(args: Subset<T, AlumniTestimonialAggregateArgs>): Prisma.PrismaPromise<GetAlumniTestimonialAggregateType<T>>

    /**
     * Group by AlumniTestimonial.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AlumniTestimonialGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends AlumniTestimonialGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: AlumniTestimonialGroupByArgs['orderBy'] }
        : { orderBy?: AlumniTestimonialGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, AlumniTestimonialGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetAlumniTestimonialGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the AlumniTestimonial model
   */
  readonly fields: AlumniTestimonialFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for AlumniTestimonial.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__AlumniTestimonialClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the AlumniTestimonial model
   */
  interface AlumniTestimonialFieldRefs {
    readonly id: FieldRef<"AlumniTestimonial", 'String'>
    readonly name: FieldRef<"AlumniTestimonial", 'String'>
    readonly angkatan: FieldRef<"AlumniTestimonial", 'String'>
    readonly photoPath: FieldRef<"AlumniTestimonial", 'String'>
    readonly content: FieldRef<"AlumniTestimonial", 'String'>
    readonly createdAt: FieldRef<"AlumniTestimonial", 'DateTime'>
    readonly updatedAt: FieldRef<"AlumniTestimonial", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * AlumniTestimonial findUnique
   */
  export type AlumniTestimonialFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AlumniTestimonial
     */
    select?: AlumniTestimonialSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AlumniTestimonial
     */
    omit?: AlumniTestimonialOmit<ExtArgs> | null
    /**
     * Filter, which AlumniTestimonial to fetch.
     */
    where: AlumniTestimonialWhereUniqueInput
  }

  /**
   * AlumniTestimonial findUniqueOrThrow
   */
  export type AlumniTestimonialFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AlumniTestimonial
     */
    select?: AlumniTestimonialSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AlumniTestimonial
     */
    omit?: AlumniTestimonialOmit<ExtArgs> | null
    /**
     * Filter, which AlumniTestimonial to fetch.
     */
    where: AlumniTestimonialWhereUniqueInput
  }

  /**
   * AlumniTestimonial findFirst
   */
  export type AlumniTestimonialFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AlumniTestimonial
     */
    select?: AlumniTestimonialSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AlumniTestimonial
     */
    omit?: AlumniTestimonialOmit<ExtArgs> | null
    /**
     * Filter, which AlumniTestimonial to fetch.
     */
    where?: AlumniTestimonialWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AlumniTestimonials to fetch.
     */
    orderBy?: AlumniTestimonialOrderByWithRelationInput | AlumniTestimonialOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for AlumniTestimonials.
     */
    cursor?: AlumniTestimonialWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AlumniTestimonials from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AlumniTestimonials.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of AlumniTestimonials.
     */
    distinct?: AlumniTestimonialScalarFieldEnum | AlumniTestimonialScalarFieldEnum[]
  }

  /**
   * AlumniTestimonial findFirstOrThrow
   */
  export type AlumniTestimonialFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AlumniTestimonial
     */
    select?: AlumniTestimonialSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AlumniTestimonial
     */
    omit?: AlumniTestimonialOmit<ExtArgs> | null
    /**
     * Filter, which AlumniTestimonial to fetch.
     */
    where?: AlumniTestimonialWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AlumniTestimonials to fetch.
     */
    orderBy?: AlumniTestimonialOrderByWithRelationInput | AlumniTestimonialOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for AlumniTestimonials.
     */
    cursor?: AlumniTestimonialWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AlumniTestimonials from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AlumniTestimonials.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of AlumniTestimonials.
     */
    distinct?: AlumniTestimonialScalarFieldEnum | AlumniTestimonialScalarFieldEnum[]
  }

  /**
   * AlumniTestimonial findMany
   */
  export type AlumniTestimonialFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AlumniTestimonial
     */
    select?: AlumniTestimonialSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AlumniTestimonial
     */
    omit?: AlumniTestimonialOmit<ExtArgs> | null
    /**
     * Filter, which AlumniTestimonials to fetch.
     */
    where?: AlumniTestimonialWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AlumniTestimonials to fetch.
     */
    orderBy?: AlumniTestimonialOrderByWithRelationInput | AlumniTestimonialOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing AlumniTestimonials.
     */
    cursor?: AlumniTestimonialWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AlumniTestimonials from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AlumniTestimonials.
     */
    skip?: number
    distinct?: AlumniTestimonialScalarFieldEnum | AlumniTestimonialScalarFieldEnum[]
  }

  /**
   * AlumniTestimonial create
   */
  export type AlumniTestimonialCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AlumniTestimonial
     */
    select?: AlumniTestimonialSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AlumniTestimonial
     */
    omit?: AlumniTestimonialOmit<ExtArgs> | null
    /**
     * The data needed to create a AlumniTestimonial.
     */
    data: XOR<AlumniTestimonialCreateInput, AlumniTestimonialUncheckedCreateInput>
  }

  /**
   * AlumniTestimonial createMany
   */
  export type AlumniTestimonialCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many AlumniTestimonials.
     */
    data: AlumniTestimonialCreateManyInput | AlumniTestimonialCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * AlumniTestimonial update
   */
  export type AlumniTestimonialUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AlumniTestimonial
     */
    select?: AlumniTestimonialSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AlumniTestimonial
     */
    omit?: AlumniTestimonialOmit<ExtArgs> | null
    /**
     * The data needed to update a AlumniTestimonial.
     */
    data: XOR<AlumniTestimonialUpdateInput, AlumniTestimonialUncheckedUpdateInput>
    /**
     * Choose, which AlumniTestimonial to update.
     */
    where: AlumniTestimonialWhereUniqueInput
  }

  /**
   * AlumniTestimonial updateMany
   */
  export type AlumniTestimonialUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update AlumniTestimonials.
     */
    data: XOR<AlumniTestimonialUpdateManyMutationInput, AlumniTestimonialUncheckedUpdateManyInput>
    /**
     * Filter which AlumniTestimonials to update
     */
    where?: AlumniTestimonialWhereInput
    /**
     * Limit how many AlumniTestimonials to update.
     */
    limit?: number
  }

  /**
   * AlumniTestimonial upsert
   */
  export type AlumniTestimonialUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AlumniTestimonial
     */
    select?: AlumniTestimonialSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AlumniTestimonial
     */
    omit?: AlumniTestimonialOmit<ExtArgs> | null
    /**
     * The filter to search for the AlumniTestimonial to update in case it exists.
     */
    where: AlumniTestimonialWhereUniqueInput
    /**
     * In case the AlumniTestimonial found by the `where` argument doesn't exist, create a new AlumniTestimonial with this data.
     */
    create: XOR<AlumniTestimonialCreateInput, AlumniTestimonialUncheckedCreateInput>
    /**
     * In case the AlumniTestimonial was found with the provided `where` argument, update it with this data.
     */
    update: XOR<AlumniTestimonialUpdateInput, AlumniTestimonialUncheckedUpdateInput>
  }

  /**
   * AlumniTestimonial delete
   */
  export type AlumniTestimonialDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AlumniTestimonial
     */
    select?: AlumniTestimonialSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AlumniTestimonial
     */
    omit?: AlumniTestimonialOmit<ExtArgs> | null
    /**
     * Filter which AlumniTestimonial to delete.
     */
    where: AlumniTestimonialWhereUniqueInput
  }

  /**
   * AlumniTestimonial deleteMany
   */
  export type AlumniTestimonialDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which AlumniTestimonials to delete
     */
    where?: AlumniTestimonialWhereInput
    /**
     * Limit how many AlumniTestimonials to delete.
     */
    limit?: number
  }

  /**
   * AlumniTestimonial without action
   */
  export type AlumniTestimonialDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AlumniTestimonial
     */
    select?: AlumniTestimonialSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AlumniTestimonial
     */
    omit?: AlumniTestimonialOmit<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const CandidateScalarFieldEnum: {
    id: 'id',
    nisn: 'nisn',
    name: 'name',
    className: 'className',
    whatsappNumber: 'whatsappNumber',
    email: 'email',
    gender: 'gender',
    asalSekolah: 'asalSekolah',
    reason: 'reason',
    status: 'status',
    photoPath: 'photoPath',
    password: 'password',
    plainPassword: 'plainPassword',
    emailNotified: 'emailNotified',
    waNotified: 'waNotified',
    lastStatus: 'lastStatus',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type CandidateScalarFieldEnum = (typeof CandidateScalarFieldEnum)[keyof typeof CandidateScalarFieldEnum]


  export const AdminScalarFieldEnum: {
    id: 'id',
    username: 'username',
    password: 'password',
    role: 'role',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type AdminScalarFieldEnum = (typeof AdminScalarFieldEnum)[keyof typeof AdminScalarFieldEnum]


  export const PostScalarFieldEnum: {
    id: 'id',
    title: 'title',
    slug: 'slug',
    content: 'content',
    authorId: 'authorId',
    views: 'views',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type PostScalarFieldEnum = (typeof PostScalarFieldEnum)[keyof typeof PostScalarFieldEnum]


  export const BlogPostScalarFieldEnum: {
    id: 'id',
    title: 'title',
    slug: 'slug',
    content: 'content',
    category: 'category',
    tags: 'tags',
    status: 'status',
    featuredImg: 'featuredImg',
    views: 'views',
    authorId: 'authorId',
    memberId: 'memberId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type BlogPostScalarFieldEnum = (typeof BlogPostScalarFieldEnum)[keyof typeof BlogPostScalarFieldEnum]


  export const BlogCommentScalarFieldEnum: {
    id: 'id',
    postId: 'postId',
    content: 'content',
    memberId: 'memberId',
    username: 'username',
    parentId: 'parentId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type BlogCommentScalarFieldEnum = (typeof BlogCommentScalarFieldEnum)[keyof typeof BlogCommentScalarFieldEnum]


  export const BlogLikeScalarFieldEnum: {
    id: 'id',
    postId: 'postId',
    memberId: 'memberId',
    guestId: 'guestId',
    createdAt: 'createdAt'
  };

  export type BlogLikeScalarFieldEnum = (typeof BlogLikeScalarFieldEnum)[keyof typeof BlogLikeScalarFieldEnum]


  export const SettingScalarFieldEnum: {
    key: 'key',
    value: 'value'
  };

  export type SettingScalarFieldEnum = (typeof SettingScalarFieldEnum)[keyof typeof SettingScalarFieldEnum]


  export const MemberScalarFieldEnum: {
    id: 'id',
    nisn: 'nisn',
    name: 'name',
    className: 'className',
    whatsappNumber: 'whatsappNumber',
    email: 'email',
    gender: 'gender',
    asalSekolah: 'asalSekolah',
    password: 'password',
    plainPassword: 'plainPassword',
    status: 'status',
    joinYear: 'joinYear',
    role: 'role',
    photoPath: 'photoPath',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type MemberScalarFieldEnum = (typeof MemberScalarFieldEnum)[keyof typeof MemberScalarFieldEnum]


  export const OrgMemberScalarFieldEnum: {
    id: 'id',
    name: 'name',
    role: 'role',
    jabatan: 'jabatan',
    yearStart: 'yearStart',
    yearEnd: 'yearEnd',
    isCurrent: 'isCurrent',
    photoPath: 'photoPath',
    quote: 'quote',
    memberId: 'memberId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type OrgMemberScalarFieldEnum = (typeof OrgMemberScalarFieldEnum)[keyof typeof OrgMemberScalarFieldEnum]


  export const PasswordResetOtpScalarFieldEnum: {
    id: 'id',
    identifier: 'identifier',
    otpCode: 'otpCode',
    expiresAt: 'expiresAt',
    isUsed: 'isUsed',
    createdAt: 'createdAt'
  };

  export type PasswordResetOtpScalarFieldEnum = (typeof PasswordResetOtpScalarFieldEnum)[keyof typeof PasswordResetOtpScalarFieldEnum]


  export const AlumniTestimonialScalarFieldEnum: {
    id: 'id',
    name: 'name',
    angkatan: 'angkatan',
    photoPath: 'photoPath',
    content: 'content',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type AlumniTestimonialScalarFieldEnum = (typeof AlumniTestimonialScalarFieldEnum)[keyof typeof AlumniTestimonialScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  export const CandidateOrderByRelevanceFieldEnum: {
    id: 'id',
    nisn: 'nisn',
    name: 'name',
    className: 'className',
    whatsappNumber: 'whatsappNumber',
    email: 'email',
    gender: 'gender',
    asalSekolah: 'asalSekolah',
    reason: 'reason',
    photoPath: 'photoPath',
    password: 'password',
    plainPassword: 'plainPassword'
  };

  export type CandidateOrderByRelevanceFieldEnum = (typeof CandidateOrderByRelevanceFieldEnum)[keyof typeof CandidateOrderByRelevanceFieldEnum]


  export const AdminOrderByRelevanceFieldEnum: {
    id: 'id',
    username: 'username',
    password: 'password',
    role: 'role'
  };

  export type AdminOrderByRelevanceFieldEnum = (typeof AdminOrderByRelevanceFieldEnum)[keyof typeof AdminOrderByRelevanceFieldEnum]


  export const PostOrderByRelevanceFieldEnum: {
    id: 'id',
    title: 'title',
    slug: 'slug',
    content: 'content',
    authorId: 'authorId'
  };

  export type PostOrderByRelevanceFieldEnum = (typeof PostOrderByRelevanceFieldEnum)[keyof typeof PostOrderByRelevanceFieldEnum]


  export const BlogPostOrderByRelevanceFieldEnum: {
    id: 'id',
    title: 'title',
    slug: 'slug',
    content: 'content',
    category: 'category',
    tags: 'tags',
    status: 'status',
    featuredImg: 'featuredImg',
    authorId: 'authorId',
    memberId: 'memberId'
  };

  export type BlogPostOrderByRelevanceFieldEnum = (typeof BlogPostOrderByRelevanceFieldEnum)[keyof typeof BlogPostOrderByRelevanceFieldEnum]


  export const BlogCommentOrderByRelevanceFieldEnum: {
    id: 'id',
    postId: 'postId',
    content: 'content',
    memberId: 'memberId',
    username: 'username',
    parentId: 'parentId'
  };

  export type BlogCommentOrderByRelevanceFieldEnum = (typeof BlogCommentOrderByRelevanceFieldEnum)[keyof typeof BlogCommentOrderByRelevanceFieldEnum]


  export const BlogLikeOrderByRelevanceFieldEnum: {
    id: 'id',
    postId: 'postId',
    memberId: 'memberId',
    guestId: 'guestId'
  };

  export type BlogLikeOrderByRelevanceFieldEnum = (typeof BlogLikeOrderByRelevanceFieldEnum)[keyof typeof BlogLikeOrderByRelevanceFieldEnum]


  export const SettingOrderByRelevanceFieldEnum: {
    key: 'key',
    value: 'value'
  };

  export type SettingOrderByRelevanceFieldEnum = (typeof SettingOrderByRelevanceFieldEnum)[keyof typeof SettingOrderByRelevanceFieldEnum]


  export const MemberOrderByRelevanceFieldEnum: {
    id: 'id',
    nisn: 'nisn',
    name: 'name',
    className: 'className',
    whatsappNumber: 'whatsappNumber',
    email: 'email',
    gender: 'gender',
    asalSekolah: 'asalSekolah',
    password: 'password',
    plainPassword: 'plainPassword',
    role: 'role',
    photoPath: 'photoPath'
  };

  export type MemberOrderByRelevanceFieldEnum = (typeof MemberOrderByRelevanceFieldEnum)[keyof typeof MemberOrderByRelevanceFieldEnum]


  export const OrgMemberOrderByRelevanceFieldEnum: {
    id: 'id',
    name: 'name',
    role: 'role',
    jabatan: 'jabatan',
    photoPath: 'photoPath',
    quote: 'quote',
    memberId: 'memberId'
  };

  export type OrgMemberOrderByRelevanceFieldEnum = (typeof OrgMemberOrderByRelevanceFieldEnum)[keyof typeof OrgMemberOrderByRelevanceFieldEnum]


  export const PasswordResetOtpOrderByRelevanceFieldEnum: {
    id: 'id',
    identifier: 'identifier',
    otpCode: 'otpCode'
  };

  export type PasswordResetOtpOrderByRelevanceFieldEnum = (typeof PasswordResetOtpOrderByRelevanceFieldEnum)[keyof typeof PasswordResetOtpOrderByRelevanceFieldEnum]


  export const AlumniTestimonialOrderByRelevanceFieldEnum: {
    id: 'id',
    name: 'name',
    angkatan: 'angkatan',
    photoPath: 'photoPath',
    content: 'content'
  };

  export type AlumniTestimonialOrderByRelevanceFieldEnum = (typeof AlumniTestimonialOrderByRelevanceFieldEnum)[keyof typeof AlumniTestimonialOrderByRelevanceFieldEnum]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'Status'
   */
  export type EnumStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Status'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'MemberStatus'
   */
  export type EnumMemberStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'MemberStatus'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    
  /**
   * Deep Input Types
   */


  export type CandidateWhereInput = {
    AND?: CandidateWhereInput | CandidateWhereInput[]
    OR?: CandidateWhereInput[]
    NOT?: CandidateWhereInput | CandidateWhereInput[]
    id?: StringFilter<"Candidate"> | string
    nisn?: StringFilter<"Candidate"> | string
    name?: StringFilter<"Candidate"> | string
    className?: StringFilter<"Candidate"> | string
    whatsappNumber?: StringFilter<"Candidate"> | string
    email?: StringFilter<"Candidate"> | string
    gender?: StringFilter<"Candidate"> | string
    asalSekolah?: StringFilter<"Candidate"> | string
    reason?: StringFilter<"Candidate"> | string
    status?: EnumStatusFilter<"Candidate"> | $Enums.Status
    photoPath?: StringNullableFilter<"Candidate"> | string | null
    password?: StringNullableFilter<"Candidate"> | string | null
    plainPassword?: StringNullableFilter<"Candidate"> | string | null
    emailNotified?: BoolFilter<"Candidate"> | boolean
    waNotified?: BoolFilter<"Candidate"> | boolean
    lastStatus?: EnumStatusFilter<"Candidate"> | $Enums.Status
    createdAt?: DateTimeFilter<"Candidate"> | Date | string
    updatedAt?: DateTimeFilter<"Candidate"> | Date | string
  }

  export type CandidateOrderByWithRelationInput = {
    id?: SortOrder
    nisn?: SortOrder
    name?: SortOrder
    className?: SortOrder
    whatsappNumber?: SortOrder
    email?: SortOrder
    gender?: SortOrder
    asalSekolah?: SortOrder
    reason?: SortOrder
    status?: SortOrder
    photoPath?: SortOrderInput | SortOrder
    password?: SortOrderInput | SortOrder
    plainPassword?: SortOrderInput | SortOrder
    emailNotified?: SortOrder
    waNotified?: SortOrder
    lastStatus?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _relevance?: CandidateOrderByRelevanceInput
  }

  export type CandidateWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    nisn?: string
    AND?: CandidateWhereInput | CandidateWhereInput[]
    OR?: CandidateWhereInput[]
    NOT?: CandidateWhereInput | CandidateWhereInput[]
    name?: StringFilter<"Candidate"> | string
    className?: StringFilter<"Candidate"> | string
    whatsappNumber?: StringFilter<"Candidate"> | string
    email?: StringFilter<"Candidate"> | string
    gender?: StringFilter<"Candidate"> | string
    asalSekolah?: StringFilter<"Candidate"> | string
    reason?: StringFilter<"Candidate"> | string
    status?: EnumStatusFilter<"Candidate"> | $Enums.Status
    photoPath?: StringNullableFilter<"Candidate"> | string | null
    password?: StringNullableFilter<"Candidate"> | string | null
    plainPassword?: StringNullableFilter<"Candidate"> | string | null
    emailNotified?: BoolFilter<"Candidate"> | boolean
    waNotified?: BoolFilter<"Candidate"> | boolean
    lastStatus?: EnumStatusFilter<"Candidate"> | $Enums.Status
    createdAt?: DateTimeFilter<"Candidate"> | Date | string
    updatedAt?: DateTimeFilter<"Candidate"> | Date | string
  }, "id" | "nisn">

  export type CandidateOrderByWithAggregationInput = {
    id?: SortOrder
    nisn?: SortOrder
    name?: SortOrder
    className?: SortOrder
    whatsappNumber?: SortOrder
    email?: SortOrder
    gender?: SortOrder
    asalSekolah?: SortOrder
    reason?: SortOrder
    status?: SortOrder
    photoPath?: SortOrderInput | SortOrder
    password?: SortOrderInput | SortOrder
    plainPassword?: SortOrderInput | SortOrder
    emailNotified?: SortOrder
    waNotified?: SortOrder
    lastStatus?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: CandidateCountOrderByAggregateInput
    _max?: CandidateMaxOrderByAggregateInput
    _min?: CandidateMinOrderByAggregateInput
  }

  export type CandidateScalarWhereWithAggregatesInput = {
    AND?: CandidateScalarWhereWithAggregatesInput | CandidateScalarWhereWithAggregatesInput[]
    OR?: CandidateScalarWhereWithAggregatesInput[]
    NOT?: CandidateScalarWhereWithAggregatesInput | CandidateScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Candidate"> | string
    nisn?: StringWithAggregatesFilter<"Candidate"> | string
    name?: StringWithAggregatesFilter<"Candidate"> | string
    className?: StringWithAggregatesFilter<"Candidate"> | string
    whatsappNumber?: StringWithAggregatesFilter<"Candidate"> | string
    email?: StringWithAggregatesFilter<"Candidate"> | string
    gender?: StringWithAggregatesFilter<"Candidate"> | string
    asalSekolah?: StringWithAggregatesFilter<"Candidate"> | string
    reason?: StringWithAggregatesFilter<"Candidate"> | string
    status?: EnumStatusWithAggregatesFilter<"Candidate"> | $Enums.Status
    photoPath?: StringNullableWithAggregatesFilter<"Candidate"> | string | null
    password?: StringNullableWithAggregatesFilter<"Candidate"> | string | null
    plainPassword?: StringNullableWithAggregatesFilter<"Candidate"> | string | null
    emailNotified?: BoolWithAggregatesFilter<"Candidate"> | boolean
    waNotified?: BoolWithAggregatesFilter<"Candidate"> | boolean
    lastStatus?: EnumStatusWithAggregatesFilter<"Candidate"> | $Enums.Status
    createdAt?: DateTimeWithAggregatesFilter<"Candidate"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Candidate"> | Date | string
  }

  export type AdminWhereInput = {
    AND?: AdminWhereInput | AdminWhereInput[]
    OR?: AdminWhereInput[]
    NOT?: AdminWhereInput | AdminWhereInput[]
    id?: StringFilter<"Admin"> | string
    username?: StringFilter<"Admin"> | string
    password?: StringFilter<"Admin"> | string
    role?: StringFilter<"Admin"> | string
    createdAt?: DateTimeFilter<"Admin"> | Date | string
    updatedAt?: DateTimeFilter<"Admin"> | Date | string
    posts?: PostListRelationFilter
    blogPosts?: BlogPostListRelationFilter
  }

  export type AdminOrderByWithRelationInput = {
    id?: SortOrder
    username?: SortOrder
    password?: SortOrder
    role?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    posts?: PostOrderByRelationAggregateInput
    blogPosts?: BlogPostOrderByRelationAggregateInput
    _relevance?: AdminOrderByRelevanceInput
  }

  export type AdminWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    username?: string
    AND?: AdminWhereInput | AdminWhereInput[]
    OR?: AdminWhereInput[]
    NOT?: AdminWhereInput | AdminWhereInput[]
    password?: StringFilter<"Admin"> | string
    role?: StringFilter<"Admin"> | string
    createdAt?: DateTimeFilter<"Admin"> | Date | string
    updatedAt?: DateTimeFilter<"Admin"> | Date | string
    posts?: PostListRelationFilter
    blogPosts?: BlogPostListRelationFilter
  }, "id" | "username">

  export type AdminOrderByWithAggregationInput = {
    id?: SortOrder
    username?: SortOrder
    password?: SortOrder
    role?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: AdminCountOrderByAggregateInput
    _max?: AdminMaxOrderByAggregateInput
    _min?: AdminMinOrderByAggregateInput
  }

  export type AdminScalarWhereWithAggregatesInput = {
    AND?: AdminScalarWhereWithAggregatesInput | AdminScalarWhereWithAggregatesInput[]
    OR?: AdminScalarWhereWithAggregatesInput[]
    NOT?: AdminScalarWhereWithAggregatesInput | AdminScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Admin"> | string
    username?: StringWithAggregatesFilter<"Admin"> | string
    password?: StringWithAggregatesFilter<"Admin"> | string
    role?: StringWithAggregatesFilter<"Admin"> | string
    createdAt?: DateTimeWithAggregatesFilter<"Admin"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Admin"> | Date | string
  }

  export type PostWhereInput = {
    AND?: PostWhereInput | PostWhereInput[]
    OR?: PostWhereInput[]
    NOT?: PostWhereInput | PostWhereInput[]
    id?: StringFilter<"Post"> | string
    title?: StringFilter<"Post"> | string
    slug?: StringFilter<"Post"> | string
    content?: StringFilter<"Post"> | string
    authorId?: StringFilter<"Post"> | string
    views?: IntFilter<"Post"> | number
    createdAt?: DateTimeFilter<"Post"> | Date | string
    updatedAt?: DateTimeFilter<"Post"> | Date | string
    author?: XOR<AdminScalarRelationFilter, AdminWhereInput>
  }

  export type PostOrderByWithRelationInput = {
    id?: SortOrder
    title?: SortOrder
    slug?: SortOrder
    content?: SortOrder
    authorId?: SortOrder
    views?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    author?: AdminOrderByWithRelationInput
    _relevance?: PostOrderByRelevanceInput
  }

  export type PostWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    slug?: string
    AND?: PostWhereInput | PostWhereInput[]
    OR?: PostWhereInput[]
    NOT?: PostWhereInput | PostWhereInput[]
    title?: StringFilter<"Post"> | string
    content?: StringFilter<"Post"> | string
    authorId?: StringFilter<"Post"> | string
    views?: IntFilter<"Post"> | number
    createdAt?: DateTimeFilter<"Post"> | Date | string
    updatedAt?: DateTimeFilter<"Post"> | Date | string
    author?: XOR<AdminScalarRelationFilter, AdminWhereInput>
  }, "id" | "slug">

  export type PostOrderByWithAggregationInput = {
    id?: SortOrder
    title?: SortOrder
    slug?: SortOrder
    content?: SortOrder
    authorId?: SortOrder
    views?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: PostCountOrderByAggregateInput
    _avg?: PostAvgOrderByAggregateInput
    _max?: PostMaxOrderByAggregateInput
    _min?: PostMinOrderByAggregateInput
    _sum?: PostSumOrderByAggregateInput
  }

  export type PostScalarWhereWithAggregatesInput = {
    AND?: PostScalarWhereWithAggregatesInput | PostScalarWhereWithAggregatesInput[]
    OR?: PostScalarWhereWithAggregatesInput[]
    NOT?: PostScalarWhereWithAggregatesInput | PostScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Post"> | string
    title?: StringWithAggregatesFilter<"Post"> | string
    slug?: StringWithAggregatesFilter<"Post"> | string
    content?: StringWithAggregatesFilter<"Post"> | string
    authorId?: StringWithAggregatesFilter<"Post"> | string
    views?: IntWithAggregatesFilter<"Post"> | number
    createdAt?: DateTimeWithAggregatesFilter<"Post"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Post"> | Date | string
  }

  export type BlogPostWhereInput = {
    AND?: BlogPostWhereInput | BlogPostWhereInput[]
    OR?: BlogPostWhereInput[]
    NOT?: BlogPostWhereInput | BlogPostWhereInput[]
    id?: StringFilter<"BlogPost"> | string
    title?: StringFilter<"BlogPost"> | string
    slug?: StringFilter<"BlogPost"> | string
    content?: StringFilter<"BlogPost"> | string
    category?: StringFilter<"BlogPost"> | string
    tags?: StringFilter<"BlogPost"> | string
    status?: StringFilter<"BlogPost"> | string
    featuredImg?: StringNullableFilter<"BlogPost"> | string | null
    views?: IntFilter<"BlogPost"> | number
    authorId?: StringNullableFilter<"BlogPost"> | string | null
    memberId?: StringNullableFilter<"BlogPost"> | string | null
    createdAt?: DateTimeFilter<"BlogPost"> | Date | string
    updatedAt?: DateTimeFilter<"BlogPost"> | Date | string
    author?: XOR<AdminNullableScalarRelationFilter, AdminWhereInput> | null
    memberAuthor?: XOR<MemberNullableScalarRelationFilter, MemberWhereInput> | null
    comments?: BlogCommentListRelationFilter
    likes?: BlogLikeListRelationFilter
  }

  export type BlogPostOrderByWithRelationInput = {
    id?: SortOrder
    title?: SortOrder
    slug?: SortOrder
    content?: SortOrder
    category?: SortOrder
    tags?: SortOrder
    status?: SortOrder
    featuredImg?: SortOrderInput | SortOrder
    views?: SortOrder
    authorId?: SortOrderInput | SortOrder
    memberId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    author?: AdminOrderByWithRelationInput
    memberAuthor?: MemberOrderByWithRelationInput
    comments?: BlogCommentOrderByRelationAggregateInput
    likes?: BlogLikeOrderByRelationAggregateInput
    _relevance?: BlogPostOrderByRelevanceInput
  }

  export type BlogPostWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    slug?: string
    AND?: BlogPostWhereInput | BlogPostWhereInput[]
    OR?: BlogPostWhereInput[]
    NOT?: BlogPostWhereInput | BlogPostWhereInput[]
    title?: StringFilter<"BlogPost"> | string
    content?: StringFilter<"BlogPost"> | string
    category?: StringFilter<"BlogPost"> | string
    tags?: StringFilter<"BlogPost"> | string
    status?: StringFilter<"BlogPost"> | string
    featuredImg?: StringNullableFilter<"BlogPost"> | string | null
    views?: IntFilter<"BlogPost"> | number
    authorId?: StringNullableFilter<"BlogPost"> | string | null
    memberId?: StringNullableFilter<"BlogPost"> | string | null
    createdAt?: DateTimeFilter<"BlogPost"> | Date | string
    updatedAt?: DateTimeFilter<"BlogPost"> | Date | string
    author?: XOR<AdminNullableScalarRelationFilter, AdminWhereInput> | null
    memberAuthor?: XOR<MemberNullableScalarRelationFilter, MemberWhereInput> | null
    comments?: BlogCommentListRelationFilter
    likes?: BlogLikeListRelationFilter
  }, "id" | "slug">

  export type BlogPostOrderByWithAggregationInput = {
    id?: SortOrder
    title?: SortOrder
    slug?: SortOrder
    content?: SortOrder
    category?: SortOrder
    tags?: SortOrder
    status?: SortOrder
    featuredImg?: SortOrderInput | SortOrder
    views?: SortOrder
    authorId?: SortOrderInput | SortOrder
    memberId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: BlogPostCountOrderByAggregateInput
    _avg?: BlogPostAvgOrderByAggregateInput
    _max?: BlogPostMaxOrderByAggregateInput
    _min?: BlogPostMinOrderByAggregateInput
    _sum?: BlogPostSumOrderByAggregateInput
  }

  export type BlogPostScalarWhereWithAggregatesInput = {
    AND?: BlogPostScalarWhereWithAggregatesInput | BlogPostScalarWhereWithAggregatesInput[]
    OR?: BlogPostScalarWhereWithAggregatesInput[]
    NOT?: BlogPostScalarWhereWithAggregatesInput | BlogPostScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"BlogPost"> | string
    title?: StringWithAggregatesFilter<"BlogPost"> | string
    slug?: StringWithAggregatesFilter<"BlogPost"> | string
    content?: StringWithAggregatesFilter<"BlogPost"> | string
    category?: StringWithAggregatesFilter<"BlogPost"> | string
    tags?: StringWithAggregatesFilter<"BlogPost"> | string
    status?: StringWithAggregatesFilter<"BlogPost"> | string
    featuredImg?: StringNullableWithAggregatesFilter<"BlogPost"> | string | null
    views?: IntWithAggregatesFilter<"BlogPost"> | number
    authorId?: StringNullableWithAggregatesFilter<"BlogPost"> | string | null
    memberId?: StringNullableWithAggregatesFilter<"BlogPost"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"BlogPost"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"BlogPost"> | Date | string
  }

  export type BlogCommentWhereInput = {
    AND?: BlogCommentWhereInput | BlogCommentWhereInput[]
    OR?: BlogCommentWhereInput[]
    NOT?: BlogCommentWhereInput | BlogCommentWhereInput[]
    id?: StringFilter<"BlogComment"> | string
    postId?: StringFilter<"BlogComment"> | string
    content?: StringFilter<"BlogComment"> | string
    memberId?: StringNullableFilter<"BlogComment"> | string | null
    username?: StringFilter<"BlogComment"> | string
    parentId?: StringNullableFilter<"BlogComment"> | string | null
    createdAt?: DateTimeFilter<"BlogComment"> | Date | string
    updatedAt?: DateTimeFilter<"BlogComment"> | Date | string
    post?: XOR<BlogPostScalarRelationFilter, BlogPostWhereInput>
    member?: XOR<MemberNullableScalarRelationFilter, MemberWhereInput> | null
    parent?: XOR<BlogCommentNullableScalarRelationFilter, BlogCommentWhereInput> | null
    replies?: BlogCommentListRelationFilter
  }

  export type BlogCommentOrderByWithRelationInput = {
    id?: SortOrder
    postId?: SortOrder
    content?: SortOrder
    memberId?: SortOrderInput | SortOrder
    username?: SortOrder
    parentId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    post?: BlogPostOrderByWithRelationInput
    member?: MemberOrderByWithRelationInput
    parent?: BlogCommentOrderByWithRelationInput
    replies?: BlogCommentOrderByRelationAggregateInput
    _relevance?: BlogCommentOrderByRelevanceInput
  }

  export type BlogCommentWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: BlogCommentWhereInput | BlogCommentWhereInput[]
    OR?: BlogCommentWhereInput[]
    NOT?: BlogCommentWhereInput | BlogCommentWhereInput[]
    postId?: StringFilter<"BlogComment"> | string
    content?: StringFilter<"BlogComment"> | string
    memberId?: StringNullableFilter<"BlogComment"> | string | null
    username?: StringFilter<"BlogComment"> | string
    parentId?: StringNullableFilter<"BlogComment"> | string | null
    createdAt?: DateTimeFilter<"BlogComment"> | Date | string
    updatedAt?: DateTimeFilter<"BlogComment"> | Date | string
    post?: XOR<BlogPostScalarRelationFilter, BlogPostWhereInput>
    member?: XOR<MemberNullableScalarRelationFilter, MemberWhereInput> | null
    parent?: XOR<BlogCommentNullableScalarRelationFilter, BlogCommentWhereInput> | null
    replies?: BlogCommentListRelationFilter
  }, "id">

  export type BlogCommentOrderByWithAggregationInput = {
    id?: SortOrder
    postId?: SortOrder
    content?: SortOrder
    memberId?: SortOrderInput | SortOrder
    username?: SortOrder
    parentId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: BlogCommentCountOrderByAggregateInput
    _max?: BlogCommentMaxOrderByAggregateInput
    _min?: BlogCommentMinOrderByAggregateInput
  }

  export type BlogCommentScalarWhereWithAggregatesInput = {
    AND?: BlogCommentScalarWhereWithAggregatesInput | BlogCommentScalarWhereWithAggregatesInput[]
    OR?: BlogCommentScalarWhereWithAggregatesInput[]
    NOT?: BlogCommentScalarWhereWithAggregatesInput | BlogCommentScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"BlogComment"> | string
    postId?: StringWithAggregatesFilter<"BlogComment"> | string
    content?: StringWithAggregatesFilter<"BlogComment"> | string
    memberId?: StringNullableWithAggregatesFilter<"BlogComment"> | string | null
    username?: StringWithAggregatesFilter<"BlogComment"> | string
    parentId?: StringNullableWithAggregatesFilter<"BlogComment"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"BlogComment"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"BlogComment"> | Date | string
  }

  export type BlogLikeWhereInput = {
    AND?: BlogLikeWhereInput | BlogLikeWhereInput[]
    OR?: BlogLikeWhereInput[]
    NOT?: BlogLikeWhereInput | BlogLikeWhereInput[]
    id?: StringFilter<"BlogLike"> | string
    postId?: StringFilter<"BlogLike"> | string
    memberId?: StringNullableFilter<"BlogLike"> | string | null
    guestId?: StringNullableFilter<"BlogLike"> | string | null
    createdAt?: DateTimeFilter<"BlogLike"> | Date | string
    post?: XOR<BlogPostScalarRelationFilter, BlogPostWhereInput>
    member?: XOR<MemberNullableScalarRelationFilter, MemberWhereInput> | null
  }

  export type BlogLikeOrderByWithRelationInput = {
    id?: SortOrder
    postId?: SortOrder
    memberId?: SortOrderInput | SortOrder
    guestId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    post?: BlogPostOrderByWithRelationInput
    member?: MemberOrderByWithRelationInput
    _relevance?: BlogLikeOrderByRelevanceInput
  }

  export type BlogLikeWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: BlogLikeWhereInput | BlogLikeWhereInput[]
    OR?: BlogLikeWhereInput[]
    NOT?: BlogLikeWhereInput | BlogLikeWhereInput[]
    postId?: StringFilter<"BlogLike"> | string
    memberId?: StringNullableFilter<"BlogLike"> | string | null
    guestId?: StringNullableFilter<"BlogLike"> | string | null
    createdAt?: DateTimeFilter<"BlogLike"> | Date | string
    post?: XOR<BlogPostScalarRelationFilter, BlogPostWhereInput>
    member?: XOR<MemberNullableScalarRelationFilter, MemberWhereInput> | null
  }, "id">

  export type BlogLikeOrderByWithAggregationInput = {
    id?: SortOrder
    postId?: SortOrder
    memberId?: SortOrderInput | SortOrder
    guestId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    _count?: BlogLikeCountOrderByAggregateInput
    _max?: BlogLikeMaxOrderByAggregateInput
    _min?: BlogLikeMinOrderByAggregateInput
  }

  export type BlogLikeScalarWhereWithAggregatesInput = {
    AND?: BlogLikeScalarWhereWithAggregatesInput | BlogLikeScalarWhereWithAggregatesInput[]
    OR?: BlogLikeScalarWhereWithAggregatesInput[]
    NOT?: BlogLikeScalarWhereWithAggregatesInput | BlogLikeScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"BlogLike"> | string
    postId?: StringWithAggregatesFilter<"BlogLike"> | string
    memberId?: StringNullableWithAggregatesFilter<"BlogLike"> | string | null
    guestId?: StringNullableWithAggregatesFilter<"BlogLike"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"BlogLike"> | Date | string
  }

  export type SettingWhereInput = {
    AND?: SettingWhereInput | SettingWhereInput[]
    OR?: SettingWhereInput[]
    NOT?: SettingWhereInput | SettingWhereInput[]
    key?: StringFilter<"Setting"> | string
    value?: StringFilter<"Setting"> | string
  }

  export type SettingOrderByWithRelationInput = {
    key?: SortOrder
    value?: SortOrder
    _relevance?: SettingOrderByRelevanceInput
  }

  export type SettingWhereUniqueInput = Prisma.AtLeast<{
    key?: string
    AND?: SettingWhereInput | SettingWhereInput[]
    OR?: SettingWhereInput[]
    NOT?: SettingWhereInput | SettingWhereInput[]
    value?: StringFilter<"Setting"> | string
  }, "key">

  export type SettingOrderByWithAggregationInput = {
    key?: SortOrder
    value?: SortOrder
    _count?: SettingCountOrderByAggregateInput
    _max?: SettingMaxOrderByAggregateInput
    _min?: SettingMinOrderByAggregateInput
  }

  export type SettingScalarWhereWithAggregatesInput = {
    AND?: SettingScalarWhereWithAggregatesInput | SettingScalarWhereWithAggregatesInput[]
    OR?: SettingScalarWhereWithAggregatesInput[]
    NOT?: SettingScalarWhereWithAggregatesInput | SettingScalarWhereWithAggregatesInput[]
    key?: StringWithAggregatesFilter<"Setting"> | string
    value?: StringWithAggregatesFilter<"Setting"> | string
  }

  export type MemberWhereInput = {
    AND?: MemberWhereInput | MemberWhereInput[]
    OR?: MemberWhereInput[]
    NOT?: MemberWhereInput | MemberWhereInput[]
    id?: StringFilter<"Member"> | string
    nisn?: StringNullableFilter<"Member"> | string | null
    name?: StringFilter<"Member"> | string
    className?: StringFilter<"Member"> | string
    whatsappNumber?: StringFilter<"Member"> | string
    email?: StringFilter<"Member"> | string
    gender?: StringFilter<"Member"> | string
    asalSekolah?: StringFilter<"Member"> | string
    password?: StringFilter<"Member"> | string
    plainPassword?: StringNullableFilter<"Member"> | string | null
    status?: EnumMemberStatusFilter<"Member"> | $Enums.MemberStatus
    joinYear?: IntFilter<"Member"> | number
    role?: StringFilter<"Member"> | string
    photoPath?: StringNullableFilter<"Member"> | string | null
    createdAt?: DateTimeFilter<"Member"> | Date | string
    updatedAt?: DateTimeFilter<"Member"> | Date | string
    orgMember?: XOR<OrgMemberNullableScalarRelationFilter, OrgMemberWhereInput> | null
    blogPosts?: BlogPostListRelationFilter
    blogComments?: BlogCommentListRelationFilter
    blogLikes?: BlogLikeListRelationFilter
  }

  export type MemberOrderByWithRelationInput = {
    id?: SortOrder
    nisn?: SortOrderInput | SortOrder
    name?: SortOrder
    className?: SortOrder
    whatsappNumber?: SortOrder
    email?: SortOrder
    gender?: SortOrder
    asalSekolah?: SortOrder
    password?: SortOrder
    plainPassword?: SortOrderInput | SortOrder
    status?: SortOrder
    joinYear?: SortOrder
    role?: SortOrder
    photoPath?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    orgMember?: OrgMemberOrderByWithRelationInput
    blogPosts?: BlogPostOrderByRelationAggregateInput
    blogComments?: BlogCommentOrderByRelationAggregateInput
    blogLikes?: BlogLikeOrderByRelationAggregateInput
    _relevance?: MemberOrderByRelevanceInput
  }

  export type MemberWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    nisn?: string
    AND?: MemberWhereInput | MemberWhereInput[]
    OR?: MemberWhereInput[]
    NOT?: MemberWhereInput | MemberWhereInput[]
    name?: StringFilter<"Member"> | string
    className?: StringFilter<"Member"> | string
    whatsappNumber?: StringFilter<"Member"> | string
    email?: StringFilter<"Member"> | string
    gender?: StringFilter<"Member"> | string
    asalSekolah?: StringFilter<"Member"> | string
    password?: StringFilter<"Member"> | string
    plainPassword?: StringNullableFilter<"Member"> | string | null
    status?: EnumMemberStatusFilter<"Member"> | $Enums.MemberStatus
    joinYear?: IntFilter<"Member"> | number
    role?: StringFilter<"Member"> | string
    photoPath?: StringNullableFilter<"Member"> | string | null
    createdAt?: DateTimeFilter<"Member"> | Date | string
    updatedAt?: DateTimeFilter<"Member"> | Date | string
    orgMember?: XOR<OrgMemberNullableScalarRelationFilter, OrgMemberWhereInput> | null
    blogPosts?: BlogPostListRelationFilter
    blogComments?: BlogCommentListRelationFilter
    blogLikes?: BlogLikeListRelationFilter
  }, "id" | "nisn">

  export type MemberOrderByWithAggregationInput = {
    id?: SortOrder
    nisn?: SortOrderInput | SortOrder
    name?: SortOrder
    className?: SortOrder
    whatsappNumber?: SortOrder
    email?: SortOrder
    gender?: SortOrder
    asalSekolah?: SortOrder
    password?: SortOrder
    plainPassword?: SortOrderInput | SortOrder
    status?: SortOrder
    joinYear?: SortOrder
    role?: SortOrder
    photoPath?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: MemberCountOrderByAggregateInput
    _avg?: MemberAvgOrderByAggregateInput
    _max?: MemberMaxOrderByAggregateInput
    _min?: MemberMinOrderByAggregateInput
    _sum?: MemberSumOrderByAggregateInput
  }

  export type MemberScalarWhereWithAggregatesInput = {
    AND?: MemberScalarWhereWithAggregatesInput | MemberScalarWhereWithAggregatesInput[]
    OR?: MemberScalarWhereWithAggregatesInput[]
    NOT?: MemberScalarWhereWithAggregatesInput | MemberScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Member"> | string
    nisn?: StringNullableWithAggregatesFilter<"Member"> | string | null
    name?: StringWithAggregatesFilter<"Member"> | string
    className?: StringWithAggregatesFilter<"Member"> | string
    whatsappNumber?: StringWithAggregatesFilter<"Member"> | string
    email?: StringWithAggregatesFilter<"Member"> | string
    gender?: StringWithAggregatesFilter<"Member"> | string
    asalSekolah?: StringWithAggregatesFilter<"Member"> | string
    password?: StringWithAggregatesFilter<"Member"> | string
    plainPassword?: StringNullableWithAggregatesFilter<"Member"> | string | null
    status?: EnumMemberStatusWithAggregatesFilter<"Member"> | $Enums.MemberStatus
    joinYear?: IntWithAggregatesFilter<"Member"> | number
    role?: StringWithAggregatesFilter<"Member"> | string
    photoPath?: StringNullableWithAggregatesFilter<"Member"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Member"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Member"> | Date | string
  }

  export type OrgMemberWhereInput = {
    AND?: OrgMemberWhereInput | OrgMemberWhereInput[]
    OR?: OrgMemberWhereInput[]
    NOT?: OrgMemberWhereInput | OrgMemberWhereInput[]
    id?: StringFilter<"OrgMember"> | string
    name?: StringFilter<"OrgMember"> | string
    role?: StringFilter<"OrgMember"> | string
    jabatan?: StringFilter<"OrgMember"> | string
    yearStart?: IntFilter<"OrgMember"> | number
    yearEnd?: IntNullableFilter<"OrgMember"> | number | null
    isCurrent?: BoolFilter<"OrgMember"> | boolean
    photoPath?: StringNullableFilter<"OrgMember"> | string | null
    quote?: StringNullableFilter<"OrgMember"> | string | null
    memberId?: StringNullableFilter<"OrgMember"> | string | null
    createdAt?: DateTimeFilter<"OrgMember"> | Date | string
    updatedAt?: DateTimeFilter<"OrgMember"> | Date | string
    member?: XOR<MemberNullableScalarRelationFilter, MemberWhereInput> | null
  }

  export type OrgMemberOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    role?: SortOrder
    jabatan?: SortOrder
    yearStart?: SortOrder
    yearEnd?: SortOrderInput | SortOrder
    isCurrent?: SortOrder
    photoPath?: SortOrderInput | SortOrder
    quote?: SortOrderInput | SortOrder
    memberId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    member?: MemberOrderByWithRelationInput
    _relevance?: OrgMemberOrderByRelevanceInput
  }

  export type OrgMemberWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    memberId?: string
    AND?: OrgMemberWhereInput | OrgMemberWhereInput[]
    OR?: OrgMemberWhereInput[]
    NOT?: OrgMemberWhereInput | OrgMemberWhereInput[]
    name?: StringFilter<"OrgMember"> | string
    role?: StringFilter<"OrgMember"> | string
    jabatan?: StringFilter<"OrgMember"> | string
    yearStart?: IntFilter<"OrgMember"> | number
    yearEnd?: IntNullableFilter<"OrgMember"> | number | null
    isCurrent?: BoolFilter<"OrgMember"> | boolean
    photoPath?: StringNullableFilter<"OrgMember"> | string | null
    quote?: StringNullableFilter<"OrgMember"> | string | null
    createdAt?: DateTimeFilter<"OrgMember"> | Date | string
    updatedAt?: DateTimeFilter<"OrgMember"> | Date | string
    member?: XOR<MemberNullableScalarRelationFilter, MemberWhereInput> | null
  }, "id" | "memberId">

  export type OrgMemberOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    role?: SortOrder
    jabatan?: SortOrder
    yearStart?: SortOrder
    yearEnd?: SortOrderInput | SortOrder
    isCurrent?: SortOrder
    photoPath?: SortOrderInput | SortOrder
    quote?: SortOrderInput | SortOrder
    memberId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: OrgMemberCountOrderByAggregateInput
    _avg?: OrgMemberAvgOrderByAggregateInput
    _max?: OrgMemberMaxOrderByAggregateInput
    _min?: OrgMemberMinOrderByAggregateInput
    _sum?: OrgMemberSumOrderByAggregateInput
  }

  export type OrgMemberScalarWhereWithAggregatesInput = {
    AND?: OrgMemberScalarWhereWithAggregatesInput | OrgMemberScalarWhereWithAggregatesInput[]
    OR?: OrgMemberScalarWhereWithAggregatesInput[]
    NOT?: OrgMemberScalarWhereWithAggregatesInput | OrgMemberScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"OrgMember"> | string
    name?: StringWithAggregatesFilter<"OrgMember"> | string
    role?: StringWithAggregatesFilter<"OrgMember"> | string
    jabatan?: StringWithAggregatesFilter<"OrgMember"> | string
    yearStart?: IntWithAggregatesFilter<"OrgMember"> | number
    yearEnd?: IntNullableWithAggregatesFilter<"OrgMember"> | number | null
    isCurrent?: BoolWithAggregatesFilter<"OrgMember"> | boolean
    photoPath?: StringNullableWithAggregatesFilter<"OrgMember"> | string | null
    quote?: StringNullableWithAggregatesFilter<"OrgMember"> | string | null
    memberId?: StringNullableWithAggregatesFilter<"OrgMember"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"OrgMember"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"OrgMember"> | Date | string
  }

  export type PasswordResetOtpWhereInput = {
    AND?: PasswordResetOtpWhereInput | PasswordResetOtpWhereInput[]
    OR?: PasswordResetOtpWhereInput[]
    NOT?: PasswordResetOtpWhereInput | PasswordResetOtpWhereInput[]
    id?: StringFilter<"PasswordResetOtp"> | string
    identifier?: StringFilter<"PasswordResetOtp"> | string
    otpCode?: StringFilter<"PasswordResetOtp"> | string
    expiresAt?: DateTimeFilter<"PasswordResetOtp"> | Date | string
    isUsed?: BoolFilter<"PasswordResetOtp"> | boolean
    createdAt?: DateTimeFilter<"PasswordResetOtp"> | Date | string
  }

  export type PasswordResetOtpOrderByWithRelationInput = {
    id?: SortOrder
    identifier?: SortOrder
    otpCode?: SortOrder
    expiresAt?: SortOrder
    isUsed?: SortOrder
    createdAt?: SortOrder
    _relevance?: PasswordResetOtpOrderByRelevanceInput
  }

  export type PasswordResetOtpWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: PasswordResetOtpWhereInput | PasswordResetOtpWhereInput[]
    OR?: PasswordResetOtpWhereInput[]
    NOT?: PasswordResetOtpWhereInput | PasswordResetOtpWhereInput[]
    identifier?: StringFilter<"PasswordResetOtp"> | string
    otpCode?: StringFilter<"PasswordResetOtp"> | string
    expiresAt?: DateTimeFilter<"PasswordResetOtp"> | Date | string
    isUsed?: BoolFilter<"PasswordResetOtp"> | boolean
    createdAt?: DateTimeFilter<"PasswordResetOtp"> | Date | string
  }, "id">

  export type PasswordResetOtpOrderByWithAggregationInput = {
    id?: SortOrder
    identifier?: SortOrder
    otpCode?: SortOrder
    expiresAt?: SortOrder
    isUsed?: SortOrder
    createdAt?: SortOrder
    _count?: PasswordResetOtpCountOrderByAggregateInput
    _max?: PasswordResetOtpMaxOrderByAggregateInput
    _min?: PasswordResetOtpMinOrderByAggregateInput
  }

  export type PasswordResetOtpScalarWhereWithAggregatesInput = {
    AND?: PasswordResetOtpScalarWhereWithAggregatesInput | PasswordResetOtpScalarWhereWithAggregatesInput[]
    OR?: PasswordResetOtpScalarWhereWithAggregatesInput[]
    NOT?: PasswordResetOtpScalarWhereWithAggregatesInput | PasswordResetOtpScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"PasswordResetOtp"> | string
    identifier?: StringWithAggregatesFilter<"PasswordResetOtp"> | string
    otpCode?: StringWithAggregatesFilter<"PasswordResetOtp"> | string
    expiresAt?: DateTimeWithAggregatesFilter<"PasswordResetOtp"> | Date | string
    isUsed?: BoolWithAggregatesFilter<"PasswordResetOtp"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"PasswordResetOtp"> | Date | string
  }

  export type AlumniTestimonialWhereInput = {
    AND?: AlumniTestimonialWhereInput | AlumniTestimonialWhereInput[]
    OR?: AlumniTestimonialWhereInput[]
    NOT?: AlumniTestimonialWhereInput | AlumniTestimonialWhereInput[]
    id?: StringFilter<"AlumniTestimonial"> | string
    name?: StringFilter<"AlumniTestimonial"> | string
    angkatan?: StringFilter<"AlumniTestimonial"> | string
    photoPath?: StringNullableFilter<"AlumniTestimonial"> | string | null
    content?: StringFilter<"AlumniTestimonial"> | string
    createdAt?: DateTimeFilter<"AlumniTestimonial"> | Date | string
    updatedAt?: DateTimeFilter<"AlumniTestimonial"> | Date | string
  }

  export type AlumniTestimonialOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    angkatan?: SortOrder
    photoPath?: SortOrderInput | SortOrder
    content?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _relevance?: AlumniTestimonialOrderByRelevanceInput
  }

  export type AlumniTestimonialWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: AlumniTestimonialWhereInput | AlumniTestimonialWhereInput[]
    OR?: AlumniTestimonialWhereInput[]
    NOT?: AlumniTestimonialWhereInput | AlumniTestimonialWhereInput[]
    name?: StringFilter<"AlumniTestimonial"> | string
    angkatan?: StringFilter<"AlumniTestimonial"> | string
    photoPath?: StringNullableFilter<"AlumniTestimonial"> | string | null
    content?: StringFilter<"AlumniTestimonial"> | string
    createdAt?: DateTimeFilter<"AlumniTestimonial"> | Date | string
    updatedAt?: DateTimeFilter<"AlumniTestimonial"> | Date | string
  }, "id">

  export type AlumniTestimonialOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    angkatan?: SortOrder
    photoPath?: SortOrderInput | SortOrder
    content?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: AlumniTestimonialCountOrderByAggregateInput
    _max?: AlumniTestimonialMaxOrderByAggregateInput
    _min?: AlumniTestimonialMinOrderByAggregateInput
  }

  export type AlumniTestimonialScalarWhereWithAggregatesInput = {
    AND?: AlumniTestimonialScalarWhereWithAggregatesInput | AlumniTestimonialScalarWhereWithAggregatesInput[]
    OR?: AlumniTestimonialScalarWhereWithAggregatesInput[]
    NOT?: AlumniTestimonialScalarWhereWithAggregatesInput | AlumniTestimonialScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"AlumniTestimonial"> | string
    name?: StringWithAggregatesFilter<"AlumniTestimonial"> | string
    angkatan?: StringWithAggregatesFilter<"AlumniTestimonial"> | string
    photoPath?: StringNullableWithAggregatesFilter<"AlumniTestimonial"> | string | null
    content?: StringWithAggregatesFilter<"AlumniTestimonial"> | string
    createdAt?: DateTimeWithAggregatesFilter<"AlumniTestimonial"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"AlumniTestimonial"> | Date | string
  }

  export type CandidateCreateInput = {
    id?: string
    nisn: string
    name: string
    className: string
    whatsappNumber: string
    email: string
    gender: string
    asalSekolah?: string
    reason: string
    status?: $Enums.Status
    photoPath?: string | null
    password?: string | null
    plainPassword?: string | null
    emailNotified?: boolean
    waNotified?: boolean
    lastStatus?: $Enums.Status
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CandidateUncheckedCreateInput = {
    id?: string
    nisn: string
    name: string
    className: string
    whatsappNumber: string
    email: string
    gender: string
    asalSekolah?: string
    reason: string
    status?: $Enums.Status
    photoPath?: string | null
    password?: string | null
    plainPassword?: string | null
    emailNotified?: boolean
    waNotified?: boolean
    lastStatus?: $Enums.Status
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CandidateUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    nisn?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    className?: StringFieldUpdateOperationsInput | string
    whatsappNumber?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    gender?: StringFieldUpdateOperationsInput | string
    asalSekolah?: StringFieldUpdateOperationsInput | string
    reason?: StringFieldUpdateOperationsInput | string
    status?: EnumStatusFieldUpdateOperationsInput | $Enums.Status
    photoPath?: NullableStringFieldUpdateOperationsInput | string | null
    password?: NullableStringFieldUpdateOperationsInput | string | null
    plainPassword?: NullableStringFieldUpdateOperationsInput | string | null
    emailNotified?: BoolFieldUpdateOperationsInput | boolean
    waNotified?: BoolFieldUpdateOperationsInput | boolean
    lastStatus?: EnumStatusFieldUpdateOperationsInput | $Enums.Status
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CandidateUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    nisn?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    className?: StringFieldUpdateOperationsInput | string
    whatsappNumber?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    gender?: StringFieldUpdateOperationsInput | string
    asalSekolah?: StringFieldUpdateOperationsInput | string
    reason?: StringFieldUpdateOperationsInput | string
    status?: EnumStatusFieldUpdateOperationsInput | $Enums.Status
    photoPath?: NullableStringFieldUpdateOperationsInput | string | null
    password?: NullableStringFieldUpdateOperationsInput | string | null
    plainPassword?: NullableStringFieldUpdateOperationsInput | string | null
    emailNotified?: BoolFieldUpdateOperationsInput | boolean
    waNotified?: BoolFieldUpdateOperationsInput | boolean
    lastStatus?: EnumStatusFieldUpdateOperationsInput | $Enums.Status
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CandidateCreateManyInput = {
    id?: string
    nisn: string
    name: string
    className: string
    whatsappNumber: string
    email: string
    gender: string
    asalSekolah?: string
    reason: string
    status?: $Enums.Status
    photoPath?: string | null
    password?: string | null
    plainPassword?: string | null
    emailNotified?: boolean
    waNotified?: boolean
    lastStatus?: $Enums.Status
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CandidateUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    nisn?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    className?: StringFieldUpdateOperationsInput | string
    whatsappNumber?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    gender?: StringFieldUpdateOperationsInput | string
    asalSekolah?: StringFieldUpdateOperationsInput | string
    reason?: StringFieldUpdateOperationsInput | string
    status?: EnumStatusFieldUpdateOperationsInput | $Enums.Status
    photoPath?: NullableStringFieldUpdateOperationsInput | string | null
    password?: NullableStringFieldUpdateOperationsInput | string | null
    plainPassword?: NullableStringFieldUpdateOperationsInput | string | null
    emailNotified?: BoolFieldUpdateOperationsInput | boolean
    waNotified?: BoolFieldUpdateOperationsInput | boolean
    lastStatus?: EnumStatusFieldUpdateOperationsInput | $Enums.Status
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CandidateUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    nisn?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    className?: StringFieldUpdateOperationsInput | string
    whatsappNumber?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    gender?: StringFieldUpdateOperationsInput | string
    asalSekolah?: StringFieldUpdateOperationsInput | string
    reason?: StringFieldUpdateOperationsInput | string
    status?: EnumStatusFieldUpdateOperationsInput | $Enums.Status
    photoPath?: NullableStringFieldUpdateOperationsInput | string | null
    password?: NullableStringFieldUpdateOperationsInput | string | null
    plainPassword?: NullableStringFieldUpdateOperationsInput | string | null
    emailNotified?: BoolFieldUpdateOperationsInput | boolean
    waNotified?: BoolFieldUpdateOperationsInput | boolean
    lastStatus?: EnumStatusFieldUpdateOperationsInput | $Enums.Status
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AdminCreateInput = {
    id?: string
    username: string
    password: string
    role?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    posts?: PostCreateNestedManyWithoutAuthorInput
    blogPosts?: BlogPostCreateNestedManyWithoutAuthorInput
  }

  export type AdminUncheckedCreateInput = {
    id?: string
    username: string
    password: string
    role?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    posts?: PostUncheckedCreateNestedManyWithoutAuthorInput
    blogPosts?: BlogPostUncheckedCreateNestedManyWithoutAuthorInput
  }

  export type AdminUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    posts?: PostUpdateManyWithoutAuthorNestedInput
    blogPosts?: BlogPostUpdateManyWithoutAuthorNestedInput
  }

  export type AdminUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    posts?: PostUncheckedUpdateManyWithoutAuthorNestedInput
    blogPosts?: BlogPostUncheckedUpdateManyWithoutAuthorNestedInput
  }

  export type AdminCreateManyInput = {
    id?: string
    username: string
    password: string
    role?: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type AdminUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AdminUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PostCreateInput = {
    id?: string
    title: string
    slug: string
    content: string
    views?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    author: AdminCreateNestedOneWithoutPostsInput
  }

  export type PostUncheckedCreateInput = {
    id?: string
    title: string
    slug: string
    content: string
    authorId: string
    views?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PostUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    views?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    author?: AdminUpdateOneRequiredWithoutPostsNestedInput
  }

  export type PostUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    authorId?: StringFieldUpdateOperationsInput | string
    views?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PostCreateManyInput = {
    id?: string
    title: string
    slug: string
    content: string
    authorId: string
    views?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PostUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    views?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PostUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    authorId?: StringFieldUpdateOperationsInput | string
    views?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BlogPostCreateInput = {
    id?: string
    title: string
    slug: string
    content: string
    category?: string
    tags?: string
    status?: string
    featuredImg?: string | null
    views?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    author?: AdminCreateNestedOneWithoutBlogPostsInput
    memberAuthor?: MemberCreateNestedOneWithoutBlogPostsInput
    comments?: BlogCommentCreateNestedManyWithoutPostInput
    likes?: BlogLikeCreateNestedManyWithoutPostInput
  }

  export type BlogPostUncheckedCreateInput = {
    id?: string
    title: string
    slug: string
    content: string
    category?: string
    tags?: string
    status?: string
    featuredImg?: string | null
    views?: number
    authorId?: string | null
    memberId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    comments?: BlogCommentUncheckedCreateNestedManyWithoutPostInput
    likes?: BlogLikeUncheckedCreateNestedManyWithoutPostInput
  }

  export type BlogPostUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    tags?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    featuredImg?: NullableStringFieldUpdateOperationsInput | string | null
    views?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    author?: AdminUpdateOneWithoutBlogPostsNestedInput
    memberAuthor?: MemberUpdateOneWithoutBlogPostsNestedInput
    comments?: BlogCommentUpdateManyWithoutPostNestedInput
    likes?: BlogLikeUpdateManyWithoutPostNestedInput
  }

  export type BlogPostUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    tags?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    featuredImg?: NullableStringFieldUpdateOperationsInput | string | null
    views?: IntFieldUpdateOperationsInput | number
    authorId?: NullableStringFieldUpdateOperationsInput | string | null
    memberId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    comments?: BlogCommentUncheckedUpdateManyWithoutPostNestedInput
    likes?: BlogLikeUncheckedUpdateManyWithoutPostNestedInput
  }

  export type BlogPostCreateManyInput = {
    id?: string
    title: string
    slug: string
    content: string
    category?: string
    tags?: string
    status?: string
    featuredImg?: string | null
    views?: number
    authorId?: string | null
    memberId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type BlogPostUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    tags?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    featuredImg?: NullableStringFieldUpdateOperationsInput | string | null
    views?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BlogPostUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    tags?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    featuredImg?: NullableStringFieldUpdateOperationsInput | string | null
    views?: IntFieldUpdateOperationsInput | number
    authorId?: NullableStringFieldUpdateOperationsInput | string | null
    memberId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BlogCommentCreateInput = {
    id?: string
    content: string
    username: string
    createdAt?: Date | string
    updatedAt?: Date | string
    post: BlogPostCreateNestedOneWithoutCommentsInput
    member?: MemberCreateNestedOneWithoutBlogCommentsInput
    parent?: BlogCommentCreateNestedOneWithoutRepliesInput
    replies?: BlogCommentCreateNestedManyWithoutParentInput
  }

  export type BlogCommentUncheckedCreateInput = {
    id?: string
    postId: string
    content: string
    memberId?: string | null
    username: string
    parentId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    replies?: BlogCommentUncheckedCreateNestedManyWithoutParentInput
  }

  export type BlogCommentUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    post?: BlogPostUpdateOneRequiredWithoutCommentsNestedInput
    member?: MemberUpdateOneWithoutBlogCommentsNestedInput
    parent?: BlogCommentUpdateOneWithoutRepliesNestedInput
    replies?: BlogCommentUpdateManyWithoutParentNestedInput
  }

  export type BlogCommentUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    postId?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    memberId?: NullableStringFieldUpdateOperationsInput | string | null
    username?: StringFieldUpdateOperationsInput | string
    parentId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    replies?: BlogCommentUncheckedUpdateManyWithoutParentNestedInput
  }

  export type BlogCommentCreateManyInput = {
    id?: string
    postId: string
    content: string
    memberId?: string | null
    username: string
    parentId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type BlogCommentUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BlogCommentUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    postId?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    memberId?: NullableStringFieldUpdateOperationsInput | string | null
    username?: StringFieldUpdateOperationsInput | string
    parentId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BlogLikeCreateInput = {
    id?: string
    guestId?: string | null
    createdAt?: Date | string
    post: BlogPostCreateNestedOneWithoutLikesInput
    member?: MemberCreateNestedOneWithoutBlogLikesInput
  }

  export type BlogLikeUncheckedCreateInput = {
    id?: string
    postId: string
    memberId?: string | null
    guestId?: string | null
    createdAt?: Date | string
  }

  export type BlogLikeUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    guestId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    post?: BlogPostUpdateOneRequiredWithoutLikesNestedInput
    member?: MemberUpdateOneWithoutBlogLikesNestedInput
  }

  export type BlogLikeUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    postId?: StringFieldUpdateOperationsInput | string
    memberId?: NullableStringFieldUpdateOperationsInput | string | null
    guestId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BlogLikeCreateManyInput = {
    id?: string
    postId: string
    memberId?: string | null
    guestId?: string | null
    createdAt?: Date | string
  }

  export type BlogLikeUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    guestId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BlogLikeUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    postId?: StringFieldUpdateOperationsInput | string
    memberId?: NullableStringFieldUpdateOperationsInput | string | null
    guestId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SettingCreateInput = {
    key: string
    value: string
  }

  export type SettingUncheckedCreateInput = {
    key: string
    value: string
  }

  export type SettingUpdateInput = {
    key?: StringFieldUpdateOperationsInput | string
    value?: StringFieldUpdateOperationsInput | string
  }

  export type SettingUncheckedUpdateInput = {
    key?: StringFieldUpdateOperationsInput | string
    value?: StringFieldUpdateOperationsInput | string
  }

  export type SettingCreateManyInput = {
    key: string
    value: string
  }

  export type SettingUpdateManyMutationInput = {
    key?: StringFieldUpdateOperationsInput | string
    value?: StringFieldUpdateOperationsInput | string
  }

  export type SettingUncheckedUpdateManyInput = {
    key?: StringFieldUpdateOperationsInput | string
    value?: StringFieldUpdateOperationsInput | string
  }

  export type MemberCreateInput = {
    id?: string
    nisn?: string | null
    name: string
    className: string
    whatsappNumber: string
    email: string
    gender: string
    asalSekolah?: string
    password: string
    plainPassword?: string | null
    status?: $Enums.MemberStatus
    joinYear?: number
    role?: string
    photoPath?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    orgMember?: OrgMemberCreateNestedOneWithoutMemberInput
    blogPosts?: BlogPostCreateNestedManyWithoutMemberAuthorInput
    blogComments?: BlogCommentCreateNestedManyWithoutMemberInput
    blogLikes?: BlogLikeCreateNestedManyWithoutMemberInput
  }

  export type MemberUncheckedCreateInput = {
    id?: string
    nisn?: string | null
    name: string
    className: string
    whatsappNumber: string
    email: string
    gender: string
    asalSekolah?: string
    password: string
    plainPassword?: string | null
    status?: $Enums.MemberStatus
    joinYear?: number
    role?: string
    photoPath?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    orgMember?: OrgMemberUncheckedCreateNestedOneWithoutMemberInput
    blogPosts?: BlogPostUncheckedCreateNestedManyWithoutMemberAuthorInput
    blogComments?: BlogCommentUncheckedCreateNestedManyWithoutMemberInput
    blogLikes?: BlogLikeUncheckedCreateNestedManyWithoutMemberInput
  }

  export type MemberUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    nisn?: NullableStringFieldUpdateOperationsInput | string | null
    name?: StringFieldUpdateOperationsInput | string
    className?: StringFieldUpdateOperationsInput | string
    whatsappNumber?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    gender?: StringFieldUpdateOperationsInput | string
    asalSekolah?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    plainPassword?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumMemberStatusFieldUpdateOperationsInput | $Enums.MemberStatus
    joinYear?: IntFieldUpdateOperationsInput | number
    role?: StringFieldUpdateOperationsInput | string
    photoPath?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    orgMember?: OrgMemberUpdateOneWithoutMemberNestedInput
    blogPosts?: BlogPostUpdateManyWithoutMemberAuthorNestedInput
    blogComments?: BlogCommentUpdateManyWithoutMemberNestedInput
    blogLikes?: BlogLikeUpdateManyWithoutMemberNestedInput
  }

  export type MemberUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    nisn?: NullableStringFieldUpdateOperationsInput | string | null
    name?: StringFieldUpdateOperationsInput | string
    className?: StringFieldUpdateOperationsInput | string
    whatsappNumber?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    gender?: StringFieldUpdateOperationsInput | string
    asalSekolah?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    plainPassword?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumMemberStatusFieldUpdateOperationsInput | $Enums.MemberStatus
    joinYear?: IntFieldUpdateOperationsInput | number
    role?: StringFieldUpdateOperationsInput | string
    photoPath?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    orgMember?: OrgMemberUncheckedUpdateOneWithoutMemberNestedInput
    blogPosts?: BlogPostUncheckedUpdateManyWithoutMemberAuthorNestedInput
    blogComments?: BlogCommentUncheckedUpdateManyWithoutMemberNestedInput
    blogLikes?: BlogLikeUncheckedUpdateManyWithoutMemberNestedInput
  }

  export type MemberCreateManyInput = {
    id?: string
    nisn?: string | null
    name: string
    className: string
    whatsappNumber: string
    email: string
    gender: string
    asalSekolah?: string
    password: string
    plainPassword?: string | null
    status?: $Enums.MemberStatus
    joinYear?: number
    role?: string
    photoPath?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type MemberUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    nisn?: NullableStringFieldUpdateOperationsInput | string | null
    name?: StringFieldUpdateOperationsInput | string
    className?: StringFieldUpdateOperationsInput | string
    whatsappNumber?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    gender?: StringFieldUpdateOperationsInput | string
    asalSekolah?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    plainPassword?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumMemberStatusFieldUpdateOperationsInput | $Enums.MemberStatus
    joinYear?: IntFieldUpdateOperationsInput | number
    role?: StringFieldUpdateOperationsInput | string
    photoPath?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MemberUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    nisn?: NullableStringFieldUpdateOperationsInput | string | null
    name?: StringFieldUpdateOperationsInput | string
    className?: StringFieldUpdateOperationsInput | string
    whatsappNumber?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    gender?: StringFieldUpdateOperationsInput | string
    asalSekolah?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    plainPassword?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumMemberStatusFieldUpdateOperationsInput | $Enums.MemberStatus
    joinYear?: IntFieldUpdateOperationsInput | number
    role?: StringFieldUpdateOperationsInput | string
    photoPath?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type OrgMemberCreateInput = {
    id?: string
    name: string
    role: string
    jabatan: string
    yearStart: number
    yearEnd?: number | null
    isCurrent?: boolean
    photoPath?: string | null
    quote?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    member?: MemberCreateNestedOneWithoutOrgMemberInput
  }

  export type OrgMemberUncheckedCreateInput = {
    id?: string
    name: string
    role: string
    jabatan: string
    yearStart: number
    yearEnd?: number | null
    isCurrent?: boolean
    photoPath?: string | null
    quote?: string | null
    memberId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type OrgMemberUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    jabatan?: StringFieldUpdateOperationsInput | string
    yearStart?: IntFieldUpdateOperationsInput | number
    yearEnd?: NullableIntFieldUpdateOperationsInput | number | null
    isCurrent?: BoolFieldUpdateOperationsInput | boolean
    photoPath?: NullableStringFieldUpdateOperationsInput | string | null
    quote?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    member?: MemberUpdateOneWithoutOrgMemberNestedInput
  }

  export type OrgMemberUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    jabatan?: StringFieldUpdateOperationsInput | string
    yearStart?: IntFieldUpdateOperationsInput | number
    yearEnd?: NullableIntFieldUpdateOperationsInput | number | null
    isCurrent?: BoolFieldUpdateOperationsInput | boolean
    photoPath?: NullableStringFieldUpdateOperationsInput | string | null
    quote?: NullableStringFieldUpdateOperationsInput | string | null
    memberId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type OrgMemberCreateManyInput = {
    id?: string
    name: string
    role: string
    jabatan: string
    yearStart: number
    yearEnd?: number | null
    isCurrent?: boolean
    photoPath?: string | null
    quote?: string | null
    memberId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type OrgMemberUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    jabatan?: StringFieldUpdateOperationsInput | string
    yearStart?: IntFieldUpdateOperationsInput | number
    yearEnd?: NullableIntFieldUpdateOperationsInput | number | null
    isCurrent?: BoolFieldUpdateOperationsInput | boolean
    photoPath?: NullableStringFieldUpdateOperationsInput | string | null
    quote?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type OrgMemberUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    jabatan?: StringFieldUpdateOperationsInput | string
    yearStart?: IntFieldUpdateOperationsInput | number
    yearEnd?: NullableIntFieldUpdateOperationsInput | number | null
    isCurrent?: BoolFieldUpdateOperationsInput | boolean
    photoPath?: NullableStringFieldUpdateOperationsInput | string | null
    quote?: NullableStringFieldUpdateOperationsInput | string | null
    memberId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PasswordResetOtpCreateInput = {
    id?: string
    identifier: string
    otpCode: string
    expiresAt: Date | string
    isUsed?: boolean
    createdAt?: Date | string
  }

  export type PasswordResetOtpUncheckedCreateInput = {
    id?: string
    identifier: string
    otpCode: string
    expiresAt: Date | string
    isUsed?: boolean
    createdAt?: Date | string
  }

  export type PasswordResetOtpUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    identifier?: StringFieldUpdateOperationsInput | string
    otpCode?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    isUsed?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PasswordResetOtpUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    identifier?: StringFieldUpdateOperationsInput | string
    otpCode?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    isUsed?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PasswordResetOtpCreateManyInput = {
    id?: string
    identifier: string
    otpCode: string
    expiresAt: Date | string
    isUsed?: boolean
    createdAt?: Date | string
  }

  export type PasswordResetOtpUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    identifier?: StringFieldUpdateOperationsInput | string
    otpCode?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    isUsed?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PasswordResetOtpUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    identifier?: StringFieldUpdateOperationsInput | string
    otpCode?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    isUsed?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AlumniTestimonialCreateInput = {
    id?: string
    name: string
    angkatan: string
    photoPath?: string | null
    content: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type AlumniTestimonialUncheckedCreateInput = {
    id?: string
    name: string
    angkatan: string
    photoPath?: string | null
    content: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type AlumniTestimonialUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    angkatan?: StringFieldUpdateOperationsInput | string
    photoPath?: NullableStringFieldUpdateOperationsInput | string | null
    content?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AlumniTestimonialUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    angkatan?: StringFieldUpdateOperationsInput | string
    photoPath?: NullableStringFieldUpdateOperationsInput | string | null
    content?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AlumniTestimonialCreateManyInput = {
    id?: string
    name: string
    angkatan: string
    photoPath?: string | null
    content: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type AlumniTestimonialUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    angkatan?: StringFieldUpdateOperationsInput | string
    photoPath?: NullableStringFieldUpdateOperationsInput | string | null
    content?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AlumniTestimonialUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    angkatan?: StringFieldUpdateOperationsInput | string
    photoPath?: NullableStringFieldUpdateOperationsInput | string | null
    content?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type EnumStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.Status | EnumStatusFieldRefInput<$PrismaModel>
    in?: $Enums.Status[]
    notIn?: $Enums.Status[]
    not?: NestedEnumStatusFilter<$PrismaModel> | $Enums.Status
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type CandidateOrderByRelevanceInput = {
    fields: CandidateOrderByRelevanceFieldEnum | CandidateOrderByRelevanceFieldEnum[]
    sort: SortOrder
    search: string
  }

  export type CandidateCountOrderByAggregateInput = {
    id?: SortOrder
    nisn?: SortOrder
    name?: SortOrder
    className?: SortOrder
    whatsappNumber?: SortOrder
    email?: SortOrder
    gender?: SortOrder
    asalSekolah?: SortOrder
    reason?: SortOrder
    status?: SortOrder
    photoPath?: SortOrder
    password?: SortOrder
    plainPassword?: SortOrder
    emailNotified?: SortOrder
    waNotified?: SortOrder
    lastStatus?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CandidateMaxOrderByAggregateInput = {
    id?: SortOrder
    nisn?: SortOrder
    name?: SortOrder
    className?: SortOrder
    whatsappNumber?: SortOrder
    email?: SortOrder
    gender?: SortOrder
    asalSekolah?: SortOrder
    reason?: SortOrder
    status?: SortOrder
    photoPath?: SortOrder
    password?: SortOrder
    plainPassword?: SortOrder
    emailNotified?: SortOrder
    waNotified?: SortOrder
    lastStatus?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CandidateMinOrderByAggregateInput = {
    id?: SortOrder
    nisn?: SortOrder
    name?: SortOrder
    className?: SortOrder
    whatsappNumber?: SortOrder
    email?: SortOrder
    gender?: SortOrder
    asalSekolah?: SortOrder
    reason?: SortOrder
    status?: SortOrder
    photoPath?: SortOrder
    password?: SortOrder
    plainPassword?: SortOrder
    emailNotified?: SortOrder
    waNotified?: SortOrder
    lastStatus?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type EnumStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.Status | EnumStatusFieldRefInput<$PrismaModel>
    in?: $Enums.Status[]
    notIn?: $Enums.Status[]
    not?: NestedEnumStatusWithAggregatesFilter<$PrismaModel> | $Enums.Status
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumStatusFilter<$PrismaModel>
    _max?: NestedEnumStatusFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type PostListRelationFilter = {
    every?: PostWhereInput
    some?: PostWhereInput
    none?: PostWhereInput
  }

  export type BlogPostListRelationFilter = {
    every?: BlogPostWhereInput
    some?: BlogPostWhereInput
    none?: BlogPostWhereInput
  }

  export type PostOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type BlogPostOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type AdminOrderByRelevanceInput = {
    fields: AdminOrderByRelevanceFieldEnum | AdminOrderByRelevanceFieldEnum[]
    sort: SortOrder
    search: string
  }

  export type AdminCountOrderByAggregateInput = {
    id?: SortOrder
    username?: SortOrder
    password?: SortOrder
    role?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type AdminMaxOrderByAggregateInput = {
    id?: SortOrder
    username?: SortOrder
    password?: SortOrder
    role?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type AdminMinOrderByAggregateInput = {
    id?: SortOrder
    username?: SortOrder
    password?: SortOrder
    role?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type AdminScalarRelationFilter = {
    is?: AdminWhereInput
    isNot?: AdminWhereInput
  }

  export type PostOrderByRelevanceInput = {
    fields: PostOrderByRelevanceFieldEnum | PostOrderByRelevanceFieldEnum[]
    sort: SortOrder
    search: string
  }

  export type PostCountOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    slug?: SortOrder
    content?: SortOrder
    authorId?: SortOrder
    views?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PostAvgOrderByAggregateInput = {
    views?: SortOrder
  }

  export type PostMaxOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    slug?: SortOrder
    content?: SortOrder
    authorId?: SortOrder
    views?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PostMinOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    slug?: SortOrder
    content?: SortOrder
    authorId?: SortOrder
    views?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PostSumOrderByAggregateInput = {
    views?: SortOrder
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type AdminNullableScalarRelationFilter = {
    is?: AdminWhereInput | null
    isNot?: AdminWhereInput | null
  }

  export type MemberNullableScalarRelationFilter = {
    is?: MemberWhereInput | null
    isNot?: MemberWhereInput | null
  }

  export type BlogCommentListRelationFilter = {
    every?: BlogCommentWhereInput
    some?: BlogCommentWhereInput
    none?: BlogCommentWhereInput
  }

  export type BlogLikeListRelationFilter = {
    every?: BlogLikeWhereInput
    some?: BlogLikeWhereInput
    none?: BlogLikeWhereInput
  }

  export type BlogCommentOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type BlogLikeOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type BlogPostOrderByRelevanceInput = {
    fields: BlogPostOrderByRelevanceFieldEnum | BlogPostOrderByRelevanceFieldEnum[]
    sort: SortOrder
    search: string
  }

  export type BlogPostCountOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    slug?: SortOrder
    content?: SortOrder
    category?: SortOrder
    tags?: SortOrder
    status?: SortOrder
    featuredImg?: SortOrder
    views?: SortOrder
    authorId?: SortOrder
    memberId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type BlogPostAvgOrderByAggregateInput = {
    views?: SortOrder
  }

  export type BlogPostMaxOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    slug?: SortOrder
    content?: SortOrder
    category?: SortOrder
    tags?: SortOrder
    status?: SortOrder
    featuredImg?: SortOrder
    views?: SortOrder
    authorId?: SortOrder
    memberId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type BlogPostMinOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    slug?: SortOrder
    content?: SortOrder
    category?: SortOrder
    tags?: SortOrder
    status?: SortOrder
    featuredImg?: SortOrder
    views?: SortOrder
    authorId?: SortOrder
    memberId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type BlogPostSumOrderByAggregateInput = {
    views?: SortOrder
  }

  export type BlogPostScalarRelationFilter = {
    is?: BlogPostWhereInput
    isNot?: BlogPostWhereInput
  }

  export type BlogCommentNullableScalarRelationFilter = {
    is?: BlogCommentWhereInput | null
    isNot?: BlogCommentWhereInput | null
  }

  export type BlogCommentOrderByRelevanceInput = {
    fields: BlogCommentOrderByRelevanceFieldEnum | BlogCommentOrderByRelevanceFieldEnum[]
    sort: SortOrder
    search: string
  }

  export type BlogCommentCountOrderByAggregateInput = {
    id?: SortOrder
    postId?: SortOrder
    content?: SortOrder
    memberId?: SortOrder
    username?: SortOrder
    parentId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type BlogCommentMaxOrderByAggregateInput = {
    id?: SortOrder
    postId?: SortOrder
    content?: SortOrder
    memberId?: SortOrder
    username?: SortOrder
    parentId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type BlogCommentMinOrderByAggregateInput = {
    id?: SortOrder
    postId?: SortOrder
    content?: SortOrder
    memberId?: SortOrder
    username?: SortOrder
    parentId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type BlogLikeOrderByRelevanceInput = {
    fields: BlogLikeOrderByRelevanceFieldEnum | BlogLikeOrderByRelevanceFieldEnum[]
    sort: SortOrder
    search: string
  }

  export type BlogLikeCountOrderByAggregateInput = {
    id?: SortOrder
    postId?: SortOrder
    memberId?: SortOrder
    guestId?: SortOrder
    createdAt?: SortOrder
  }

  export type BlogLikeMaxOrderByAggregateInput = {
    id?: SortOrder
    postId?: SortOrder
    memberId?: SortOrder
    guestId?: SortOrder
    createdAt?: SortOrder
  }

  export type BlogLikeMinOrderByAggregateInput = {
    id?: SortOrder
    postId?: SortOrder
    memberId?: SortOrder
    guestId?: SortOrder
    createdAt?: SortOrder
  }

  export type SettingOrderByRelevanceInput = {
    fields: SettingOrderByRelevanceFieldEnum | SettingOrderByRelevanceFieldEnum[]
    sort: SortOrder
    search: string
  }

  export type SettingCountOrderByAggregateInput = {
    key?: SortOrder
    value?: SortOrder
  }

  export type SettingMaxOrderByAggregateInput = {
    key?: SortOrder
    value?: SortOrder
  }

  export type SettingMinOrderByAggregateInput = {
    key?: SortOrder
    value?: SortOrder
  }

  export type EnumMemberStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.MemberStatus | EnumMemberStatusFieldRefInput<$PrismaModel>
    in?: $Enums.MemberStatus[]
    notIn?: $Enums.MemberStatus[]
    not?: NestedEnumMemberStatusFilter<$PrismaModel> | $Enums.MemberStatus
  }

  export type OrgMemberNullableScalarRelationFilter = {
    is?: OrgMemberWhereInput | null
    isNot?: OrgMemberWhereInput | null
  }

  export type MemberOrderByRelevanceInput = {
    fields: MemberOrderByRelevanceFieldEnum | MemberOrderByRelevanceFieldEnum[]
    sort: SortOrder
    search: string
  }

  export type MemberCountOrderByAggregateInput = {
    id?: SortOrder
    nisn?: SortOrder
    name?: SortOrder
    className?: SortOrder
    whatsappNumber?: SortOrder
    email?: SortOrder
    gender?: SortOrder
    asalSekolah?: SortOrder
    password?: SortOrder
    plainPassword?: SortOrder
    status?: SortOrder
    joinYear?: SortOrder
    role?: SortOrder
    photoPath?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type MemberAvgOrderByAggregateInput = {
    joinYear?: SortOrder
  }

  export type MemberMaxOrderByAggregateInput = {
    id?: SortOrder
    nisn?: SortOrder
    name?: SortOrder
    className?: SortOrder
    whatsappNumber?: SortOrder
    email?: SortOrder
    gender?: SortOrder
    asalSekolah?: SortOrder
    password?: SortOrder
    plainPassword?: SortOrder
    status?: SortOrder
    joinYear?: SortOrder
    role?: SortOrder
    photoPath?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type MemberMinOrderByAggregateInput = {
    id?: SortOrder
    nisn?: SortOrder
    name?: SortOrder
    className?: SortOrder
    whatsappNumber?: SortOrder
    email?: SortOrder
    gender?: SortOrder
    asalSekolah?: SortOrder
    password?: SortOrder
    plainPassword?: SortOrder
    status?: SortOrder
    joinYear?: SortOrder
    role?: SortOrder
    photoPath?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type MemberSumOrderByAggregateInput = {
    joinYear?: SortOrder
  }

  export type EnumMemberStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.MemberStatus | EnumMemberStatusFieldRefInput<$PrismaModel>
    in?: $Enums.MemberStatus[]
    notIn?: $Enums.MemberStatus[]
    not?: NestedEnumMemberStatusWithAggregatesFilter<$PrismaModel> | $Enums.MemberStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumMemberStatusFilter<$PrismaModel>
    _max?: NestedEnumMemberStatusFilter<$PrismaModel>
  }

  export type IntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type OrgMemberOrderByRelevanceInput = {
    fields: OrgMemberOrderByRelevanceFieldEnum | OrgMemberOrderByRelevanceFieldEnum[]
    sort: SortOrder
    search: string
  }

  export type OrgMemberCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    role?: SortOrder
    jabatan?: SortOrder
    yearStart?: SortOrder
    yearEnd?: SortOrder
    isCurrent?: SortOrder
    photoPath?: SortOrder
    quote?: SortOrder
    memberId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type OrgMemberAvgOrderByAggregateInput = {
    yearStart?: SortOrder
    yearEnd?: SortOrder
  }

  export type OrgMemberMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    role?: SortOrder
    jabatan?: SortOrder
    yearStart?: SortOrder
    yearEnd?: SortOrder
    isCurrent?: SortOrder
    photoPath?: SortOrder
    quote?: SortOrder
    memberId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type OrgMemberMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    role?: SortOrder
    jabatan?: SortOrder
    yearStart?: SortOrder
    yearEnd?: SortOrder
    isCurrent?: SortOrder
    photoPath?: SortOrder
    quote?: SortOrder
    memberId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type OrgMemberSumOrderByAggregateInput = {
    yearStart?: SortOrder
    yearEnd?: SortOrder
  }

  export type IntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type PasswordResetOtpOrderByRelevanceInput = {
    fields: PasswordResetOtpOrderByRelevanceFieldEnum | PasswordResetOtpOrderByRelevanceFieldEnum[]
    sort: SortOrder
    search: string
  }

  export type PasswordResetOtpCountOrderByAggregateInput = {
    id?: SortOrder
    identifier?: SortOrder
    otpCode?: SortOrder
    expiresAt?: SortOrder
    isUsed?: SortOrder
    createdAt?: SortOrder
  }

  export type PasswordResetOtpMaxOrderByAggregateInput = {
    id?: SortOrder
    identifier?: SortOrder
    otpCode?: SortOrder
    expiresAt?: SortOrder
    isUsed?: SortOrder
    createdAt?: SortOrder
  }

  export type PasswordResetOtpMinOrderByAggregateInput = {
    id?: SortOrder
    identifier?: SortOrder
    otpCode?: SortOrder
    expiresAt?: SortOrder
    isUsed?: SortOrder
    createdAt?: SortOrder
  }

  export type AlumniTestimonialOrderByRelevanceInput = {
    fields: AlumniTestimonialOrderByRelevanceFieldEnum | AlumniTestimonialOrderByRelevanceFieldEnum[]
    sort: SortOrder
    search: string
  }

  export type AlumniTestimonialCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    angkatan?: SortOrder
    photoPath?: SortOrder
    content?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type AlumniTestimonialMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    angkatan?: SortOrder
    photoPath?: SortOrder
    content?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type AlumniTestimonialMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    angkatan?: SortOrder
    photoPath?: SortOrder
    content?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type EnumStatusFieldUpdateOperationsInput = {
    set?: $Enums.Status
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type PostCreateNestedManyWithoutAuthorInput = {
    create?: XOR<PostCreateWithoutAuthorInput, PostUncheckedCreateWithoutAuthorInput> | PostCreateWithoutAuthorInput[] | PostUncheckedCreateWithoutAuthorInput[]
    connectOrCreate?: PostCreateOrConnectWithoutAuthorInput | PostCreateOrConnectWithoutAuthorInput[]
    createMany?: PostCreateManyAuthorInputEnvelope
    connect?: PostWhereUniqueInput | PostWhereUniqueInput[]
  }

  export type BlogPostCreateNestedManyWithoutAuthorInput = {
    create?: XOR<BlogPostCreateWithoutAuthorInput, BlogPostUncheckedCreateWithoutAuthorInput> | BlogPostCreateWithoutAuthorInput[] | BlogPostUncheckedCreateWithoutAuthorInput[]
    connectOrCreate?: BlogPostCreateOrConnectWithoutAuthorInput | BlogPostCreateOrConnectWithoutAuthorInput[]
    createMany?: BlogPostCreateManyAuthorInputEnvelope
    connect?: BlogPostWhereUniqueInput | BlogPostWhereUniqueInput[]
  }

  export type PostUncheckedCreateNestedManyWithoutAuthorInput = {
    create?: XOR<PostCreateWithoutAuthorInput, PostUncheckedCreateWithoutAuthorInput> | PostCreateWithoutAuthorInput[] | PostUncheckedCreateWithoutAuthorInput[]
    connectOrCreate?: PostCreateOrConnectWithoutAuthorInput | PostCreateOrConnectWithoutAuthorInput[]
    createMany?: PostCreateManyAuthorInputEnvelope
    connect?: PostWhereUniqueInput | PostWhereUniqueInput[]
  }

  export type BlogPostUncheckedCreateNestedManyWithoutAuthorInput = {
    create?: XOR<BlogPostCreateWithoutAuthorInput, BlogPostUncheckedCreateWithoutAuthorInput> | BlogPostCreateWithoutAuthorInput[] | BlogPostUncheckedCreateWithoutAuthorInput[]
    connectOrCreate?: BlogPostCreateOrConnectWithoutAuthorInput | BlogPostCreateOrConnectWithoutAuthorInput[]
    createMany?: BlogPostCreateManyAuthorInputEnvelope
    connect?: BlogPostWhereUniqueInput | BlogPostWhereUniqueInput[]
  }

  export type PostUpdateManyWithoutAuthorNestedInput = {
    create?: XOR<PostCreateWithoutAuthorInput, PostUncheckedCreateWithoutAuthorInput> | PostCreateWithoutAuthorInput[] | PostUncheckedCreateWithoutAuthorInput[]
    connectOrCreate?: PostCreateOrConnectWithoutAuthorInput | PostCreateOrConnectWithoutAuthorInput[]
    upsert?: PostUpsertWithWhereUniqueWithoutAuthorInput | PostUpsertWithWhereUniqueWithoutAuthorInput[]
    createMany?: PostCreateManyAuthorInputEnvelope
    set?: PostWhereUniqueInput | PostWhereUniqueInput[]
    disconnect?: PostWhereUniqueInput | PostWhereUniqueInput[]
    delete?: PostWhereUniqueInput | PostWhereUniqueInput[]
    connect?: PostWhereUniqueInput | PostWhereUniqueInput[]
    update?: PostUpdateWithWhereUniqueWithoutAuthorInput | PostUpdateWithWhereUniqueWithoutAuthorInput[]
    updateMany?: PostUpdateManyWithWhereWithoutAuthorInput | PostUpdateManyWithWhereWithoutAuthorInput[]
    deleteMany?: PostScalarWhereInput | PostScalarWhereInput[]
  }

  export type BlogPostUpdateManyWithoutAuthorNestedInput = {
    create?: XOR<BlogPostCreateWithoutAuthorInput, BlogPostUncheckedCreateWithoutAuthorInput> | BlogPostCreateWithoutAuthorInput[] | BlogPostUncheckedCreateWithoutAuthorInput[]
    connectOrCreate?: BlogPostCreateOrConnectWithoutAuthorInput | BlogPostCreateOrConnectWithoutAuthorInput[]
    upsert?: BlogPostUpsertWithWhereUniqueWithoutAuthorInput | BlogPostUpsertWithWhereUniqueWithoutAuthorInput[]
    createMany?: BlogPostCreateManyAuthorInputEnvelope
    set?: BlogPostWhereUniqueInput | BlogPostWhereUniqueInput[]
    disconnect?: BlogPostWhereUniqueInput | BlogPostWhereUniqueInput[]
    delete?: BlogPostWhereUniqueInput | BlogPostWhereUniqueInput[]
    connect?: BlogPostWhereUniqueInput | BlogPostWhereUniqueInput[]
    update?: BlogPostUpdateWithWhereUniqueWithoutAuthorInput | BlogPostUpdateWithWhereUniqueWithoutAuthorInput[]
    updateMany?: BlogPostUpdateManyWithWhereWithoutAuthorInput | BlogPostUpdateManyWithWhereWithoutAuthorInput[]
    deleteMany?: BlogPostScalarWhereInput | BlogPostScalarWhereInput[]
  }

  export type PostUncheckedUpdateManyWithoutAuthorNestedInput = {
    create?: XOR<PostCreateWithoutAuthorInput, PostUncheckedCreateWithoutAuthorInput> | PostCreateWithoutAuthorInput[] | PostUncheckedCreateWithoutAuthorInput[]
    connectOrCreate?: PostCreateOrConnectWithoutAuthorInput | PostCreateOrConnectWithoutAuthorInput[]
    upsert?: PostUpsertWithWhereUniqueWithoutAuthorInput | PostUpsertWithWhereUniqueWithoutAuthorInput[]
    createMany?: PostCreateManyAuthorInputEnvelope
    set?: PostWhereUniqueInput | PostWhereUniqueInput[]
    disconnect?: PostWhereUniqueInput | PostWhereUniqueInput[]
    delete?: PostWhereUniqueInput | PostWhereUniqueInput[]
    connect?: PostWhereUniqueInput | PostWhereUniqueInput[]
    update?: PostUpdateWithWhereUniqueWithoutAuthorInput | PostUpdateWithWhereUniqueWithoutAuthorInput[]
    updateMany?: PostUpdateManyWithWhereWithoutAuthorInput | PostUpdateManyWithWhereWithoutAuthorInput[]
    deleteMany?: PostScalarWhereInput | PostScalarWhereInput[]
  }

  export type BlogPostUncheckedUpdateManyWithoutAuthorNestedInput = {
    create?: XOR<BlogPostCreateWithoutAuthorInput, BlogPostUncheckedCreateWithoutAuthorInput> | BlogPostCreateWithoutAuthorInput[] | BlogPostUncheckedCreateWithoutAuthorInput[]
    connectOrCreate?: BlogPostCreateOrConnectWithoutAuthorInput | BlogPostCreateOrConnectWithoutAuthorInput[]
    upsert?: BlogPostUpsertWithWhereUniqueWithoutAuthorInput | BlogPostUpsertWithWhereUniqueWithoutAuthorInput[]
    createMany?: BlogPostCreateManyAuthorInputEnvelope
    set?: BlogPostWhereUniqueInput | BlogPostWhereUniqueInput[]
    disconnect?: BlogPostWhereUniqueInput | BlogPostWhereUniqueInput[]
    delete?: BlogPostWhereUniqueInput | BlogPostWhereUniqueInput[]
    connect?: BlogPostWhereUniqueInput | BlogPostWhereUniqueInput[]
    update?: BlogPostUpdateWithWhereUniqueWithoutAuthorInput | BlogPostUpdateWithWhereUniqueWithoutAuthorInput[]
    updateMany?: BlogPostUpdateManyWithWhereWithoutAuthorInput | BlogPostUpdateManyWithWhereWithoutAuthorInput[]
    deleteMany?: BlogPostScalarWhereInput | BlogPostScalarWhereInput[]
  }

  export type AdminCreateNestedOneWithoutPostsInput = {
    create?: XOR<AdminCreateWithoutPostsInput, AdminUncheckedCreateWithoutPostsInput>
    connectOrCreate?: AdminCreateOrConnectWithoutPostsInput
    connect?: AdminWhereUniqueInput
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type AdminUpdateOneRequiredWithoutPostsNestedInput = {
    create?: XOR<AdminCreateWithoutPostsInput, AdminUncheckedCreateWithoutPostsInput>
    connectOrCreate?: AdminCreateOrConnectWithoutPostsInput
    upsert?: AdminUpsertWithoutPostsInput
    connect?: AdminWhereUniqueInput
    update?: XOR<XOR<AdminUpdateToOneWithWhereWithoutPostsInput, AdminUpdateWithoutPostsInput>, AdminUncheckedUpdateWithoutPostsInput>
  }

  export type AdminCreateNestedOneWithoutBlogPostsInput = {
    create?: XOR<AdminCreateWithoutBlogPostsInput, AdminUncheckedCreateWithoutBlogPostsInput>
    connectOrCreate?: AdminCreateOrConnectWithoutBlogPostsInput
    connect?: AdminWhereUniqueInput
  }

  export type MemberCreateNestedOneWithoutBlogPostsInput = {
    create?: XOR<MemberCreateWithoutBlogPostsInput, MemberUncheckedCreateWithoutBlogPostsInput>
    connectOrCreate?: MemberCreateOrConnectWithoutBlogPostsInput
    connect?: MemberWhereUniqueInput
  }

  export type BlogCommentCreateNestedManyWithoutPostInput = {
    create?: XOR<BlogCommentCreateWithoutPostInput, BlogCommentUncheckedCreateWithoutPostInput> | BlogCommentCreateWithoutPostInput[] | BlogCommentUncheckedCreateWithoutPostInput[]
    connectOrCreate?: BlogCommentCreateOrConnectWithoutPostInput | BlogCommentCreateOrConnectWithoutPostInput[]
    createMany?: BlogCommentCreateManyPostInputEnvelope
    connect?: BlogCommentWhereUniqueInput | BlogCommentWhereUniqueInput[]
  }

  export type BlogLikeCreateNestedManyWithoutPostInput = {
    create?: XOR<BlogLikeCreateWithoutPostInput, BlogLikeUncheckedCreateWithoutPostInput> | BlogLikeCreateWithoutPostInput[] | BlogLikeUncheckedCreateWithoutPostInput[]
    connectOrCreate?: BlogLikeCreateOrConnectWithoutPostInput | BlogLikeCreateOrConnectWithoutPostInput[]
    createMany?: BlogLikeCreateManyPostInputEnvelope
    connect?: BlogLikeWhereUniqueInput | BlogLikeWhereUniqueInput[]
  }

  export type BlogCommentUncheckedCreateNestedManyWithoutPostInput = {
    create?: XOR<BlogCommentCreateWithoutPostInput, BlogCommentUncheckedCreateWithoutPostInput> | BlogCommentCreateWithoutPostInput[] | BlogCommentUncheckedCreateWithoutPostInput[]
    connectOrCreate?: BlogCommentCreateOrConnectWithoutPostInput | BlogCommentCreateOrConnectWithoutPostInput[]
    createMany?: BlogCommentCreateManyPostInputEnvelope
    connect?: BlogCommentWhereUniqueInput | BlogCommentWhereUniqueInput[]
  }

  export type BlogLikeUncheckedCreateNestedManyWithoutPostInput = {
    create?: XOR<BlogLikeCreateWithoutPostInput, BlogLikeUncheckedCreateWithoutPostInput> | BlogLikeCreateWithoutPostInput[] | BlogLikeUncheckedCreateWithoutPostInput[]
    connectOrCreate?: BlogLikeCreateOrConnectWithoutPostInput | BlogLikeCreateOrConnectWithoutPostInput[]
    createMany?: BlogLikeCreateManyPostInputEnvelope
    connect?: BlogLikeWhereUniqueInput | BlogLikeWhereUniqueInput[]
  }

  export type AdminUpdateOneWithoutBlogPostsNestedInput = {
    create?: XOR<AdminCreateWithoutBlogPostsInput, AdminUncheckedCreateWithoutBlogPostsInput>
    connectOrCreate?: AdminCreateOrConnectWithoutBlogPostsInput
    upsert?: AdminUpsertWithoutBlogPostsInput
    disconnect?: AdminWhereInput | boolean
    delete?: AdminWhereInput | boolean
    connect?: AdminWhereUniqueInput
    update?: XOR<XOR<AdminUpdateToOneWithWhereWithoutBlogPostsInput, AdminUpdateWithoutBlogPostsInput>, AdminUncheckedUpdateWithoutBlogPostsInput>
  }

  export type MemberUpdateOneWithoutBlogPostsNestedInput = {
    create?: XOR<MemberCreateWithoutBlogPostsInput, MemberUncheckedCreateWithoutBlogPostsInput>
    connectOrCreate?: MemberCreateOrConnectWithoutBlogPostsInput
    upsert?: MemberUpsertWithoutBlogPostsInput
    disconnect?: MemberWhereInput | boolean
    delete?: MemberWhereInput | boolean
    connect?: MemberWhereUniqueInput
    update?: XOR<XOR<MemberUpdateToOneWithWhereWithoutBlogPostsInput, MemberUpdateWithoutBlogPostsInput>, MemberUncheckedUpdateWithoutBlogPostsInput>
  }

  export type BlogCommentUpdateManyWithoutPostNestedInput = {
    create?: XOR<BlogCommentCreateWithoutPostInput, BlogCommentUncheckedCreateWithoutPostInput> | BlogCommentCreateWithoutPostInput[] | BlogCommentUncheckedCreateWithoutPostInput[]
    connectOrCreate?: BlogCommentCreateOrConnectWithoutPostInput | BlogCommentCreateOrConnectWithoutPostInput[]
    upsert?: BlogCommentUpsertWithWhereUniqueWithoutPostInput | BlogCommentUpsertWithWhereUniqueWithoutPostInput[]
    createMany?: BlogCommentCreateManyPostInputEnvelope
    set?: BlogCommentWhereUniqueInput | BlogCommentWhereUniqueInput[]
    disconnect?: BlogCommentWhereUniqueInput | BlogCommentWhereUniqueInput[]
    delete?: BlogCommentWhereUniqueInput | BlogCommentWhereUniqueInput[]
    connect?: BlogCommentWhereUniqueInput | BlogCommentWhereUniqueInput[]
    update?: BlogCommentUpdateWithWhereUniqueWithoutPostInput | BlogCommentUpdateWithWhereUniqueWithoutPostInput[]
    updateMany?: BlogCommentUpdateManyWithWhereWithoutPostInput | BlogCommentUpdateManyWithWhereWithoutPostInput[]
    deleteMany?: BlogCommentScalarWhereInput | BlogCommentScalarWhereInput[]
  }

  export type BlogLikeUpdateManyWithoutPostNestedInput = {
    create?: XOR<BlogLikeCreateWithoutPostInput, BlogLikeUncheckedCreateWithoutPostInput> | BlogLikeCreateWithoutPostInput[] | BlogLikeUncheckedCreateWithoutPostInput[]
    connectOrCreate?: BlogLikeCreateOrConnectWithoutPostInput | BlogLikeCreateOrConnectWithoutPostInput[]
    upsert?: BlogLikeUpsertWithWhereUniqueWithoutPostInput | BlogLikeUpsertWithWhereUniqueWithoutPostInput[]
    createMany?: BlogLikeCreateManyPostInputEnvelope
    set?: BlogLikeWhereUniqueInput | BlogLikeWhereUniqueInput[]
    disconnect?: BlogLikeWhereUniqueInput | BlogLikeWhereUniqueInput[]
    delete?: BlogLikeWhereUniqueInput | BlogLikeWhereUniqueInput[]
    connect?: BlogLikeWhereUniqueInput | BlogLikeWhereUniqueInput[]
    update?: BlogLikeUpdateWithWhereUniqueWithoutPostInput | BlogLikeUpdateWithWhereUniqueWithoutPostInput[]
    updateMany?: BlogLikeUpdateManyWithWhereWithoutPostInput | BlogLikeUpdateManyWithWhereWithoutPostInput[]
    deleteMany?: BlogLikeScalarWhereInput | BlogLikeScalarWhereInput[]
  }

  export type BlogCommentUncheckedUpdateManyWithoutPostNestedInput = {
    create?: XOR<BlogCommentCreateWithoutPostInput, BlogCommentUncheckedCreateWithoutPostInput> | BlogCommentCreateWithoutPostInput[] | BlogCommentUncheckedCreateWithoutPostInput[]
    connectOrCreate?: BlogCommentCreateOrConnectWithoutPostInput | BlogCommentCreateOrConnectWithoutPostInput[]
    upsert?: BlogCommentUpsertWithWhereUniqueWithoutPostInput | BlogCommentUpsertWithWhereUniqueWithoutPostInput[]
    createMany?: BlogCommentCreateManyPostInputEnvelope
    set?: BlogCommentWhereUniqueInput | BlogCommentWhereUniqueInput[]
    disconnect?: BlogCommentWhereUniqueInput | BlogCommentWhereUniqueInput[]
    delete?: BlogCommentWhereUniqueInput | BlogCommentWhereUniqueInput[]
    connect?: BlogCommentWhereUniqueInput | BlogCommentWhereUniqueInput[]
    update?: BlogCommentUpdateWithWhereUniqueWithoutPostInput | BlogCommentUpdateWithWhereUniqueWithoutPostInput[]
    updateMany?: BlogCommentUpdateManyWithWhereWithoutPostInput | BlogCommentUpdateManyWithWhereWithoutPostInput[]
    deleteMany?: BlogCommentScalarWhereInput | BlogCommentScalarWhereInput[]
  }

  export type BlogLikeUncheckedUpdateManyWithoutPostNestedInput = {
    create?: XOR<BlogLikeCreateWithoutPostInput, BlogLikeUncheckedCreateWithoutPostInput> | BlogLikeCreateWithoutPostInput[] | BlogLikeUncheckedCreateWithoutPostInput[]
    connectOrCreate?: BlogLikeCreateOrConnectWithoutPostInput | BlogLikeCreateOrConnectWithoutPostInput[]
    upsert?: BlogLikeUpsertWithWhereUniqueWithoutPostInput | BlogLikeUpsertWithWhereUniqueWithoutPostInput[]
    createMany?: BlogLikeCreateManyPostInputEnvelope
    set?: BlogLikeWhereUniqueInput | BlogLikeWhereUniqueInput[]
    disconnect?: BlogLikeWhereUniqueInput | BlogLikeWhereUniqueInput[]
    delete?: BlogLikeWhereUniqueInput | BlogLikeWhereUniqueInput[]
    connect?: BlogLikeWhereUniqueInput | BlogLikeWhereUniqueInput[]
    update?: BlogLikeUpdateWithWhereUniqueWithoutPostInput | BlogLikeUpdateWithWhereUniqueWithoutPostInput[]
    updateMany?: BlogLikeUpdateManyWithWhereWithoutPostInput | BlogLikeUpdateManyWithWhereWithoutPostInput[]
    deleteMany?: BlogLikeScalarWhereInput | BlogLikeScalarWhereInput[]
  }

  export type BlogPostCreateNestedOneWithoutCommentsInput = {
    create?: XOR<BlogPostCreateWithoutCommentsInput, BlogPostUncheckedCreateWithoutCommentsInput>
    connectOrCreate?: BlogPostCreateOrConnectWithoutCommentsInput
    connect?: BlogPostWhereUniqueInput
  }

  export type MemberCreateNestedOneWithoutBlogCommentsInput = {
    create?: XOR<MemberCreateWithoutBlogCommentsInput, MemberUncheckedCreateWithoutBlogCommentsInput>
    connectOrCreate?: MemberCreateOrConnectWithoutBlogCommentsInput
    connect?: MemberWhereUniqueInput
  }

  export type BlogCommentCreateNestedOneWithoutRepliesInput = {
    create?: XOR<BlogCommentCreateWithoutRepliesInput, BlogCommentUncheckedCreateWithoutRepliesInput>
    connectOrCreate?: BlogCommentCreateOrConnectWithoutRepliesInput
    connect?: BlogCommentWhereUniqueInput
  }

  export type BlogCommentCreateNestedManyWithoutParentInput = {
    create?: XOR<BlogCommentCreateWithoutParentInput, BlogCommentUncheckedCreateWithoutParentInput> | BlogCommentCreateWithoutParentInput[] | BlogCommentUncheckedCreateWithoutParentInput[]
    connectOrCreate?: BlogCommentCreateOrConnectWithoutParentInput | BlogCommentCreateOrConnectWithoutParentInput[]
    createMany?: BlogCommentCreateManyParentInputEnvelope
    connect?: BlogCommentWhereUniqueInput | BlogCommentWhereUniqueInput[]
  }

  export type BlogCommentUncheckedCreateNestedManyWithoutParentInput = {
    create?: XOR<BlogCommentCreateWithoutParentInput, BlogCommentUncheckedCreateWithoutParentInput> | BlogCommentCreateWithoutParentInput[] | BlogCommentUncheckedCreateWithoutParentInput[]
    connectOrCreate?: BlogCommentCreateOrConnectWithoutParentInput | BlogCommentCreateOrConnectWithoutParentInput[]
    createMany?: BlogCommentCreateManyParentInputEnvelope
    connect?: BlogCommentWhereUniqueInput | BlogCommentWhereUniqueInput[]
  }

  export type BlogPostUpdateOneRequiredWithoutCommentsNestedInput = {
    create?: XOR<BlogPostCreateWithoutCommentsInput, BlogPostUncheckedCreateWithoutCommentsInput>
    connectOrCreate?: BlogPostCreateOrConnectWithoutCommentsInput
    upsert?: BlogPostUpsertWithoutCommentsInput
    connect?: BlogPostWhereUniqueInput
    update?: XOR<XOR<BlogPostUpdateToOneWithWhereWithoutCommentsInput, BlogPostUpdateWithoutCommentsInput>, BlogPostUncheckedUpdateWithoutCommentsInput>
  }

  export type MemberUpdateOneWithoutBlogCommentsNestedInput = {
    create?: XOR<MemberCreateWithoutBlogCommentsInput, MemberUncheckedCreateWithoutBlogCommentsInput>
    connectOrCreate?: MemberCreateOrConnectWithoutBlogCommentsInput
    upsert?: MemberUpsertWithoutBlogCommentsInput
    disconnect?: MemberWhereInput | boolean
    delete?: MemberWhereInput | boolean
    connect?: MemberWhereUniqueInput
    update?: XOR<XOR<MemberUpdateToOneWithWhereWithoutBlogCommentsInput, MemberUpdateWithoutBlogCommentsInput>, MemberUncheckedUpdateWithoutBlogCommentsInput>
  }

  export type BlogCommentUpdateOneWithoutRepliesNestedInput = {
    create?: XOR<BlogCommentCreateWithoutRepliesInput, BlogCommentUncheckedCreateWithoutRepliesInput>
    connectOrCreate?: BlogCommentCreateOrConnectWithoutRepliesInput
    upsert?: BlogCommentUpsertWithoutRepliesInput
    disconnect?: BlogCommentWhereInput | boolean
    delete?: BlogCommentWhereInput | boolean
    connect?: BlogCommentWhereUniqueInput
    update?: XOR<XOR<BlogCommentUpdateToOneWithWhereWithoutRepliesInput, BlogCommentUpdateWithoutRepliesInput>, BlogCommentUncheckedUpdateWithoutRepliesInput>
  }

  export type BlogCommentUpdateManyWithoutParentNestedInput = {
    create?: XOR<BlogCommentCreateWithoutParentInput, BlogCommentUncheckedCreateWithoutParentInput> | BlogCommentCreateWithoutParentInput[] | BlogCommentUncheckedCreateWithoutParentInput[]
    connectOrCreate?: BlogCommentCreateOrConnectWithoutParentInput | BlogCommentCreateOrConnectWithoutParentInput[]
    upsert?: BlogCommentUpsertWithWhereUniqueWithoutParentInput | BlogCommentUpsertWithWhereUniqueWithoutParentInput[]
    createMany?: BlogCommentCreateManyParentInputEnvelope
    set?: BlogCommentWhereUniqueInput | BlogCommentWhereUniqueInput[]
    disconnect?: BlogCommentWhereUniqueInput | BlogCommentWhereUniqueInput[]
    delete?: BlogCommentWhereUniqueInput | BlogCommentWhereUniqueInput[]
    connect?: BlogCommentWhereUniqueInput | BlogCommentWhereUniqueInput[]
    update?: BlogCommentUpdateWithWhereUniqueWithoutParentInput | BlogCommentUpdateWithWhereUniqueWithoutParentInput[]
    updateMany?: BlogCommentUpdateManyWithWhereWithoutParentInput | BlogCommentUpdateManyWithWhereWithoutParentInput[]
    deleteMany?: BlogCommentScalarWhereInput | BlogCommentScalarWhereInput[]
  }

  export type BlogCommentUncheckedUpdateManyWithoutParentNestedInput = {
    create?: XOR<BlogCommentCreateWithoutParentInput, BlogCommentUncheckedCreateWithoutParentInput> | BlogCommentCreateWithoutParentInput[] | BlogCommentUncheckedCreateWithoutParentInput[]
    connectOrCreate?: BlogCommentCreateOrConnectWithoutParentInput | BlogCommentCreateOrConnectWithoutParentInput[]
    upsert?: BlogCommentUpsertWithWhereUniqueWithoutParentInput | BlogCommentUpsertWithWhereUniqueWithoutParentInput[]
    createMany?: BlogCommentCreateManyParentInputEnvelope
    set?: BlogCommentWhereUniqueInput | BlogCommentWhereUniqueInput[]
    disconnect?: BlogCommentWhereUniqueInput | BlogCommentWhereUniqueInput[]
    delete?: BlogCommentWhereUniqueInput | BlogCommentWhereUniqueInput[]
    connect?: BlogCommentWhereUniqueInput | BlogCommentWhereUniqueInput[]
    update?: BlogCommentUpdateWithWhereUniqueWithoutParentInput | BlogCommentUpdateWithWhereUniqueWithoutParentInput[]
    updateMany?: BlogCommentUpdateManyWithWhereWithoutParentInput | BlogCommentUpdateManyWithWhereWithoutParentInput[]
    deleteMany?: BlogCommentScalarWhereInput | BlogCommentScalarWhereInput[]
  }

  export type BlogPostCreateNestedOneWithoutLikesInput = {
    create?: XOR<BlogPostCreateWithoutLikesInput, BlogPostUncheckedCreateWithoutLikesInput>
    connectOrCreate?: BlogPostCreateOrConnectWithoutLikesInput
    connect?: BlogPostWhereUniqueInput
  }

  export type MemberCreateNestedOneWithoutBlogLikesInput = {
    create?: XOR<MemberCreateWithoutBlogLikesInput, MemberUncheckedCreateWithoutBlogLikesInput>
    connectOrCreate?: MemberCreateOrConnectWithoutBlogLikesInput
    connect?: MemberWhereUniqueInput
  }

  export type BlogPostUpdateOneRequiredWithoutLikesNestedInput = {
    create?: XOR<BlogPostCreateWithoutLikesInput, BlogPostUncheckedCreateWithoutLikesInput>
    connectOrCreate?: BlogPostCreateOrConnectWithoutLikesInput
    upsert?: BlogPostUpsertWithoutLikesInput
    connect?: BlogPostWhereUniqueInput
    update?: XOR<XOR<BlogPostUpdateToOneWithWhereWithoutLikesInput, BlogPostUpdateWithoutLikesInput>, BlogPostUncheckedUpdateWithoutLikesInput>
  }

  export type MemberUpdateOneWithoutBlogLikesNestedInput = {
    create?: XOR<MemberCreateWithoutBlogLikesInput, MemberUncheckedCreateWithoutBlogLikesInput>
    connectOrCreate?: MemberCreateOrConnectWithoutBlogLikesInput
    upsert?: MemberUpsertWithoutBlogLikesInput
    disconnect?: MemberWhereInput | boolean
    delete?: MemberWhereInput | boolean
    connect?: MemberWhereUniqueInput
    update?: XOR<XOR<MemberUpdateToOneWithWhereWithoutBlogLikesInput, MemberUpdateWithoutBlogLikesInput>, MemberUncheckedUpdateWithoutBlogLikesInput>
  }

  export type OrgMemberCreateNestedOneWithoutMemberInput = {
    create?: XOR<OrgMemberCreateWithoutMemberInput, OrgMemberUncheckedCreateWithoutMemberInput>
    connectOrCreate?: OrgMemberCreateOrConnectWithoutMemberInput
    connect?: OrgMemberWhereUniqueInput
  }

  export type BlogPostCreateNestedManyWithoutMemberAuthorInput = {
    create?: XOR<BlogPostCreateWithoutMemberAuthorInput, BlogPostUncheckedCreateWithoutMemberAuthorInput> | BlogPostCreateWithoutMemberAuthorInput[] | BlogPostUncheckedCreateWithoutMemberAuthorInput[]
    connectOrCreate?: BlogPostCreateOrConnectWithoutMemberAuthorInput | BlogPostCreateOrConnectWithoutMemberAuthorInput[]
    createMany?: BlogPostCreateManyMemberAuthorInputEnvelope
    connect?: BlogPostWhereUniqueInput | BlogPostWhereUniqueInput[]
  }

  export type BlogCommentCreateNestedManyWithoutMemberInput = {
    create?: XOR<BlogCommentCreateWithoutMemberInput, BlogCommentUncheckedCreateWithoutMemberInput> | BlogCommentCreateWithoutMemberInput[] | BlogCommentUncheckedCreateWithoutMemberInput[]
    connectOrCreate?: BlogCommentCreateOrConnectWithoutMemberInput | BlogCommentCreateOrConnectWithoutMemberInput[]
    createMany?: BlogCommentCreateManyMemberInputEnvelope
    connect?: BlogCommentWhereUniqueInput | BlogCommentWhereUniqueInput[]
  }

  export type BlogLikeCreateNestedManyWithoutMemberInput = {
    create?: XOR<BlogLikeCreateWithoutMemberInput, BlogLikeUncheckedCreateWithoutMemberInput> | BlogLikeCreateWithoutMemberInput[] | BlogLikeUncheckedCreateWithoutMemberInput[]
    connectOrCreate?: BlogLikeCreateOrConnectWithoutMemberInput | BlogLikeCreateOrConnectWithoutMemberInput[]
    createMany?: BlogLikeCreateManyMemberInputEnvelope
    connect?: BlogLikeWhereUniqueInput | BlogLikeWhereUniqueInput[]
  }

  export type OrgMemberUncheckedCreateNestedOneWithoutMemberInput = {
    create?: XOR<OrgMemberCreateWithoutMemberInput, OrgMemberUncheckedCreateWithoutMemberInput>
    connectOrCreate?: OrgMemberCreateOrConnectWithoutMemberInput
    connect?: OrgMemberWhereUniqueInput
  }

  export type BlogPostUncheckedCreateNestedManyWithoutMemberAuthorInput = {
    create?: XOR<BlogPostCreateWithoutMemberAuthorInput, BlogPostUncheckedCreateWithoutMemberAuthorInput> | BlogPostCreateWithoutMemberAuthorInput[] | BlogPostUncheckedCreateWithoutMemberAuthorInput[]
    connectOrCreate?: BlogPostCreateOrConnectWithoutMemberAuthorInput | BlogPostCreateOrConnectWithoutMemberAuthorInput[]
    createMany?: BlogPostCreateManyMemberAuthorInputEnvelope
    connect?: BlogPostWhereUniqueInput | BlogPostWhereUniqueInput[]
  }

  export type BlogCommentUncheckedCreateNestedManyWithoutMemberInput = {
    create?: XOR<BlogCommentCreateWithoutMemberInput, BlogCommentUncheckedCreateWithoutMemberInput> | BlogCommentCreateWithoutMemberInput[] | BlogCommentUncheckedCreateWithoutMemberInput[]
    connectOrCreate?: BlogCommentCreateOrConnectWithoutMemberInput | BlogCommentCreateOrConnectWithoutMemberInput[]
    createMany?: BlogCommentCreateManyMemberInputEnvelope
    connect?: BlogCommentWhereUniqueInput | BlogCommentWhereUniqueInput[]
  }

  export type BlogLikeUncheckedCreateNestedManyWithoutMemberInput = {
    create?: XOR<BlogLikeCreateWithoutMemberInput, BlogLikeUncheckedCreateWithoutMemberInput> | BlogLikeCreateWithoutMemberInput[] | BlogLikeUncheckedCreateWithoutMemberInput[]
    connectOrCreate?: BlogLikeCreateOrConnectWithoutMemberInput | BlogLikeCreateOrConnectWithoutMemberInput[]
    createMany?: BlogLikeCreateManyMemberInputEnvelope
    connect?: BlogLikeWhereUniqueInput | BlogLikeWhereUniqueInput[]
  }

  export type EnumMemberStatusFieldUpdateOperationsInput = {
    set?: $Enums.MemberStatus
  }

  export type OrgMemberUpdateOneWithoutMemberNestedInput = {
    create?: XOR<OrgMemberCreateWithoutMemberInput, OrgMemberUncheckedCreateWithoutMemberInput>
    connectOrCreate?: OrgMemberCreateOrConnectWithoutMemberInput
    upsert?: OrgMemberUpsertWithoutMemberInput
    disconnect?: OrgMemberWhereInput | boolean
    delete?: OrgMemberWhereInput | boolean
    connect?: OrgMemberWhereUniqueInput
    update?: XOR<XOR<OrgMemberUpdateToOneWithWhereWithoutMemberInput, OrgMemberUpdateWithoutMemberInput>, OrgMemberUncheckedUpdateWithoutMemberInput>
  }

  export type BlogPostUpdateManyWithoutMemberAuthorNestedInput = {
    create?: XOR<BlogPostCreateWithoutMemberAuthorInput, BlogPostUncheckedCreateWithoutMemberAuthorInput> | BlogPostCreateWithoutMemberAuthorInput[] | BlogPostUncheckedCreateWithoutMemberAuthorInput[]
    connectOrCreate?: BlogPostCreateOrConnectWithoutMemberAuthorInput | BlogPostCreateOrConnectWithoutMemberAuthorInput[]
    upsert?: BlogPostUpsertWithWhereUniqueWithoutMemberAuthorInput | BlogPostUpsertWithWhereUniqueWithoutMemberAuthorInput[]
    createMany?: BlogPostCreateManyMemberAuthorInputEnvelope
    set?: BlogPostWhereUniqueInput | BlogPostWhereUniqueInput[]
    disconnect?: BlogPostWhereUniqueInput | BlogPostWhereUniqueInput[]
    delete?: BlogPostWhereUniqueInput | BlogPostWhereUniqueInput[]
    connect?: BlogPostWhereUniqueInput | BlogPostWhereUniqueInput[]
    update?: BlogPostUpdateWithWhereUniqueWithoutMemberAuthorInput | BlogPostUpdateWithWhereUniqueWithoutMemberAuthorInput[]
    updateMany?: BlogPostUpdateManyWithWhereWithoutMemberAuthorInput | BlogPostUpdateManyWithWhereWithoutMemberAuthorInput[]
    deleteMany?: BlogPostScalarWhereInput | BlogPostScalarWhereInput[]
  }

  export type BlogCommentUpdateManyWithoutMemberNestedInput = {
    create?: XOR<BlogCommentCreateWithoutMemberInput, BlogCommentUncheckedCreateWithoutMemberInput> | BlogCommentCreateWithoutMemberInput[] | BlogCommentUncheckedCreateWithoutMemberInput[]
    connectOrCreate?: BlogCommentCreateOrConnectWithoutMemberInput | BlogCommentCreateOrConnectWithoutMemberInput[]
    upsert?: BlogCommentUpsertWithWhereUniqueWithoutMemberInput | BlogCommentUpsertWithWhereUniqueWithoutMemberInput[]
    createMany?: BlogCommentCreateManyMemberInputEnvelope
    set?: BlogCommentWhereUniqueInput | BlogCommentWhereUniqueInput[]
    disconnect?: BlogCommentWhereUniqueInput | BlogCommentWhereUniqueInput[]
    delete?: BlogCommentWhereUniqueInput | BlogCommentWhereUniqueInput[]
    connect?: BlogCommentWhereUniqueInput | BlogCommentWhereUniqueInput[]
    update?: BlogCommentUpdateWithWhereUniqueWithoutMemberInput | BlogCommentUpdateWithWhereUniqueWithoutMemberInput[]
    updateMany?: BlogCommentUpdateManyWithWhereWithoutMemberInput | BlogCommentUpdateManyWithWhereWithoutMemberInput[]
    deleteMany?: BlogCommentScalarWhereInput | BlogCommentScalarWhereInput[]
  }

  export type BlogLikeUpdateManyWithoutMemberNestedInput = {
    create?: XOR<BlogLikeCreateWithoutMemberInput, BlogLikeUncheckedCreateWithoutMemberInput> | BlogLikeCreateWithoutMemberInput[] | BlogLikeUncheckedCreateWithoutMemberInput[]
    connectOrCreate?: BlogLikeCreateOrConnectWithoutMemberInput | BlogLikeCreateOrConnectWithoutMemberInput[]
    upsert?: BlogLikeUpsertWithWhereUniqueWithoutMemberInput | BlogLikeUpsertWithWhereUniqueWithoutMemberInput[]
    createMany?: BlogLikeCreateManyMemberInputEnvelope
    set?: BlogLikeWhereUniqueInput | BlogLikeWhereUniqueInput[]
    disconnect?: BlogLikeWhereUniqueInput | BlogLikeWhereUniqueInput[]
    delete?: BlogLikeWhereUniqueInput | BlogLikeWhereUniqueInput[]
    connect?: BlogLikeWhereUniqueInput | BlogLikeWhereUniqueInput[]
    update?: BlogLikeUpdateWithWhereUniqueWithoutMemberInput | BlogLikeUpdateWithWhereUniqueWithoutMemberInput[]
    updateMany?: BlogLikeUpdateManyWithWhereWithoutMemberInput | BlogLikeUpdateManyWithWhereWithoutMemberInput[]
    deleteMany?: BlogLikeScalarWhereInput | BlogLikeScalarWhereInput[]
  }

  export type OrgMemberUncheckedUpdateOneWithoutMemberNestedInput = {
    create?: XOR<OrgMemberCreateWithoutMemberInput, OrgMemberUncheckedCreateWithoutMemberInput>
    connectOrCreate?: OrgMemberCreateOrConnectWithoutMemberInput
    upsert?: OrgMemberUpsertWithoutMemberInput
    disconnect?: OrgMemberWhereInput | boolean
    delete?: OrgMemberWhereInput | boolean
    connect?: OrgMemberWhereUniqueInput
    update?: XOR<XOR<OrgMemberUpdateToOneWithWhereWithoutMemberInput, OrgMemberUpdateWithoutMemberInput>, OrgMemberUncheckedUpdateWithoutMemberInput>
  }

  export type BlogPostUncheckedUpdateManyWithoutMemberAuthorNestedInput = {
    create?: XOR<BlogPostCreateWithoutMemberAuthorInput, BlogPostUncheckedCreateWithoutMemberAuthorInput> | BlogPostCreateWithoutMemberAuthorInput[] | BlogPostUncheckedCreateWithoutMemberAuthorInput[]
    connectOrCreate?: BlogPostCreateOrConnectWithoutMemberAuthorInput | BlogPostCreateOrConnectWithoutMemberAuthorInput[]
    upsert?: BlogPostUpsertWithWhereUniqueWithoutMemberAuthorInput | BlogPostUpsertWithWhereUniqueWithoutMemberAuthorInput[]
    createMany?: BlogPostCreateManyMemberAuthorInputEnvelope
    set?: BlogPostWhereUniqueInput | BlogPostWhereUniqueInput[]
    disconnect?: BlogPostWhereUniqueInput | BlogPostWhereUniqueInput[]
    delete?: BlogPostWhereUniqueInput | BlogPostWhereUniqueInput[]
    connect?: BlogPostWhereUniqueInput | BlogPostWhereUniqueInput[]
    update?: BlogPostUpdateWithWhereUniqueWithoutMemberAuthorInput | BlogPostUpdateWithWhereUniqueWithoutMemberAuthorInput[]
    updateMany?: BlogPostUpdateManyWithWhereWithoutMemberAuthorInput | BlogPostUpdateManyWithWhereWithoutMemberAuthorInput[]
    deleteMany?: BlogPostScalarWhereInput | BlogPostScalarWhereInput[]
  }

  export type BlogCommentUncheckedUpdateManyWithoutMemberNestedInput = {
    create?: XOR<BlogCommentCreateWithoutMemberInput, BlogCommentUncheckedCreateWithoutMemberInput> | BlogCommentCreateWithoutMemberInput[] | BlogCommentUncheckedCreateWithoutMemberInput[]
    connectOrCreate?: BlogCommentCreateOrConnectWithoutMemberInput | BlogCommentCreateOrConnectWithoutMemberInput[]
    upsert?: BlogCommentUpsertWithWhereUniqueWithoutMemberInput | BlogCommentUpsertWithWhereUniqueWithoutMemberInput[]
    createMany?: BlogCommentCreateManyMemberInputEnvelope
    set?: BlogCommentWhereUniqueInput | BlogCommentWhereUniqueInput[]
    disconnect?: BlogCommentWhereUniqueInput | BlogCommentWhereUniqueInput[]
    delete?: BlogCommentWhereUniqueInput | BlogCommentWhereUniqueInput[]
    connect?: BlogCommentWhereUniqueInput | BlogCommentWhereUniqueInput[]
    update?: BlogCommentUpdateWithWhereUniqueWithoutMemberInput | BlogCommentUpdateWithWhereUniqueWithoutMemberInput[]
    updateMany?: BlogCommentUpdateManyWithWhereWithoutMemberInput | BlogCommentUpdateManyWithWhereWithoutMemberInput[]
    deleteMany?: BlogCommentScalarWhereInput | BlogCommentScalarWhereInput[]
  }

  export type BlogLikeUncheckedUpdateManyWithoutMemberNestedInput = {
    create?: XOR<BlogLikeCreateWithoutMemberInput, BlogLikeUncheckedCreateWithoutMemberInput> | BlogLikeCreateWithoutMemberInput[] | BlogLikeUncheckedCreateWithoutMemberInput[]
    connectOrCreate?: BlogLikeCreateOrConnectWithoutMemberInput | BlogLikeCreateOrConnectWithoutMemberInput[]
    upsert?: BlogLikeUpsertWithWhereUniqueWithoutMemberInput | BlogLikeUpsertWithWhereUniqueWithoutMemberInput[]
    createMany?: BlogLikeCreateManyMemberInputEnvelope
    set?: BlogLikeWhereUniqueInput | BlogLikeWhereUniqueInput[]
    disconnect?: BlogLikeWhereUniqueInput | BlogLikeWhereUniqueInput[]
    delete?: BlogLikeWhereUniqueInput | BlogLikeWhereUniqueInput[]
    connect?: BlogLikeWhereUniqueInput | BlogLikeWhereUniqueInput[]
    update?: BlogLikeUpdateWithWhereUniqueWithoutMemberInput | BlogLikeUpdateWithWhereUniqueWithoutMemberInput[]
    updateMany?: BlogLikeUpdateManyWithWhereWithoutMemberInput | BlogLikeUpdateManyWithWhereWithoutMemberInput[]
    deleteMany?: BlogLikeScalarWhereInput | BlogLikeScalarWhereInput[]
  }

  export type MemberCreateNestedOneWithoutOrgMemberInput = {
    create?: XOR<MemberCreateWithoutOrgMemberInput, MemberUncheckedCreateWithoutOrgMemberInput>
    connectOrCreate?: MemberCreateOrConnectWithoutOrgMemberInput
    connect?: MemberWhereUniqueInput
  }

  export type NullableIntFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type MemberUpdateOneWithoutOrgMemberNestedInput = {
    create?: XOR<MemberCreateWithoutOrgMemberInput, MemberUncheckedCreateWithoutOrgMemberInput>
    connectOrCreate?: MemberCreateOrConnectWithoutOrgMemberInput
    upsert?: MemberUpsertWithoutOrgMemberInput
    disconnect?: MemberWhereInput | boolean
    delete?: MemberWhereInput | boolean
    connect?: MemberWhereUniqueInput
    update?: XOR<XOR<MemberUpdateToOneWithWhereWithoutOrgMemberInput, MemberUpdateWithoutOrgMemberInput>, MemberUncheckedUpdateWithoutOrgMemberInput>
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedEnumStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.Status | EnumStatusFieldRefInput<$PrismaModel>
    in?: $Enums.Status[]
    notIn?: $Enums.Status[]
    not?: NestedEnumStatusFilter<$PrismaModel> | $Enums.Status
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedEnumStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.Status | EnumStatusFieldRefInput<$PrismaModel>
    in?: $Enums.Status[]
    notIn?: $Enums.Status[]
    not?: NestedEnumStatusWithAggregatesFilter<$PrismaModel> | $Enums.Status
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumStatusFilter<$PrismaModel>
    _max?: NestedEnumStatusFilter<$PrismaModel>
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedEnumMemberStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.MemberStatus | EnumMemberStatusFieldRefInput<$PrismaModel>
    in?: $Enums.MemberStatus[]
    notIn?: $Enums.MemberStatus[]
    not?: NestedEnumMemberStatusFilter<$PrismaModel> | $Enums.MemberStatus
  }

  export type NestedEnumMemberStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.MemberStatus | EnumMemberStatusFieldRefInput<$PrismaModel>
    in?: $Enums.MemberStatus[]
    notIn?: $Enums.MemberStatus[]
    not?: NestedEnumMemberStatusWithAggregatesFilter<$PrismaModel> | $Enums.MemberStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumMemberStatusFilter<$PrismaModel>
    _max?: NestedEnumMemberStatusFilter<$PrismaModel>
  }

  export type NestedIntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type PostCreateWithoutAuthorInput = {
    id?: string
    title: string
    slug: string
    content: string
    views?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PostUncheckedCreateWithoutAuthorInput = {
    id?: string
    title: string
    slug: string
    content: string
    views?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PostCreateOrConnectWithoutAuthorInput = {
    where: PostWhereUniqueInput
    create: XOR<PostCreateWithoutAuthorInput, PostUncheckedCreateWithoutAuthorInput>
  }

  export type PostCreateManyAuthorInputEnvelope = {
    data: PostCreateManyAuthorInput | PostCreateManyAuthorInput[]
    skipDuplicates?: boolean
  }

  export type BlogPostCreateWithoutAuthorInput = {
    id?: string
    title: string
    slug: string
    content: string
    category?: string
    tags?: string
    status?: string
    featuredImg?: string | null
    views?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    memberAuthor?: MemberCreateNestedOneWithoutBlogPostsInput
    comments?: BlogCommentCreateNestedManyWithoutPostInput
    likes?: BlogLikeCreateNestedManyWithoutPostInput
  }

  export type BlogPostUncheckedCreateWithoutAuthorInput = {
    id?: string
    title: string
    slug: string
    content: string
    category?: string
    tags?: string
    status?: string
    featuredImg?: string | null
    views?: number
    memberId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    comments?: BlogCommentUncheckedCreateNestedManyWithoutPostInput
    likes?: BlogLikeUncheckedCreateNestedManyWithoutPostInput
  }

  export type BlogPostCreateOrConnectWithoutAuthorInput = {
    where: BlogPostWhereUniqueInput
    create: XOR<BlogPostCreateWithoutAuthorInput, BlogPostUncheckedCreateWithoutAuthorInput>
  }

  export type BlogPostCreateManyAuthorInputEnvelope = {
    data: BlogPostCreateManyAuthorInput | BlogPostCreateManyAuthorInput[]
    skipDuplicates?: boolean
  }

  export type PostUpsertWithWhereUniqueWithoutAuthorInput = {
    where: PostWhereUniqueInput
    update: XOR<PostUpdateWithoutAuthorInput, PostUncheckedUpdateWithoutAuthorInput>
    create: XOR<PostCreateWithoutAuthorInput, PostUncheckedCreateWithoutAuthorInput>
  }

  export type PostUpdateWithWhereUniqueWithoutAuthorInput = {
    where: PostWhereUniqueInput
    data: XOR<PostUpdateWithoutAuthorInput, PostUncheckedUpdateWithoutAuthorInput>
  }

  export type PostUpdateManyWithWhereWithoutAuthorInput = {
    where: PostScalarWhereInput
    data: XOR<PostUpdateManyMutationInput, PostUncheckedUpdateManyWithoutAuthorInput>
  }

  export type PostScalarWhereInput = {
    AND?: PostScalarWhereInput | PostScalarWhereInput[]
    OR?: PostScalarWhereInput[]
    NOT?: PostScalarWhereInput | PostScalarWhereInput[]
    id?: StringFilter<"Post"> | string
    title?: StringFilter<"Post"> | string
    slug?: StringFilter<"Post"> | string
    content?: StringFilter<"Post"> | string
    authorId?: StringFilter<"Post"> | string
    views?: IntFilter<"Post"> | number
    createdAt?: DateTimeFilter<"Post"> | Date | string
    updatedAt?: DateTimeFilter<"Post"> | Date | string
  }

  export type BlogPostUpsertWithWhereUniqueWithoutAuthorInput = {
    where: BlogPostWhereUniqueInput
    update: XOR<BlogPostUpdateWithoutAuthorInput, BlogPostUncheckedUpdateWithoutAuthorInput>
    create: XOR<BlogPostCreateWithoutAuthorInput, BlogPostUncheckedCreateWithoutAuthorInput>
  }

  export type BlogPostUpdateWithWhereUniqueWithoutAuthorInput = {
    where: BlogPostWhereUniqueInput
    data: XOR<BlogPostUpdateWithoutAuthorInput, BlogPostUncheckedUpdateWithoutAuthorInput>
  }

  export type BlogPostUpdateManyWithWhereWithoutAuthorInput = {
    where: BlogPostScalarWhereInput
    data: XOR<BlogPostUpdateManyMutationInput, BlogPostUncheckedUpdateManyWithoutAuthorInput>
  }

  export type BlogPostScalarWhereInput = {
    AND?: BlogPostScalarWhereInput | BlogPostScalarWhereInput[]
    OR?: BlogPostScalarWhereInput[]
    NOT?: BlogPostScalarWhereInput | BlogPostScalarWhereInput[]
    id?: StringFilter<"BlogPost"> | string
    title?: StringFilter<"BlogPost"> | string
    slug?: StringFilter<"BlogPost"> | string
    content?: StringFilter<"BlogPost"> | string
    category?: StringFilter<"BlogPost"> | string
    tags?: StringFilter<"BlogPost"> | string
    status?: StringFilter<"BlogPost"> | string
    featuredImg?: StringNullableFilter<"BlogPost"> | string | null
    views?: IntFilter<"BlogPost"> | number
    authorId?: StringNullableFilter<"BlogPost"> | string | null
    memberId?: StringNullableFilter<"BlogPost"> | string | null
    createdAt?: DateTimeFilter<"BlogPost"> | Date | string
    updatedAt?: DateTimeFilter<"BlogPost"> | Date | string
  }

  export type AdminCreateWithoutPostsInput = {
    id?: string
    username: string
    password: string
    role?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    blogPosts?: BlogPostCreateNestedManyWithoutAuthorInput
  }

  export type AdminUncheckedCreateWithoutPostsInput = {
    id?: string
    username: string
    password: string
    role?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    blogPosts?: BlogPostUncheckedCreateNestedManyWithoutAuthorInput
  }

  export type AdminCreateOrConnectWithoutPostsInput = {
    where: AdminWhereUniqueInput
    create: XOR<AdminCreateWithoutPostsInput, AdminUncheckedCreateWithoutPostsInput>
  }

  export type AdminUpsertWithoutPostsInput = {
    update: XOR<AdminUpdateWithoutPostsInput, AdminUncheckedUpdateWithoutPostsInput>
    create: XOR<AdminCreateWithoutPostsInput, AdminUncheckedCreateWithoutPostsInput>
    where?: AdminWhereInput
  }

  export type AdminUpdateToOneWithWhereWithoutPostsInput = {
    where?: AdminWhereInput
    data: XOR<AdminUpdateWithoutPostsInput, AdminUncheckedUpdateWithoutPostsInput>
  }

  export type AdminUpdateWithoutPostsInput = {
    id?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    blogPosts?: BlogPostUpdateManyWithoutAuthorNestedInput
  }

  export type AdminUncheckedUpdateWithoutPostsInput = {
    id?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    blogPosts?: BlogPostUncheckedUpdateManyWithoutAuthorNestedInput
  }

  export type AdminCreateWithoutBlogPostsInput = {
    id?: string
    username: string
    password: string
    role?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    posts?: PostCreateNestedManyWithoutAuthorInput
  }

  export type AdminUncheckedCreateWithoutBlogPostsInput = {
    id?: string
    username: string
    password: string
    role?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    posts?: PostUncheckedCreateNestedManyWithoutAuthorInput
  }

  export type AdminCreateOrConnectWithoutBlogPostsInput = {
    where: AdminWhereUniqueInput
    create: XOR<AdminCreateWithoutBlogPostsInput, AdminUncheckedCreateWithoutBlogPostsInput>
  }

  export type MemberCreateWithoutBlogPostsInput = {
    id?: string
    nisn?: string | null
    name: string
    className: string
    whatsappNumber: string
    email: string
    gender: string
    asalSekolah?: string
    password: string
    plainPassword?: string | null
    status?: $Enums.MemberStatus
    joinYear?: number
    role?: string
    photoPath?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    orgMember?: OrgMemberCreateNestedOneWithoutMemberInput
    blogComments?: BlogCommentCreateNestedManyWithoutMemberInput
    blogLikes?: BlogLikeCreateNestedManyWithoutMemberInput
  }

  export type MemberUncheckedCreateWithoutBlogPostsInput = {
    id?: string
    nisn?: string | null
    name: string
    className: string
    whatsappNumber: string
    email: string
    gender: string
    asalSekolah?: string
    password: string
    plainPassword?: string | null
    status?: $Enums.MemberStatus
    joinYear?: number
    role?: string
    photoPath?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    orgMember?: OrgMemberUncheckedCreateNestedOneWithoutMemberInput
    blogComments?: BlogCommentUncheckedCreateNestedManyWithoutMemberInput
    blogLikes?: BlogLikeUncheckedCreateNestedManyWithoutMemberInput
  }

  export type MemberCreateOrConnectWithoutBlogPostsInput = {
    where: MemberWhereUniqueInput
    create: XOR<MemberCreateWithoutBlogPostsInput, MemberUncheckedCreateWithoutBlogPostsInput>
  }

  export type BlogCommentCreateWithoutPostInput = {
    id?: string
    content: string
    username: string
    createdAt?: Date | string
    updatedAt?: Date | string
    member?: MemberCreateNestedOneWithoutBlogCommentsInput
    parent?: BlogCommentCreateNestedOneWithoutRepliesInput
    replies?: BlogCommentCreateNestedManyWithoutParentInput
  }

  export type BlogCommentUncheckedCreateWithoutPostInput = {
    id?: string
    content: string
    memberId?: string | null
    username: string
    parentId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    replies?: BlogCommentUncheckedCreateNestedManyWithoutParentInput
  }

  export type BlogCommentCreateOrConnectWithoutPostInput = {
    where: BlogCommentWhereUniqueInput
    create: XOR<BlogCommentCreateWithoutPostInput, BlogCommentUncheckedCreateWithoutPostInput>
  }

  export type BlogCommentCreateManyPostInputEnvelope = {
    data: BlogCommentCreateManyPostInput | BlogCommentCreateManyPostInput[]
    skipDuplicates?: boolean
  }

  export type BlogLikeCreateWithoutPostInput = {
    id?: string
    guestId?: string | null
    createdAt?: Date | string
    member?: MemberCreateNestedOneWithoutBlogLikesInput
  }

  export type BlogLikeUncheckedCreateWithoutPostInput = {
    id?: string
    memberId?: string | null
    guestId?: string | null
    createdAt?: Date | string
  }

  export type BlogLikeCreateOrConnectWithoutPostInput = {
    where: BlogLikeWhereUniqueInput
    create: XOR<BlogLikeCreateWithoutPostInput, BlogLikeUncheckedCreateWithoutPostInput>
  }

  export type BlogLikeCreateManyPostInputEnvelope = {
    data: BlogLikeCreateManyPostInput | BlogLikeCreateManyPostInput[]
    skipDuplicates?: boolean
  }

  export type AdminUpsertWithoutBlogPostsInput = {
    update: XOR<AdminUpdateWithoutBlogPostsInput, AdminUncheckedUpdateWithoutBlogPostsInput>
    create: XOR<AdminCreateWithoutBlogPostsInput, AdminUncheckedCreateWithoutBlogPostsInput>
    where?: AdminWhereInput
  }

  export type AdminUpdateToOneWithWhereWithoutBlogPostsInput = {
    where?: AdminWhereInput
    data: XOR<AdminUpdateWithoutBlogPostsInput, AdminUncheckedUpdateWithoutBlogPostsInput>
  }

  export type AdminUpdateWithoutBlogPostsInput = {
    id?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    posts?: PostUpdateManyWithoutAuthorNestedInput
  }

  export type AdminUncheckedUpdateWithoutBlogPostsInput = {
    id?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    posts?: PostUncheckedUpdateManyWithoutAuthorNestedInput
  }

  export type MemberUpsertWithoutBlogPostsInput = {
    update: XOR<MemberUpdateWithoutBlogPostsInput, MemberUncheckedUpdateWithoutBlogPostsInput>
    create: XOR<MemberCreateWithoutBlogPostsInput, MemberUncheckedCreateWithoutBlogPostsInput>
    where?: MemberWhereInput
  }

  export type MemberUpdateToOneWithWhereWithoutBlogPostsInput = {
    where?: MemberWhereInput
    data: XOR<MemberUpdateWithoutBlogPostsInput, MemberUncheckedUpdateWithoutBlogPostsInput>
  }

  export type MemberUpdateWithoutBlogPostsInput = {
    id?: StringFieldUpdateOperationsInput | string
    nisn?: NullableStringFieldUpdateOperationsInput | string | null
    name?: StringFieldUpdateOperationsInput | string
    className?: StringFieldUpdateOperationsInput | string
    whatsappNumber?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    gender?: StringFieldUpdateOperationsInput | string
    asalSekolah?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    plainPassword?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumMemberStatusFieldUpdateOperationsInput | $Enums.MemberStatus
    joinYear?: IntFieldUpdateOperationsInput | number
    role?: StringFieldUpdateOperationsInput | string
    photoPath?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    orgMember?: OrgMemberUpdateOneWithoutMemberNestedInput
    blogComments?: BlogCommentUpdateManyWithoutMemberNestedInput
    blogLikes?: BlogLikeUpdateManyWithoutMemberNestedInput
  }

  export type MemberUncheckedUpdateWithoutBlogPostsInput = {
    id?: StringFieldUpdateOperationsInput | string
    nisn?: NullableStringFieldUpdateOperationsInput | string | null
    name?: StringFieldUpdateOperationsInput | string
    className?: StringFieldUpdateOperationsInput | string
    whatsappNumber?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    gender?: StringFieldUpdateOperationsInput | string
    asalSekolah?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    plainPassword?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumMemberStatusFieldUpdateOperationsInput | $Enums.MemberStatus
    joinYear?: IntFieldUpdateOperationsInput | number
    role?: StringFieldUpdateOperationsInput | string
    photoPath?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    orgMember?: OrgMemberUncheckedUpdateOneWithoutMemberNestedInput
    blogComments?: BlogCommentUncheckedUpdateManyWithoutMemberNestedInput
    blogLikes?: BlogLikeUncheckedUpdateManyWithoutMemberNestedInput
  }

  export type BlogCommentUpsertWithWhereUniqueWithoutPostInput = {
    where: BlogCommentWhereUniqueInput
    update: XOR<BlogCommentUpdateWithoutPostInput, BlogCommentUncheckedUpdateWithoutPostInput>
    create: XOR<BlogCommentCreateWithoutPostInput, BlogCommentUncheckedCreateWithoutPostInput>
  }

  export type BlogCommentUpdateWithWhereUniqueWithoutPostInput = {
    where: BlogCommentWhereUniqueInput
    data: XOR<BlogCommentUpdateWithoutPostInput, BlogCommentUncheckedUpdateWithoutPostInput>
  }

  export type BlogCommentUpdateManyWithWhereWithoutPostInput = {
    where: BlogCommentScalarWhereInput
    data: XOR<BlogCommentUpdateManyMutationInput, BlogCommentUncheckedUpdateManyWithoutPostInput>
  }

  export type BlogCommentScalarWhereInput = {
    AND?: BlogCommentScalarWhereInput | BlogCommentScalarWhereInput[]
    OR?: BlogCommentScalarWhereInput[]
    NOT?: BlogCommentScalarWhereInput | BlogCommentScalarWhereInput[]
    id?: StringFilter<"BlogComment"> | string
    postId?: StringFilter<"BlogComment"> | string
    content?: StringFilter<"BlogComment"> | string
    memberId?: StringNullableFilter<"BlogComment"> | string | null
    username?: StringFilter<"BlogComment"> | string
    parentId?: StringNullableFilter<"BlogComment"> | string | null
    createdAt?: DateTimeFilter<"BlogComment"> | Date | string
    updatedAt?: DateTimeFilter<"BlogComment"> | Date | string
  }

  export type BlogLikeUpsertWithWhereUniqueWithoutPostInput = {
    where: BlogLikeWhereUniqueInput
    update: XOR<BlogLikeUpdateWithoutPostInput, BlogLikeUncheckedUpdateWithoutPostInput>
    create: XOR<BlogLikeCreateWithoutPostInput, BlogLikeUncheckedCreateWithoutPostInput>
  }

  export type BlogLikeUpdateWithWhereUniqueWithoutPostInput = {
    where: BlogLikeWhereUniqueInput
    data: XOR<BlogLikeUpdateWithoutPostInput, BlogLikeUncheckedUpdateWithoutPostInput>
  }

  export type BlogLikeUpdateManyWithWhereWithoutPostInput = {
    where: BlogLikeScalarWhereInput
    data: XOR<BlogLikeUpdateManyMutationInput, BlogLikeUncheckedUpdateManyWithoutPostInput>
  }

  export type BlogLikeScalarWhereInput = {
    AND?: BlogLikeScalarWhereInput | BlogLikeScalarWhereInput[]
    OR?: BlogLikeScalarWhereInput[]
    NOT?: BlogLikeScalarWhereInput | BlogLikeScalarWhereInput[]
    id?: StringFilter<"BlogLike"> | string
    postId?: StringFilter<"BlogLike"> | string
    memberId?: StringNullableFilter<"BlogLike"> | string | null
    guestId?: StringNullableFilter<"BlogLike"> | string | null
    createdAt?: DateTimeFilter<"BlogLike"> | Date | string
  }

  export type BlogPostCreateWithoutCommentsInput = {
    id?: string
    title: string
    slug: string
    content: string
    category?: string
    tags?: string
    status?: string
    featuredImg?: string | null
    views?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    author?: AdminCreateNestedOneWithoutBlogPostsInput
    memberAuthor?: MemberCreateNestedOneWithoutBlogPostsInput
    likes?: BlogLikeCreateNestedManyWithoutPostInput
  }

  export type BlogPostUncheckedCreateWithoutCommentsInput = {
    id?: string
    title: string
    slug: string
    content: string
    category?: string
    tags?: string
    status?: string
    featuredImg?: string | null
    views?: number
    authorId?: string | null
    memberId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    likes?: BlogLikeUncheckedCreateNestedManyWithoutPostInput
  }

  export type BlogPostCreateOrConnectWithoutCommentsInput = {
    where: BlogPostWhereUniqueInput
    create: XOR<BlogPostCreateWithoutCommentsInput, BlogPostUncheckedCreateWithoutCommentsInput>
  }

  export type MemberCreateWithoutBlogCommentsInput = {
    id?: string
    nisn?: string | null
    name: string
    className: string
    whatsappNumber: string
    email: string
    gender: string
    asalSekolah?: string
    password: string
    plainPassword?: string | null
    status?: $Enums.MemberStatus
    joinYear?: number
    role?: string
    photoPath?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    orgMember?: OrgMemberCreateNestedOneWithoutMemberInput
    blogPosts?: BlogPostCreateNestedManyWithoutMemberAuthorInput
    blogLikes?: BlogLikeCreateNestedManyWithoutMemberInput
  }

  export type MemberUncheckedCreateWithoutBlogCommentsInput = {
    id?: string
    nisn?: string | null
    name: string
    className: string
    whatsappNumber: string
    email: string
    gender: string
    asalSekolah?: string
    password: string
    plainPassword?: string | null
    status?: $Enums.MemberStatus
    joinYear?: number
    role?: string
    photoPath?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    orgMember?: OrgMemberUncheckedCreateNestedOneWithoutMemberInput
    blogPosts?: BlogPostUncheckedCreateNestedManyWithoutMemberAuthorInput
    blogLikes?: BlogLikeUncheckedCreateNestedManyWithoutMemberInput
  }

  export type MemberCreateOrConnectWithoutBlogCommentsInput = {
    where: MemberWhereUniqueInput
    create: XOR<MemberCreateWithoutBlogCommentsInput, MemberUncheckedCreateWithoutBlogCommentsInput>
  }

  export type BlogCommentCreateWithoutRepliesInput = {
    id?: string
    content: string
    username: string
    createdAt?: Date | string
    updatedAt?: Date | string
    post: BlogPostCreateNestedOneWithoutCommentsInput
    member?: MemberCreateNestedOneWithoutBlogCommentsInput
    parent?: BlogCommentCreateNestedOneWithoutRepliesInput
  }

  export type BlogCommentUncheckedCreateWithoutRepliesInput = {
    id?: string
    postId: string
    content: string
    memberId?: string | null
    username: string
    parentId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type BlogCommentCreateOrConnectWithoutRepliesInput = {
    where: BlogCommentWhereUniqueInput
    create: XOR<BlogCommentCreateWithoutRepliesInput, BlogCommentUncheckedCreateWithoutRepliesInput>
  }

  export type BlogCommentCreateWithoutParentInput = {
    id?: string
    content: string
    username: string
    createdAt?: Date | string
    updatedAt?: Date | string
    post: BlogPostCreateNestedOneWithoutCommentsInput
    member?: MemberCreateNestedOneWithoutBlogCommentsInput
    replies?: BlogCommentCreateNestedManyWithoutParentInput
  }

  export type BlogCommentUncheckedCreateWithoutParentInput = {
    id?: string
    postId: string
    content: string
    memberId?: string | null
    username: string
    createdAt?: Date | string
    updatedAt?: Date | string
    replies?: BlogCommentUncheckedCreateNestedManyWithoutParentInput
  }

  export type BlogCommentCreateOrConnectWithoutParentInput = {
    where: BlogCommentWhereUniqueInput
    create: XOR<BlogCommentCreateWithoutParentInput, BlogCommentUncheckedCreateWithoutParentInput>
  }

  export type BlogCommentCreateManyParentInputEnvelope = {
    data: BlogCommentCreateManyParentInput | BlogCommentCreateManyParentInput[]
    skipDuplicates?: boolean
  }

  export type BlogPostUpsertWithoutCommentsInput = {
    update: XOR<BlogPostUpdateWithoutCommentsInput, BlogPostUncheckedUpdateWithoutCommentsInput>
    create: XOR<BlogPostCreateWithoutCommentsInput, BlogPostUncheckedCreateWithoutCommentsInput>
    where?: BlogPostWhereInput
  }

  export type BlogPostUpdateToOneWithWhereWithoutCommentsInput = {
    where?: BlogPostWhereInput
    data: XOR<BlogPostUpdateWithoutCommentsInput, BlogPostUncheckedUpdateWithoutCommentsInput>
  }

  export type BlogPostUpdateWithoutCommentsInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    tags?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    featuredImg?: NullableStringFieldUpdateOperationsInput | string | null
    views?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    author?: AdminUpdateOneWithoutBlogPostsNestedInput
    memberAuthor?: MemberUpdateOneWithoutBlogPostsNestedInput
    likes?: BlogLikeUpdateManyWithoutPostNestedInput
  }

  export type BlogPostUncheckedUpdateWithoutCommentsInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    tags?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    featuredImg?: NullableStringFieldUpdateOperationsInput | string | null
    views?: IntFieldUpdateOperationsInput | number
    authorId?: NullableStringFieldUpdateOperationsInput | string | null
    memberId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    likes?: BlogLikeUncheckedUpdateManyWithoutPostNestedInput
  }

  export type MemberUpsertWithoutBlogCommentsInput = {
    update: XOR<MemberUpdateWithoutBlogCommentsInput, MemberUncheckedUpdateWithoutBlogCommentsInput>
    create: XOR<MemberCreateWithoutBlogCommentsInput, MemberUncheckedCreateWithoutBlogCommentsInput>
    where?: MemberWhereInput
  }

  export type MemberUpdateToOneWithWhereWithoutBlogCommentsInput = {
    where?: MemberWhereInput
    data: XOR<MemberUpdateWithoutBlogCommentsInput, MemberUncheckedUpdateWithoutBlogCommentsInput>
  }

  export type MemberUpdateWithoutBlogCommentsInput = {
    id?: StringFieldUpdateOperationsInput | string
    nisn?: NullableStringFieldUpdateOperationsInput | string | null
    name?: StringFieldUpdateOperationsInput | string
    className?: StringFieldUpdateOperationsInput | string
    whatsappNumber?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    gender?: StringFieldUpdateOperationsInput | string
    asalSekolah?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    plainPassword?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumMemberStatusFieldUpdateOperationsInput | $Enums.MemberStatus
    joinYear?: IntFieldUpdateOperationsInput | number
    role?: StringFieldUpdateOperationsInput | string
    photoPath?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    orgMember?: OrgMemberUpdateOneWithoutMemberNestedInput
    blogPosts?: BlogPostUpdateManyWithoutMemberAuthorNestedInput
    blogLikes?: BlogLikeUpdateManyWithoutMemberNestedInput
  }

  export type MemberUncheckedUpdateWithoutBlogCommentsInput = {
    id?: StringFieldUpdateOperationsInput | string
    nisn?: NullableStringFieldUpdateOperationsInput | string | null
    name?: StringFieldUpdateOperationsInput | string
    className?: StringFieldUpdateOperationsInput | string
    whatsappNumber?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    gender?: StringFieldUpdateOperationsInput | string
    asalSekolah?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    plainPassword?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumMemberStatusFieldUpdateOperationsInput | $Enums.MemberStatus
    joinYear?: IntFieldUpdateOperationsInput | number
    role?: StringFieldUpdateOperationsInput | string
    photoPath?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    orgMember?: OrgMemberUncheckedUpdateOneWithoutMemberNestedInput
    blogPosts?: BlogPostUncheckedUpdateManyWithoutMemberAuthorNestedInput
    blogLikes?: BlogLikeUncheckedUpdateManyWithoutMemberNestedInput
  }

  export type BlogCommentUpsertWithoutRepliesInput = {
    update: XOR<BlogCommentUpdateWithoutRepliesInput, BlogCommentUncheckedUpdateWithoutRepliesInput>
    create: XOR<BlogCommentCreateWithoutRepliesInput, BlogCommentUncheckedCreateWithoutRepliesInput>
    where?: BlogCommentWhereInput
  }

  export type BlogCommentUpdateToOneWithWhereWithoutRepliesInput = {
    where?: BlogCommentWhereInput
    data: XOR<BlogCommentUpdateWithoutRepliesInput, BlogCommentUncheckedUpdateWithoutRepliesInput>
  }

  export type BlogCommentUpdateWithoutRepliesInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    post?: BlogPostUpdateOneRequiredWithoutCommentsNestedInput
    member?: MemberUpdateOneWithoutBlogCommentsNestedInput
    parent?: BlogCommentUpdateOneWithoutRepliesNestedInput
  }

  export type BlogCommentUncheckedUpdateWithoutRepliesInput = {
    id?: StringFieldUpdateOperationsInput | string
    postId?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    memberId?: NullableStringFieldUpdateOperationsInput | string | null
    username?: StringFieldUpdateOperationsInput | string
    parentId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BlogCommentUpsertWithWhereUniqueWithoutParentInput = {
    where: BlogCommentWhereUniqueInput
    update: XOR<BlogCommentUpdateWithoutParentInput, BlogCommentUncheckedUpdateWithoutParentInput>
    create: XOR<BlogCommentCreateWithoutParentInput, BlogCommentUncheckedCreateWithoutParentInput>
  }

  export type BlogCommentUpdateWithWhereUniqueWithoutParentInput = {
    where: BlogCommentWhereUniqueInput
    data: XOR<BlogCommentUpdateWithoutParentInput, BlogCommentUncheckedUpdateWithoutParentInput>
  }

  export type BlogCommentUpdateManyWithWhereWithoutParentInput = {
    where: BlogCommentScalarWhereInput
    data: XOR<BlogCommentUpdateManyMutationInput, BlogCommentUncheckedUpdateManyWithoutParentInput>
  }

  export type BlogPostCreateWithoutLikesInput = {
    id?: string
    title: string
    slug: string
    content: string
    category?: string
    tags?: string
    status?: string
    featuredImg?: string | null
    views?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    author?: AdminCreateNestedOneWithoutBlogPostsInput
    memberAuthor?: MemberCreateNestedOneWithoutBlogPostsInput
    comments?: BlogCommentCreateNestedManyWithoutPostInput
  }

  export type BlogPostUncheckedCreateWithoutLikesInput = {
    id?: string
    title: string
    slug: string
    content: string
    category?: string
    tags?: string
    status?: string
    featuredImg?: string | null
    views?: number
    authorId?: string | null
    memberId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    comments?: BlogCommentUncheckedCreateNestedManyWithoutPostInput
  }

  export type BlogPostCreateOrConnectWithoutLikesInput = {
    where: BlogPostWhereUniqueInput
    create: XOR<BlogPostCreateWithoutLikesInput, BlogPostUncheckedCreateWithoutLikesInput>
  }

  export type MemberCreateWithoutBlogLikesInput = {
    id?: string
    nisn?: string | null
    name: string
    className: string
    whatsappNumber: string
    email: string
    gender: string
    asalSekolah?: string
    password: string
    plainPassword?: string | null
    status?: $Enums.MemberStatus
    joinYear?: number
    role?: string
    photoPath?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    orgMember?: OrgMemberCreateNestedOneWithoutMemberInput
    blogPosts?: BlogPostCreateNestedManyWithoutMemberAuthorInput
    blogComments?: BlogCommentCreateNestedManyWithoutMemberInput
  }

  export type MemberUncheckedCreateWithoutBlogLikesInput = {
    id?: string
    nisn?: string | null
    name: string
    className: string
    whatsappNumber: string
    email: string
    gender: string
    asalSekolah?: string
    password: string
    plainPassword?: string | null
    status?: $Enums.MemberStatus
    joinYear?: number
    role?: string
    photoPath?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    orgMember?: OrgMemberUncheckedCreateNestedOneWithoutMemberInput
    blogPosts?: BlogPostUncheckedCreateNestedManyWithoutMemberAuthorInput
    blogComments?: BlogCommentUncheckedCreateNestedManyWithoutMemberInput
  }

  export type MemberCreateOrConnectWithoutBlogLikesInput = {
    where: MemberWhereUniqueInput
    create: XOR<MemberCreateWithoutBlogLikesInput, MemberUncheckedCreateWithoutBlogLikesInput>
  }

  export type BlogPostUpsertWithoutLikesInput = {
    update: XOR<BlogPostUpdateWithoutLikesInput, BlogPostUncheckedUpdateWithoutLikesInput>
    create: XOR<BlogPostCreateWithoutLikesInput, BlogPostUncheckedCreateWithoutLikesInput>
    where?: BlogPostWhereInput
  }

  export type BlogPostUpdateToOneWithWhereWithoutLikesInput = {
    where?: BlogPostWhereInput
    data: XOR<BlogPostUpdateWithoutLikesInput, BlogPostUncheckedUpdateWithoutLikesInput>
  }

  export type BlogPostUpdateWithoutLikesInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    tags?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    featuredImg?: NullableStringFieldUpdateOperationsInput | string | null
    views?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    author?: AdminUpdateOneWithoutBlogPostsNestedInput
    memberAuthor?: MemberUpdateOneWithoutBlogPostsNestedInput
    comments?: BlogCommentUpdateManyWithoutPostNestedInput
  }

  export type BlogPostUncheckedUpdateWithoutLikesInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    tags?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    featuredImg?: NullableStringFieldUpdateOperationsInput | string | null
    views?: IntFieldUpdateOperationsInput | number
    authorId?: NullableStringFieldUpdateOperationsInput | string | null
    memberId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    comments?: BlogCommentUncheckedUpdateManyWithoutPostNestedInput
  }

  export type MemberUpsertWithoutBlogLikesInput = {
    update: XOR<MemberUpdateWithoutBlogLikesInput, MemberUncheckedUpdateWithoutBlogLikesInput>
    create: XOR<MemberCreateWithoutBlogLikesInput, MemberUncheckedCreateWithoutBlogLikesInput>
    where?: MemberWhereInput
  }

  export type MemberUpdateToOneWithWhereWithoutBlogLikesInput = {
    where?: MemberWhereInput
    data: XOR<MemberUpdateWithoutBlogLikesInput, MemberUncheckedUpdateWithoutBlogLikesInput>
  }

  export type MemberUpdateWithoutBlogLikesInput = {
    id?: StringFieldUpdateOperationsInput | string
    nisn?: NullableStringFieldUpdateOperationsInput | string | null
    name?: StringFieldUpdateOperationsInput | string
    className?: StringFieldUpdateOperationsInput | string
    whatsappNumber?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    gender?: StringFieldUpdateOperationsInput | string
    asalSekolah?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    plainPassword?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumMemberStatusFieldUpdateOperationsInput | $Enums.MemberStatus
    joinYear?: IntFieldUpdateOperationsInput | number
    role?: StringFieldUpdateOperationsInput | string
    photoPath?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    orgMember?: OrgMemberUpdateOneWithoutMemberNestedInput
    blogPosts?: BlogPostUpdateManyWithoutMemberAuthorNestedInput
    blogComments?: BlogCommentUpdateManyWithoutMemberNestedInput
  }

  export type MemberUncheckedUpdateWithoutBlogLikesInput = {
    id?: StringFieldUpdateOperationsInput | string
    nisn?: NullableStringFieldUpdateOperationsInput | string | null
    name?: StringFieldUpdateOperationsInput | string
    className?: StringFieldUpdateOperationsInput | string
    whatsappNumber?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    gender?: StringFieldUpdateOperationsInput | string
    asalSekolah?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    plainPassword?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumMemberStatusFieldUpdateOperationsInput | $Enums.MemberStatus
    joinYear?: IntFieldUpdateOperationsInput | number
    role?: StringFieldUpdateOperationsInput | string
    photoPath?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    orgMember?: OrgMemberUncheckedUpdateOneWithoutMemberNestedInput
    blogPosts?: BlogPostUncheckedUpdateManyWithoutMemberAuthorNestedInput
    blogComments?: BlogCommentUncheckedUpdateManyWithoutMemberNestedInput
  }

  export type OrgMemberCreateWithoutMemberInput = {
    id?: string
    name: string
    role: string
    jabatan: string
    yearStart: number
    yearEnd?: number | null
    isCurrent?: boolean
    photoPath?: string | null
    quote?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type OrgMemberUncheckedCreateWithoutMemberInput = {
    id?: string
    name: string
    role: string
    jabatan: string
    yearStart: number
    yearEnd?: number | null
    isCurrent?: boolean
    photoPath?: string | null
    quote?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type OrgMemberCreateOrConnectWithoutMemberInput = {
    where: OrgMemberWhereUniqueInput
    create: XOR<OrgMemberCreateWithoutMemberInput, OrgMemberUncheckedCreateWithoutMemberInput>
  }

  export type BlogPostCreateWithoutMemberAuthorInput = {
    id?: string
    title: string
    slug: string
    content: string
    category?: string
    tags?: string
    status?: string
    featuredImg?: string | null
    views?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    author?: AdminCreateNestedOneWithoutBlogPostsInput
    comments?: BlogCommentCreateNestedManyWithoutPostInput
    likes?: BlogLikeCreateNestedManyWithoutPostInput
  }

  export type BlogPostUncheckedCreateWithoutMemberAuthorInput = {
    id?: string
    title: string
    slug: string
    content: string
    category?: string
    tags?: string
    status?: string
    featuredImg?: string | null
    views?: number
    authorId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    comments?: BlogCommentUncheckedCreateNestedManyWithoutPostInput
    likes?: BlogLikeUncheckedCreateNestedManyWithoutPostInput
  }

  export type BlogPostCreateOrConnectWithoutMemberAuthorInput = {
    where: BlogPostWhereUniqueInput
    create: XOR<BlogPostCreateWithoutMemberAuthorInput, BlogPostUncheckedCreateWithoutMemberAuthorInput>
  }

  export type BlogPostCreateManyMemberAuthorInputEnvelope = {
    data: BlogPostCreateManyMemberAuthorInput | BlogPostCreateManyMemberAuthorInput[]
    skipDuplicates?: boolean
  }

  export type BlogCommentCreateWithoutMemberInput = {
    id?: string
    content: string
    username: string
    createdAt?: Date | string
    updatedAt?: Date | string
    post: BlogPostCreateNestedOneWithoutCommentsInput
    parent?: BlogCommentCreateNestedOneWithoutRepliesInput
    replies?: BlogCommentCreateNestedManyWithoutParentInput
  }

  export type BlogCommentUncheckedCreateWithoutMemberInput = {
    id?: string
    postId: string
    content: string
    username: string
    parentId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    replies?: BlogCommentUncheckedCreateNestedManyWithoutParentInput
  }

  export type BlogCommentCreateOrConnectWithoutMemberInput = {
    where: BlogCommentWhereUniqueInput
    create: XOR<BlogCommentCreateWithoutMemberInput, BlogCommentUncheckedCreateWithoutMemberInput>
  }

  export type BlogCommentCreateManyMemberInputEnvelope = {
    data: BlogCommentCreateManyMemberInput | BlogCommentCreateManyMemberInput[]
    skipDuplicates?: boolean
  }

  export type BlogLikeCreateWithoutMemberInput = {
    id?: string
    guestId?: string | null
    createdAt?: Date | string
    post: BlogPostCreateNestedOneWithoutLikesInput
  }

  export type BlogLikeUncheckedCreateWithoutMemberInput = {
    id?: string
    postId: string
    guestId?: string | null
    createdAt?: Date | string
  }

  export type BlogLikeCreateOrConnectWithoutMemberInput = {
    where: BlogLikeWhereUniqueInput
    create: XOR<BlogLikeCreateWithoutMemberInput, BlogLikeUncheckedCreateWithoutMemberInput>
  }

  export type BlogLikeCreateManyMemberInputEnvelope = {
    data: BlogLikeCreateManyMemberInput | BlogLikeCreateManyMemberInput[]
    skipDuplicates?: boolean
  }

  export type OrgMemberUpsertWithoutMemberInput = {
    update: XOR<OrgMemberUpdateWithoutMemberInput, OrgMemberUncheckedUpdateWithoutMemberInput>
    create: XOR<OrgMemberCreateWithoutMemberInput, OrgMemberUncheckedCreateWithoutMemberInput>
    where?: OrgMemberWhereInput
  }

  export type OrgMemberUpdateToOneWithWhereWithoutMemberInput = {
    where?: OrgMemberWhereInput
    data: XOR<OrgMemberUpdateWithoutMemberInput, OrgMemberUncheckedUpdateWithoutMemberInput>
  }

  export type OrgMemberUpdateWithoutMemberInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    jabatan?: StringFieldUpdateOperationsInput | string
    yearStart?: IntFieldUpdateOperationsInput | number
    yearEnd?: NullableIntFieldUpdateOperationsInput | number | null
    isCurrent?: BoolFieldUpdateOperationsInput | boolean
    photoPath?: NullableStringFieldUpdateOperationsInput | string | null
    quote?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type OrgMemberUncheckedUpdateWithoutMemberInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    jabatan?: StringFieldUpdateOperationsInput | string
    yearStart?: IntFieldUpdateOperationsInput | number
    yearEnd?: NullableIntFieldUpdateOperationsInput | number | null
    isCurrent?: BoolFieldUpdateOperationsInput | boolean
    photoPath?: NullableStringFieldUpdateOperationsInput | string | null
    quote?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BlogPostUpsertWithWhereUniqueWithoutMemberAuthorInput = {
    where: BlogPostWhereUniqueInput
    update: XOR<BlogPostUpdateWithoutMemberAuthorInput, BlogPostUncheckedUpdateWithoutMemberAuthorInput>
    create: XOR<BlogPostCreateWithoutMemberAuthorInput, BlogPostUncheckedCreateWithoutMemberAuthorInput>
  }

  export type BlogPostUpdateWithWhereUniqueWithoutMemberAuthorInput = {
    where: BlogPostWhereUniqueInput
    data: XOR<BlogPostUpdateWithoutMemberAuthorInput, BlogPostUncheckedUpdateWithoutMemberAuthorInput>
  }

  export type BlogPostUpdateManyWithWhereWithoutMemberAuthorInput = {
    where: BlogPostScalarWhereInput
    data: XOR<BlogPostUpdateManyMutationInput, BlogPostUncheckedUpdateManyWithoutMemberAuthorInput>
  }

  export type BlogCommentUpsertWithWhereUniqueWithoutMemberInput = {
    where: BlogCommentWhereUniqueInput
    update: XOR<BlogCommentUpdateWithoutMemberInput, BlogCommentUncheckedUpdateWithoutMemberInput>
    create: XOR<BlogCommentCreateWithoutMemberInput, BlogCommentUncheckedCreateWithoutMemberInput>
  }

  export type BlogCommentUpdateWithWhereUniqueWithoutMemberInput = {
    where: BlogCommentWhereUniqueInput
    data: XOR<BlogCommentUpdateWithoutMemberInput, BlogCommentUncheckedUpdateWithoutMemberInput>
  }

  export type BlogCommentUpdateManyWithWhereWithoutMemberInput = {
    where: BlogCommentScalarWhereInput
    data: XOR<BlogCommentUpdateManyMutationInput, BlogCommentUncheckedUpdateManyWithoutMemberInput>
  }

  export type BlogLikeUpsertWithWhereUniqueWithoutMemberInput = {
    where: BlogLikeWhereUniqueInput
    update: XOR<BlogLikeUpdateWithoutMemberInput, BlogLikeUncheckedUpdateWithoutMemberInput>
    create: XOR<BlogLikeCreateWithoutMemberInput, BlogLikeUncheckedCreateWithoutMemberInput>
  }

  export type BlogLikeUpdateWithWhereUniqueWithoutMemberInput = {
    where: BlogLikeWhereUniqueInput
    data: XOR<BlogLikeUpdateWithoutMemberInput, BlogLikeUncheckedUpdateWithoutMemberInput>
  }

  export type BlogLikeUpdateManyWithWhereWithoutMemberInput = {
    where: BlogLikeScalarWhereInput
    data: XOR<BlogLikeUpdateManyMutationInput, BlogLikeUncheckedUpdateManyWithoutMemberInput>
  }

  export type MemberCreateWithoutOrgMemberInput = {
    id?: string
    nisn?: string | null
    name: string
    className: string
    whatsappNumber: string
    email: string
    gender: string
    asalSekolah?: string
    password: string
    plainPassword?: string | null
    status?: $Enums.MemberStatus
    joinYear?: number
    role?: string
    photoPath?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    blogPosts?: BlogPostCreateNestedManyWithoutMemberAuthorInput
    blogComments?: BlogCommentCreateNestedManyWithoutMemberInput
    blogLikes?: BlogLikeCreateNestedManyWithoutMemberInput
  }

  export type MemberUncheckedCreateWithoutOrgMemberInput = {
    id?: string
    nisn?: string | null
    name: string
    className: string
    whatsappNumber: string
    email: string
    gender: string
    asalSekolah?: string
    password: string
    plainPassword?: string | null
    status?: $Enums.MemberStatus
    joinYear?: number
    role?: string
    photoPath?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    blogPosts?: BlogPostUncheckedCreateNestedManyWithoutMemberAuthorInput
    blogComments?: BlogCommentUncheckedCreateNestedManyWithoutMemberInput
    blogLikes?: BlogLikeUncheckedCreateNestedManyWithoutMemberInput
  }

  export type MemberCreateOrConnectWithoutOrgMemberInput = {
    where: MemberWhereUniqueInput
    create: XOR<MemberCreateWithoutOrgMemberInput, MemberUncheckedCreateWithoutOrgMemberInput>
  }

  export type MemberUpsertWithoutOrgMemberInput = {
    update: XOR<MemberUpdateWithoutOrgMemberInput, MemberUncheckedUpdateWithoutOrgMemberInput>
    create: XOR<MemberCreateWithoutOrgMemberInput, MemberUncheckedCreateWithoutOrgMemberInput>
    where?: MemberWhereInput
  }

  export type MemberUpdateToOneWithWhereWithoutOrgMemberInput = {
    where?: MemberWhereInput
    data: XOR<MemberUpdateWithoutOrgMemberInput, MemberUncheckedUpdateWithoutOrgMemberInput>
  }

  export type MemberUpdateWithoutOrgMemberInput = {
    id?: StringFieldUpdateOperationsInput | string
    nisn?: NullableStringFieldUpdateOperationsInput | string | null
    name?: StringFieldUpdateOperationsInput | string
    className?: StringFieldUpdateOperationsInput | string
    whatsappNumber?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    gender?: StringFieldUpdateOperationsInput | string
    asalSekolah?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    plainPassword?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumMemberStatusFieldUpdateOperationsInput | $Enums.MemberStatus
    joinYear?: IntFieldUpdateOperationsInput | number
    role?: StringFieldUpdateOperationsInput | string
    photoPath?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    blogPosts?: BlogPostUpdateManyWithoutMemberAuthorNestedInput
    blogComments?: BlogCommentUpdateManyWithoutMemberNestedInput
    blogLikes?: BlogLikeUpdateManyWithoutMemberNestedInput
  }

  export type MemberUncheckedUpdateWithoutOrgMemberInput = {
    id?: StringFieldUpdateOperationsInput | string
    nisn?: NullableStringFieldUpdateOperationsInput | string | null
    name?: StringFieldUpdateOperationsInput | string
    className?: StringFieldUpdateOperationsInput | string
    whatsappNumber?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    gender?: StringFieldUpdateOperationsInput | string
    asalSekolah?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    plainPassword?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumMemberStatusFieldUpdateOperationsInput | $Enums.MemberStatus
    joinYear?: IntFieldUpdateOperationsInput | number
    role?: StringFieldUpdateOperationsInput | string
    photoPath?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    blogPosts?: BlogPostUncheckedUpdateManyWithoutMemberAuthorNestedInput
    blogComments?: BlogCommentUncheckedUpdateManyWithoutMemberNestedInput
    blogLikes?: BlogLikeUncheckedUpdateManyWithoutMemberNestedInput
  }

  export type PostCreateManyAuthorInput = {
    id?: string
    title: string
    slug: string
    content: string
    views?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type BlogPostCreateManyAuthorInput = {
    id?: string
    title: string
    slug: string
    content: string
    category?: string
    tags?: string
    status?: string
    featuredImg?: string | null
    views?: number
    memberId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PostUpdateWithoutAuthorInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    views?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PostUncheckedUpdateWithoutAuthorInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    views?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PostUncheckedUpdateManyWithoutAuthorInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    views?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BlogPostUpdateWithoutAuthorInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    tags?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    featuredImg?: NullableStringFieldUpdateOperationsInput | string | null
    views?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    memberAuthor?: MemberUpdateOneWithoutBlogPostsNestedInput
    comments?: BlogCommentUpdateManyWithoutPostNestedInput
    likes?: BlogLikeUpdateManyWithoutPostNestedInput
  }

  export type BlogPostUncheckedUpdateWithoutAuthorInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    tags?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    featuredImg?: NullableStringFieldUpdateOperationsInput | string | null
    views?: IntFieldUpdateOperationsInput | number
    memberId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    comments?: BlogCommentUncheckedUpdateManyWithoutPostNestedInput
    likes?: BlogLikeUncheckedUpdateManyWithoutPostNestedInput
  }

  export type BlogPostUncheckedUpdateManyWithoutAuthorInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    tags?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    featuredImg?: NullableStringFieldUpdateOperationsInput | string | null
    views?: IntFieldUpdateOperationsInput | number
    memberId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BlogCommentCreateManyPostInput = {
    id?: string
    content: string
    memberId?: string | null
    username: string
    parentId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type BlogLikeCreateManyPostInput = {
    id?: string
    memberId?: string | null
    guestId?: string | null
    createdAt?: Date | string
  }

  export type BlogCommentUpdateWithoutPostInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    member?: MemberUpdateOneWithoutBlogCommentsNestedInput
    parent?: BlogCommentUpdateOneWithoutRepliesNestedInput
    replies?: BlogCommentUpdateManyWithoutParentNestedInput
  }

  export type BlogCommentUncheckedUpdateWithoutPostInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    memberId?: NullableStringFieldUpdateOperationsInput | string | null
    username?: StringFieldUpdateOperationsInput | string
    parentId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    replies?: BlogCommentUncheckedUpdateManyWithoutParentNestedInput
  }

  export type BlogCommentUncheckedUpdateManyWithoutPostInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    memberId?: NullableStringFieldUpdateOperationsInput | string | null
    username?: StringFieldUpdateOperationsInput | string
    parentId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BlogLikeUpdateWithoutPostInput = {
    id?: StringFieldUpdateOperationsInput | string
    guestId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    member?: MemberUpdateOneWithoutBlogLikesNestedInput
  }

  export type BlogLikeUncheckedUpdateWithoutPostInput = {
    id?: StringFieldUpdateOperationsInput | string
    memberId?: NullableStringFieldUpdateOperationsInput | string | null
    guestId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BlogLikeUncheckedUpdateManyWithoutPostInput = {
    id?: StringFieldUpdateOperationsInput | string
    memberId?: NullableStringFieldUpdateOperationsInput | string | null
    guestId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BlogCommentCreateManyParentInput = {
    id?: string
    postId: string
    content: string
    memberId?: string | null
    username: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type BlogCommentUpdateWithoutParentInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    post?: BlogPostUpdateOneRequiredWithoutCommentsNestedInput
    member?: MemberUpdateOneWithoutBlogCommentsNestedInput
    replies?: BlogCommentUpdateManyWithoutParentNestedInput
  }

  export type BlogCommentUncheckedUpdateWithoutParentInput = {
    id?: StringFieldUpdateOperationsInput | string
    postId?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    memberId?: NullableStringFieldUpdateOperationsInput | string | null
    username?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    replies?: BlogCommentUncheckedUpdateManyWithoutParentNestedInput
  }

  export type BlogCommentUncheckedUpdateManyWithoutParentInput = {
    id?: StringFieldUpdateOperationsInput | string
    postId?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    memberId?: NullableStringFieldUpdateOperationsInput | string | null
    username?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BlogPostCreateManyMemberAuthorInput = {
    id?: string
    title: string
    slug: string
    content: string
    category?: string
    tags?: string
    status?: string
    featuredImg?: string | null
    views?: number
    authorId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type BlogCommentCreateManyMemberInput = {
    id?: string
    postId: string
    content: string
    username: string
    parentId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type BlogLikeCreateManyMemberInput = {
    id?: string
    postId: string
    guestId?: string | null
    createdAt?: Date | string
  }

  export type BlogPostUpdateWithoutMemberAuthorInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    tags?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    featuredImg?: NullableStringFieldUpdateOperationsInput | string | null
    views?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    author?: AdminUpdateOneWithoutBlogPostsNestedInput
    comments?: BlogCommentUpdateManyWithoutPostNestedInput
    likes?: BlogLikeUpdateManyWithoutPostNestedInput
  }

  export type BlogPostUncheckedUpdateWithoutMemberAuthorInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    tags?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    featuredImg?: NullableStringFieldUpdateOperationsInput | string | null
    views?: IntFieldUpdateOperationsInput | number
    authorId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    comments?: BlogCommentUncheckedUpdateManyWithoutPostNestedInput
    likes?: BlogLikeUncheckedUpdateManyWithoutPostNestedInput
  }

  export type BlogPostUncheckedUpdateManyWithoutMemberAuthorInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    tags?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    featuredImg?: NullableStringFieldUpdateOperationsInput | string | null
    views?: IntFieldUpdateOperationsInput | number
    authorId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BlogCommentUpdateWithoutMemberInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    post?: BlogPostUpdateOneRequiredWithoutCommentsNestedInput
    parent?: BlogCommentUpdateOneWithoutRepliesNestedInput
    replies?: BlogCommentUpdateManyWithoutParentNestedInput
  }

  export type BlogCommentUncheckedUpdateWithoutMemberInput = {
    id?: StringFieldUpdateOperationsInput | string
    postId?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    parentId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    replies?: BlogCommentUncheckedUpdateManyWithoutParentNestedInput
  }

  export type BlogCommentUncheckedUpdateManyWithoutMemberInput = {
    id?: StringFieldUpdateOperationsInput | string
    postId?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    parentId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BlogLikeUpdateWithoutMemberInput = {
    id?: StringFieldUpdateOperationsInput | string
    guestId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    post?: BlogPostUpdateOneRequiredWithoutLikesNestedInput
  }

  export type BlogLikeUncheckedUpdateWithoutMemberInput = {
    id?: StringFieldUpdateOperationsInput | string
    postId?: StringFieldUpdateOperationsInput | string
    guestId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BlogLikeUncheckedUpdateManyWithoutMemberInput = {
    id?: StringFieldUpdateOperationsInput | string
    postId?: StringFieldUpdateOperationsInput | string
    guestId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}