## Paloma

[![NPM version][npm-image]][npm-url]
[![Build status][travis-image]][travis-url]
[![Dependency Status][david-image]][david-url]
[![License][license-image]][license-url]
[![Downloads][downloads-image]][downloads-url]

An angluar-like MVC framework, based on:

- [koa@2](https://github.com/koajs/koa/tree/v2.x): Next generation web framework for node.js.
- [bottlejs](https://github.com/young-steveo/bottlejs): A powerful dependency injection micro container.

### Installation

```
$ npm i paloma --save
```

If you use `async` function as controller, you may need node v7.0.0+ or babel.

### Example

**Common function**

```
'use strict';

const Paloma = require('paloma');
const app = new Paloma();

app.controller('indexCtrl', function (ctx, next, indexService) {
  ctx.body = `Hello, ${indexService.getName()}`;
});

app.service('indexService', function () {
  this.getName = function () {
    return 'Paloma';
  };
});

app.route({
  method: 'GET',
  path: '/',
  controller: 'indexCtrl'
});

app.listen(3000);
```

**Async function**

```
'use strict';

const Paloma = require('paloma');
const app = new Paloma();

app.controller('indexCtrl', async (ctx, next, indexService) => {
  ctx.body = await Promise.resolve(`Hello, ${indexService.getName()}`);
});

app.service('indexService', function () {
  this.getName = function () {
    return 'Paloma';
  };
});

app.route({
  method: 'GET',
  path: '/',
  controller: 'indexCtrl'
});

app.listen(3000);
```

More examples see [test](./test) and [paloma-examples](https://github.com/palomajs/paloma-examples).

### API

#### load(dir)

Load all files by [require-directory](https://github.com/troygoode/node-require-directory).

Param     | Type       | Description
:---------|:-----------|:-----------
**dir**   | *String*   | An absolute path or relative path.

#### route(route)

Register a route. `route` use `app.use` internally, so pay attention to the middleware load order.

Param                                 | Type                                 | Description
:-------------------------------------|:-------------------------------------|:-----------
**route**                             | *Object*                             | 
**route.method**                      | *String*                             | HTTP request method, eg: `GET`, `post`.
**route.path**                        | *String*                             | Request path, see [path-to-regexp](https://github.com/pillarjs/path-to-regexp), eg: `/:name`.
**route.controller**                  | *String\|Function\|[String\|Function]*  | Controller functions or names.
**route.validate**<br />*(optional)*  | *Object*                             | Validate Object schemas.

#### controller(name[, fn])

Register or get a controller. If `fn` missing, return a controller by `name`.

Param                       | Type        | Description
:---------------------------|:------------|:-----------
**name**                    | *String*    | Controller name.
**fn**<br />*(optional)*    | *Function*  | Controller handler.
**fn->arguments[0]->ctx**   | *Object*    | Koa's `ctx`.
**fn->arguments[1]->next**  | *Function*  | Koa's `next`.
**fn->arguments[2...]**     | *Object*    | Instances of services.

#### service(name[, fn])

Register a service constructor or get a service instance. If `fn` missing, return a service instance by `name`.

Param      | Type       | Description
:----------|:-----------|:-----------
**name**   | *String*   | The name of the service.  Must be unique to each service instance.
**fn**     | *Function* | A constructor function that will be instantiated as a singleton.

#### factory(name, fn)

Register a service factory.

Param       | Type       | Description
:-----------|:-----------|:--------
**name**    | *String*   | The name of the service.  Must be unique to each service instance.
**fn**      | *Function* | A function that should return the service object. Will only be called once; the Service will be a singleton. Gets passed an instance of the container to allow dependency injection when creating the service.

#### provider(name, fn)

Register a service provider.

Param        | Type       | Details
:------------|:-----------|:--------
**name**     | *String*   | The name of the service. Must be unique to each service instance.
**fn**       | *Function* | A constructor function that will be instantiated as a singleton. Should expose a function called `$get` that will be used as a factory to instantiate the service.

#### constant(name, value)

Register a read only value as a service.

Param     | Type       | Details
:---------|:-----------|:--------
**name**  | *String*   | The name of the constant. Must be unique to each service instance.
**value** | *Mixed*    | A value that will be defined as enumerable, but not writable.

#### value(name, value)

Register an arbitrary value as a service.

Param      | Type     | Details
:----------|:---------|:--------
**name**   | *String* | The name of the value. Must be unique to each service instance.
**value**  | *Mixed*  | A value that will be defined as enumerable, readable and writable.

#### decorator([name, ]fn)

Register a decorator function that the provider will use to modify your services at creation time.

Param                      | Type       | Details
:--------------------------|:-----------|:--------
**name**<br />*(optional)* | *String*   | The name of the service this decorator will affect. Will run for all services if not passed.
**fn**                     | *Function* | A function that will accept the service as the first parameter. Should return the service, or a new object to be used as the service.

#### middlewares([name, ]fn)

Register a middleware function. This function will be executed every time the service is accessed. Distinguish with koa's `middleware`.

Param                      | Type       | Details
:--------------------------|:-----------|:--------
**name**<br />*(optional)* | *String*   | The name of the service for which this middleware will be called. Will run for all services if not passed.
**fn**                     | *Function* | A function that will accept the service as the first parameter, and a `next` function as the second parameter. Should execute `next()` to allow other middleware in the stack to execute. Bottle will throw anything passed to the `next` function, i.e. `next(new Error('error msg'))`.

#### use(fn) &

see [koa](https://github.com/koajs/koa/tree/v2.x).

### License

MIT

[npm-image]: https://img.shields.io/npm/v/paloma.svg?style=flat-square
[npm-url]: https://npmjs.org/package/paloma
[travis-image]: https://img.shields.io/travis/palomajs/paloma.svg?style=flat-square
[travis-url]: https://travis-ci.org/palomajs/paloma
[david-image]: http://img.shields.io/david/palomajs/paloma.svg?style=flat-square
[david-url]: https://david-dm.org/palomajs/paloma
[license-image]: http://img.shields.io/npm/l/paloma.svg?style=flat-square
[license-url]: LICENSE
[downloads-image]: http://img.shields.io/npm/dm/paloma.svg?style=flat-square
[downloads-url]: https://npmjs.org/package/paloma
