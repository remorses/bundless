# @bundless/cli

## 0.6.0

### Minor Changes

-   Fixed problems with yarn berry and missing prebundled packages, better console messages

## 0.5.1

### Patch Changes

-   Fix dead lock when not passing entries during prebundle

## 0.5.0

### Minor Changes

-   Implemented immutable cache for all files, much faster refresh speed

## 0.4.0

### Minor Changes

-   Cache dependencies, fix NODE_ENV variable always in production when prebundling

## 0.3.0

### Minor Changes

-   Many improvements

## 0.2.6

### Patch Changes

-   Updated esbuild

## 0.2.5

### Patch Changes

-   Added support for importableAssetsExtensions

## 0.2.4

### Patch Changes

-   717a68e: Fix npm release, removed bin

## 0.2.3

### Patch Changes

-   bd7ed34: Added enforce option to plugins

## 0.2.2

### Patch Changes

-   709ef96: Fix define assignments in client template

## 0.2.1

### Patch Changes

-   ca42b40: Fix define runtime error in client code

## 0.2.0

### Minor Changes

-   9a0b4e5: Do not use esbuild when loader is js, inject defines in window

## 0.1.9

### Patch Changes

-   0c5c9b2: Store web_modules inside .bundless

## 0.1.8

### Patch Changes

-   bbbd527: Bump

## 0.1.7

### Patch Changes

-   325516d: rename dotdot encondig to **..**
-   f7684e8: Added basepath support

## 0.1.6

### Patch Changes

-   3541033: Added includeWorkspacePackages option

## 0.1.5

### Patch Changes

-   2e6022f: Small improvements

## 0.1.4

### Patch Changes

-   9c57b90: Better build logs

## 0.1.3

### Patch Changes

-   1b976b6: Less noise in logs, prebundle at start

## 0.1.2

### Patch Changes

-   410f40a: Better logs on nonResolved

## 0.1.1

### Patch Changes

-   7eaff10: Export babelParserOptions

## 0.1.0

### Minor Changes

-   81c8e26: First release
