// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

// Nil describes a null or undefined value;
export type Nil = null | undefined;

// Maybe describes a type that is `T`, or `Nil`
export type Maybe<T> = T | Nil;

// Newable ensures that a given value is a constructor
export type Newable<T, A extends unknown[] = unknown[]> = new (...args: A) => T;

// Extends<T> mimics Newable<T>, but works for abstract classes as well
export type Extends<T> = Function & { prototype: T }; // eslint-disable-line @typescript-eslint/ban-types
