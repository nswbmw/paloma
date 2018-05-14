const Paloma = require('../paloma')
const request = require('supertest')
const assert = require('assert')
const path = require('path')

describe('Paloma', function () {
  it('.load()', function () {
    const app = global.app = new Paloma()
    try {
      app.load('abc')
    } catch (e) {
      assert.equal(e.code, 'ENOENT')
    }

    app.load(path.join(__dirname, 'controllers'))
    assert(app.controller('indexCtrl'), 'indexCtrl should exist!')

    delete global.app
  })

  it('.controller()', function () {
    const app = new Paloma()
    app.controller('indexCtrl', function (ctx, next) {
      ctx.body = 'This is index page'
    })
    assert(app.controller('indexCtrl'), 'indexCtrl should exist!')
  })

  describe('.route()', function () {
    it('wrong controller type', function () {
      const app = new Paloma()
      let error

      try {
        app.route({
          method: 'GET',
          path: '/',
          controller: [1]
        })
      } catch (e) {
        error = e
      }
      assert(error.message === '`controller` only support function or name of controller.')
    })

    it('controller string', function () {
      const app = new Paloma()

      app.controller('indexCtrl', function (ctx, next) {
        ctx.body = 'This is index page'
      })

      app.route({
        method: 'GET',
        path: '/',
        controller: 'indexCtrl'
      })

      return request(app.callback())
        .get('/')
        .expect(200)
        .then((res) => {
          assert.equal(res.text, 'This is index page')
        })
    })

    it('controller function', function () {
      const app = new Paloma()

      app.service('User', function () {
        this.getUsers = () => ['tom', 'xp']
      })

      app.route({
        method: 'GET',
        path: '/users',
        controller: function (ctx, next, User) {
          ctx.body = User.getUsers()
        }
      })

      return request(app.callback())
        .get('/users')
        .expect(200)
        .then((res) => {
          assert.deepEqual(res.body, ['tom', 'xp'])
        })
    })

    it('controller array', function () {
      const app = new Paloma()

      app.controller('indexCtrl', function (ctx, next) {
        ctx.body = 'This is index page'
        return next()
      })

      app.route({
        method: 'GET',
        path: '/',
        controller: [
          'indexCtrl',
          function (ctx, next) {
            ctx.body += '!!!'
          }
        ]
      })

      return request(app.callback())
        .get('/')
        .expect(200)
        .then((res) => {
          assert.equal(res.text, 'This is index page!!!')
        })
    })

    it('controller not exist', function () {
      const app = new Paloma()
      let error

      try {
        app.route({
          method: 'GET',
          path: '/',
          controller: 'indexCtrl'
        })
      } catch (e) {
        error = e
      }
      assert(error.message === 'controller indexCtrl is not defined')
    })

    it('params', function () {
      const app = new Paloma()

      app.controller('userCtrl', function (ctx, next) {
        ctx.body = `This is ${ctx.params.user} page`
      })

      app.route({
        method: 'GET',
        path: '/users/:user',
        controller: 'userCtrl'
      })

      return request(app.callback())
        .get('/users/nswbmw')
        .expect(200)
        .then((res) => {
          assert.equal(res.text, 'This is nswbmw page')
        })
    })

    it('validate', function () {
      const app = new Paloma()
      const bodyparser = require('koa-bodyparser')

      app.use(bodyparser())
      app.controller('indexCtrl', function (ctx, next) {
        ctx.body = ctx.request.body
      })

      app.route({
        method: 'post',
        path: '/',
        controller: 'indexCtrl',
        validate: {
          body: {
            user: { type: 'string', required: true },
            age: { type: 'number' }
          }
        }
      })

      return request(app.callback())
        .post('/')
        .expect(400)
        .then((res) => {
          assert.equal(res.text, '($.body.user: undefined) ✖ (required: true)')
        })
        .then(() => {
          return request(app.callback())
            .post('/')
            .send({ user: 'nswbmw', age: 18 })
            .expect(200)
            .then((res) => {
              assert.deepEqual(res.body, { user: 'nswbmw', age: 18 })
            })
        })
        .then(() => {
          return request(app.callback())
            .post('/')
            .send({ user: 'nswbmw', age: '18' })
            .expect(400)
            .then((res) => {
              assert.equal(res.text, '($.body.age: "18") ✖ (type: number)')
            })
        })
    })

    it('validate with customize error', function () {
      const app = new Paloma()
      const bodyparser = require('koa-bodyparser')

      app.use(bodyparser())
      app.controller('indexCtrl', function (ctx, next) {
        ctx.body = ctx.request.body
      })

      const email = (actual, key, parent) => {
        if (/\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*/.test(actual)) {
          return true
        }
        throw new Error('E-mail format is incorrect!')
      }

      app.route({
        method: 'post',
        path: '/',
        controller: 'indexCtrl',
        validate: {
          body: {
            email: { type: email }
          }
        }
      })

      return request(app.callback())
        .post('/')
        .send({ email: '123' })
        .expect(400)
        .then((res) => {
          assert.equal(res.text, 'E-mail format is incorrect!')
        })
        .then(() => {
          return request(app.callback())
            .post('/')
            .send({ email: '123@aa.bb' })
            .expect(200)
            .then((res) => {
              assert.deepEqual(res.body, { email: '123@aa.bb' })
            })
        })
    })

    it('404', function () {
      const app = new Paloma()

      app.route({
        method: 'GET',
        path: '/',
        controller: function (ctx, next) {
          ctx.body = 'This is index page'
        }
      })

      return request(app.callback())
        .post('/')
        .expect(404)
        .then((res) => {
          assert.equal(res.text, 'Not Found')
        })
        .then(() => {
          return request(app.callback())
            .get('/users')
            .expect(404)
            .then((res) => {
              assert.equal(res.text, 'Not Found')
            })
        })
    })

    it('HEAD', function () {
      const app = new Paloma()

      app.route({
        method: 'get',
        path: '/',
        controller: function (ctx, next) {
          ctx.body = 'This is index page'
        }
      })

      return request(app.callback())
        .head('/')
        .expect(200)
        .then((res) => {
          assert.equal(res.text, undefined)
        })
    })
  })

  describe('.service()', function () {
    it('normal', function () {
      const app = new Paloma()
      const authors = ['nswbmw', 'john', 'jack']
      const posts = {
        nswbmw: 'one',
        john: 'two',
        jack: 'three'
      }

      app.service('Post', function () {
        this.getPostByUser = function (user) {
          return posts[user]
        }
      })

      app.service('User', function (Post) {
        this.getUserById = function (id) {
          return `${authors[id]} - ${Post.getPostByUser(authors[id])}`
        }
      })

      assert.equal(app._bottle.container.User, app.service('User'))
      assert.equal(app.service('User').getUserById(0), 'nswbmw - one')
      assert.equal(app.service('User').getUserById(1), 'john - two')
      assert.equal(app.service('User').getUserById(2), 'jack - three')
      assert.equal(app.service('User').getUserById(3), 'undefined - undefined')
    })

    it('http', function () {
      const app = new Paloma()
      const authors = ['nswbmw', 'john', 'jack']

      app.service('User', function () {
        this.getUserById = function (id) {
          return authors[id]
        }
      })

      app.controller('indexCtrl', function (ctx, next, User) {
        const id = +ctx.query.id
        ctx.body = User.getUserById(id)
      })

      app.route({
        method: 'get',
        path: '/',
        controller: 'indexCtrl'
      })

      return request(app.callback())
        .get('/')
        .query({ id: 0 })
        .expect(200)
        .then((res) => {
          assert(res.text === 'nswbmw')
        })
    })

    it('service not exist', function () {
      const app = new Paloma()
      let error

      try {
        app.service('User')
      } catch (e) {
        error = e
      }

      assert(error.message === 'service User is not defined')
    })
  })

  it('.factory()', function () {
    const app = new Paloma()

    function UserService (authors) {
      this.getUserById = function (id) {
        return authors[id]
      }
    }
    app.constant('authors', ['nswbmw', 'john', 'jack'])
    app.factory('User', function (container) {
      return new UserService(container.authors)
    })

    assert.equal(app._bottle.container.User, app.service('User'))
    assert.equal(app.service('User').getUserById(0), 'nswbmw')
    assert.equal(app.service('User').getUserById(1), 'john')
    assert.equal(app.service('User').getUserById(2), 'jack')
    assert.equal(app.service('User').getUserById(3), undefined)
  })

  it('.provider()', function () {
    const app = new Paloma()

    function UserService (authors) {
      this.getUserById = function (id) {
        return authors[id]
      }
    }
    app.constant('authors', ['nswbmw', 'john', 'jack'])
    app.provider('User', function () {
      this.$get = function (container) {
        return new UserService(container.authors)
      }
    })

    assert.equal(app._bottle.container.User, app.service('User'))
    assert.equal(app.service('User').getUserById(0), 'nswbmw')
    assert.equal(app.service('User').getUserById(1), 'john')
    assert.equal(app.service('User').getUserById(2), 'jack')
    assert.equal(app.service('User').getUserById(3), undefined)
  })

  it('.constant()', function () {
    const app = new Paloma()
    app.constant('authors', ['nswbmw', 'john', 'jack'])

    assert.deepEqual(app._bottle.container.authors, ['nswbmw', 'john', 'jack'])
    try {
      app._bottle.container.authors = []
    } catch (e) {
      assert(e.message.match("Cannot assign to read only property 'authors' of"))
    }
  })

  it('.value()', function () {
    const app = new Paloma()
    app.value('authors', ['nswbmw', 'john', 'jack'])
    app._bottle.container.authors = ['a', 'b', 'c']

    assert.deepEqual(app._bottle.container.authors, ['a', 'b', 'c'])
  })

  it('.decorator()', function () {
    const app = new Paloma()
    const authors = ['nswbmw', 'john', 'jack']
    var i = 0

    app.service('User', function () {
      this.getUserById = function (id) {
        return authors[id]
      }
    })

    app.decorator(function (service) {
      ++i
      service.getIdByUser = function (user) {
        return authors.indexOf(user)
      }
      return service
    })

    assert.equal(app._bottle.container.User, app.service('User'))

    assert.equal(app.service('User').getUserById(0), 'nswbmw')
    assert.equal(app.service('User').getUserById(1), 'john')
    assert.equal(app.service('User').getUserById(2), 'jack')
    assert.equal(app.service('User').getUserById(3), undefined)

    assert.equal(app.service('User').getIdByUser('nswbmw'), 0)
    assert.equal(app.service('User').getIdByUser('john'), 1)
    assert.equal(app.service('User').getIdByUser('jack'), 2)
    assert.equal(app.service('User').getIdByUser('tom'), -1)

    assert.equal(i, 1)
  })

  it('.middleware()', function () {
    const app = new Paloma()
    const authors = ['nswbmw', 'john', 'jack']
    var i = 0

    app.service('User', function () {
      this.getUserById = function (id) {
        return authors[id]
      }
    })

    app.middlewares(function (service) {
      ++i
      return service
    })

    assert.equal(app._bottle.container.User, app.service('User'))

    assert.equal(app.service('User').getUserById(0), 'nswbmw')
    assert.equal(app.service('User').getUserById(1), 'john')
    assert.equal(app.service('User').getUserById(2), 'jack')
    assert.equal(app.service('User').getUserById(3), undefined)

    assert.equal(i, 6)
  })

  it('.Types', function () {
    const app = new Paloma()
    assert.ok(typeof app.Types === 'object')
  })
})
