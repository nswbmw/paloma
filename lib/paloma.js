'use strict';

const requireDirectory = require('require-directory');
const Bottle = require('bottlejs');
const router = require('paloma-router');
const fnArgs = require('fn-args');
const assert = require('assert');
const path = require('path');
const Koa = require('koa');

module.exports = class Paloma extends Koa {
  constructor() {
    super();

    this.bottle = new Bottle();
    this._controllers = {};
    this._views = {};
  }

  setEngine(engineName) {
    if (engineName) {
      this.engine = engineName;
    }
    return this;
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
    route.engine = route.engine || this.engine || undefined;
    this.use(router.call(this, route));
    return this;
  }

  view(name, template) {
    assert('string' === typeof name, 'view name must be string.');

    if (!template) {
      if (!this._views[name]) {
        throw new Error('view ' + name + ' is not defined');
      }
      return this._views[name];
    }
    this._views[name] = template;
    return this;
  }

  controller(name, fn) {
    assert('string' === typeof name, 'controller name must be string.');

    if (!fn) {
      if (!this._controllers[name]) {
        throw new Error('controller ' + name + ' is not defined');
      }
      return this._controllers[name];
    }
    const _args = fnArgs(fn).slice(2);
    this._controllers[name] = (ctx, next) => {
      fn.apply(null, [ctx, next].concat(_args.map((arg) => this.bottle.container[arg])));
    };
    return this;
  }

  service(name, fn) {
    assert('string' === typeof name, 'service name must be string.');

    if (!fn) {
      const _service = this.bottle.container[name];
      if (!_service) {
        throw new Error('service ' + name + ' is not defined');
      }
      return _service;
    }
    const _args = fnArgs(fn);
    this.bottle.service.apply(this.bottle, [name, fn].concat(_args));
    return this;
  }

  factory() {
    this.bottle.factory.apply(this.bottle, arguments);
    return this;
  }

  provider() {
    this.bottle.provider.apply(this.bottle, arguments);
    return this;
  }

  constant() {
    this.bottle.constant.apply(this.bottle, arguments);
    return this;
  }

  value() {
    this.bottle.value.apply(this.bottle, arguments);
    return this;
  }

  decorator() {
    this.bottle.decorator.apply(this.bottle, arguments);
    return this;
  }

  middlewares() {
    this.bottle.middleware.apply(this.bottle, arguments);
    return this;
  }
};
