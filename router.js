const debug = require('debug')('paloma-router')
const pathToRegexp = require('path-to-regexp')
const AJS = require('another-json-schema')
const compose = require('koa-compose')

module.exports = function (route) {
  const method = route.method.toUpperCase()
  const path = route.path
  const validate = route.validate

  let controller = Array.isArray(route.controller) ? route.controller : [route.controller]

  controller = controller.map(controllerName => {
    if (typeof controllerName === 'string') {
      return this.controller(controllerName)
    }
    if (typeof controllerName === 'function') {
      return controllerName
    }
    throw new TypeError('`controller` only support function or name of controller.')
  })

  if (validate) {
    controller.unshift(validatorMiddleware(validate, `${method} ${path}`))
  }
  controller = compose(controller)

  return (ctx, next) => {
    ctx.params = {}
    if (!matches(ctx, method)) return next()

    const keys = []
    const re = pathToRegexp(path, keys)
    const m = re.exec(ctx.path)

    /* istanbul ignore else */
    if (m) {
      ctx._matchedRoute = path
      const args = m.slice(1).map(decode)

      keys.forEach((pathRe, index) => {
        ctx.params[pathRe.name] = args[index]
      })
      debug('%s %s matches %s %j', ctx.method, path, ctx.path, args)
      return controller(ctx, next)
    }

    // miss
    return next()
  }
}

/**
 * Decode value.
 */

function decode (val) {
  /* istanbul ignore else */
  if (val) return decodeURIComponent(val)
}

/**
 * Check request method.
 */

function matches (ctx, method) {
  if (ctx.method === method) return true
  if (method === 'GET' && ctx.method === 'HEAD') return true
  return false
}

function validatorMiddleware (schema, path) {
  const compiledSchema = AJS(path, schema)
  return (ctx, next) => {
    const result = compiledSchema.validate(ctx.request, { additionalProperties: true })
    if (result.valid) {
      return next()
    }
    ctx.throw(result.error.status || result.error.statusCode || 400, result.error.originError || result.error)
  }
}
