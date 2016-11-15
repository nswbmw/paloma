'use strict';

const assert = require('assert');
const path = require('path');

const Bottle = require('bottlejs');
const fnArgs = require('fn-args');
const Koa = require('koa');
const router = require('paloma-router');
const requireDirectory = require('require-directory');

module.exports = class Paloma extends Koa {
  constructor() {
    super();

    this._bottle = new Bottle();
    this._controllers = Object.create(null);
  }

  load(dir) {
    if (path.isAbsolute(dir)) {
      requireDirectory(module, dir);
    } else {
      requireDirectory(module, path.join(path.dirname(module.parent.filename), dir));
    }
    return this;
  }

  route(route) {
    assert('object' === typeof route, '`route` must be a object');
    assert('string' === typeof route.method, '`method` must be a string, like: \'GET\'');
    assert('string' === typeof route.path, '`path` must be a string, like: \'/users/:name\'');
    assert('string' === typeof route.controller || Array.isArray(route.controller), '`controller` must be a string or array');

    this.use(router.call(this, route));
    return this;
  }

  controller(name, fn) {
    assert('string' === typeof name, 'controller name must be string.');

    if (!fn) {
      if (!this._controllers[name]) {
        throw new TypeError('controller ' + name + ' is not defined');
      }
      return this._controllers[name];
    }
    const _args = fnArgs(fn).slice(2);

    this._controllers[name] = (ctx, next) => {
      return fn.apply(null, [ctx, next].concat(_args.map(arg => this._bottle.container[arg])));
    };
    return this;
  }

  service(name, fn) {
    assert('string' === typeof name, 'service name must be string.');

    if (!fn) {
      const _service = this._bottle.container[name];
      if (!_service) {
        throw new TypeError('service ' + name + ' is not defined');
      }
      return _service;
    }
    const _args = fnArgs(fn);
    this._bottle.service.apply(this._bottle, [name, fn].concat(_args));
    return this;
  }

  factory() {
    this._bottle.factory.apply(this._bottle, arguments);
    return this;
  }

  provider() {
    this._bottle.provider.apply(this._bottle, arguments);
    return this;
  }

  constant() {
    this._bottle.constant.apply(this._bottle, arguments);
    return this;
  }

  value() {
    this._bottle.value.apply(this._bottle, arguments);
    return this;
  }

  decorator() {
    this._bottle.decorator.apply(this._bottle, arguments);
    return this;
  }

  middlewares() {
    this._bottle.middleware.apply(this._bottle, arguments);
    return this;
  }
};
