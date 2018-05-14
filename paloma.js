const assert = require('assert')
const path = require('path')

const Bottle = require('bottlejs')
const fnArgs = require('fn-args')
const Koa = require('koa')
const requireDirectory = require('require-directory')
const AJS = require('another-json-schema')

const router = require('./router')

module.exports = class Paloma extends Koa {
  constructor () {
    super()

    this._bottle = new Bottle()
    this._controllers = Object.create(null)
  }

  load (dir) {
    if (path.isAbsolute(dir)) {
      requireDirectory(module, dir)
    } else {
      requireDirectory(module, path.join(path.dirname(module.parent.filename), dir))
    }
    return this
  }

  route (route) {
    assert(typeof route === 'object', '`route` must be a object')
    assert(typeof route.method === 'string', '`method` must be a string, like: \'GET\'')
    assert(typeof route.path === 'string', '`path` must be a string, like: \'/users/:name\'')
    assert(typeof route.controller === 'string' || typeof route.controller === 'function' || Array.isArray(route.controller), '`controller` must be a string or function or array')

    this.use(router.call(this, route))
    return this
  }

  controller (name, fn) {
    assert(typeof name === 'string', 'controller name must be string.')

    if (!fn) {
      if (!this._controllers[name]) {
        throw new TypeError('controller ' + name + ' is not defined')
      }
      return this._controllers[name]
    }
    const _args = fnArgs(fn).slice(2)

    this._controllers[name] = (ctx, next) => {
      return fn.apply(null, [ctx, next].concat(_args.map(arg => this._bottle.container[arg])))
    }
    return this
  }

  service (name, fn) {
    assert(typeof name === 'string', 'service name must be string.')

    if (!fn) {
      const _service = this._bottle.container[name]
      if (!_service) {
        throw new TypeError('service ' + name + ' is not defined')
      }
      return _service
    }
    const _args = fnArgs(fn)
    this._bottle.service.apply(this._bottle, [name, fn].concat(_args))
    return this
  }

  factory () {
    this._bottle.factory.apply(this._bottle, arguments)
    return this
  }

  provider () {
    this._bottle.provider.apply(this._bottle, arguments)
    return this
  }

  constant () {
    this._bottle.constant.apply(this._bottle, arguments)
    return this
  }

  value () {
    this._bottle.value.apply(this._bottle, arguments)
    return this
  }

  decorator () {
    this._bottle.decorator.apply(this._bottle, arguments)
    return this
  }

  middlewares () {
    this._bottle.middleware.apply(this._bottle, arguments)
    return this
  }
}

module.exports.Types = AJS.Types
