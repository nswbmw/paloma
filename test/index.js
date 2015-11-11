'use strict';

const Paloma = require('../lib/paloma');
const request = require('supertest');
const assert = require('assert');

describe('Paloma test', function () {
  it('.load()', function () {
    const app = new Paloma();
    try {
      app.load('abc');
    } catch (e) {
      assert.equal(e.code, 'ENOENT');
    }
  });

  it('.controller()', function () {
    const app = new Paloma();
    app.controller('indexCtrl', function (ctx, next) {
      ctx.body = 'This is index page';
    });
    assert(app.controller('indexCtrl'), 'indexCtrl should exist!');
  });

  it('.route()', function () {
    const app = new Paloma();

    app.controller('indexCtrl', function (ctx, next) {
      ctx.body = 'This is index page';
    });

    app.route({
      method: 'GET',
      path: '/',
      controller: 'indexCtrl'
    });

    request(app.callback())
      .get('/')
      .expect(200)
      .end(function (err, res) {
        if (err) throw err;
        assert.equal(res.text, 'This is index page');
      });
  });

  it('.view()', function () {
    const app = new Paloma();

    app.controller('indexCtrl', function (ctx, next) {
      ctx.body = 'This is index page';
    });

    app.view('indexView', '<p><%= body %></p>');

    app.route({
      method: 'GET',
      path: '/',
      controller: 'indexCtrl',
      template: 'indexView'
    });

    request(app.callback())
      .get('/')
      .expect(200)
      .end(function (err, res) {
        if (err) throw err;
        assert.equal(res.type, 'text/html');
        assert.equal(res.text, '<p>This is index page</p>');
      });
  });

  it('.service()', function () {
    const app = new Paloma();
    const authors = ['nswbmw', 'john', 'jack'];
    const posts = {
      nswbmw: 'one',
      john: 'two',
      jack: 'three'
    };

    app.service('Post', function () {
      this.getPostByUser = function (user) {
        return posts[user];
      };
    });

    app.service('User', function (Post) {
      this.getUserById = function (id) {
        return `${authors[id]} - ${Post.getPostByUser(authors[id])}`;
      };
    });

    assert.equal(app.bottle.container.User, app.service('User'));
    assert.equal(app.service('User').getUserById(0), 'nswbmw - one');
    assert.equal(app.service('User').getUserById(1), 'john - two');
    assert.equal(app.service('User').getUserById(2), 'jack - three');
    assert.equal(app.service('User').getUserById(3), 'undefined - undefined');
  });

  it('.factory()', function () {
    const app = new Paloma();

    function UserService(authors) {
      this.getUserById = function (id) {
        return authors[id];
      };
    }
    app.constant('authors', ['nswbmw', 'john', 'jack']);
    app.factory('User', function (container) {
      return new UserService(container.authors);
    });

    assert.equal(app.bottle.container.User, app.service('User'));
    assert.equal(app.service('User').getUserById(0), 'nswbmw');
    assert.equal(app.service('User').getUserById(1), 'john');
    assert.equal(app.service('User').getUserById(2), 'jack');
    assert.equal(app.service('User').getUserById(3), undefined);
  });

  it('.provider()', function () {
    const app = new Paloma();

    function UserService(authors) {
      this.getUserById = function (id) {
        return authors[id];
      };
    }
    app.constant('authors', ['nswbmw', 'john', 'jack']);
    app.provider('User', function () {
      this.$get = function(container) {
       return new UserService(container.authors);
      };
    });

    assert.equal(app.bottle.container.User, app.service('User'));
    assert.equal(app.service('User').getUserById(0), 'nswbmw');
    assert.equal(app.service('User').getUserById(1), 'john');
    assert.equal(app.service('User').getUserById(2), 'jack');
    assert.equal(app.service('User').getUserById(3), undefined);
  });

  it('.constant()', function () {
    const app = new Paloma();
    app.constant('authors', ['nswbmw', 'john', 'jack']);

    assert.deepEqual(app.bottle.container.authors, ['nswbmw', 'john', 'jack']);
    try {
      app.bottle.container.authors = [];
    } catch (e) {
      assert.equal(e.message, "Cannot assign to read only property 'authors' of #<Object>");
    }
  });

  it('.value()', function () {
    const app = new Paloma();
    app.value('authors', ['nswbmw', 'john', 'jack']);
    app.bottle.container.authors = ['a', 'b', 'c'];

    assert.deepEqual(app.bottle.container.authors, ['a', 'b', 'c']);
  });

  it('.decorator()', function () {
    const app = new Paloma();
    const authors = ['nswbmw', 'john', 'jack'];
    var i = 0;

    app.service('User', function () {
      this.getUserById = function (id) {
        return authors[id];
      };
    });

    app.decorator(function (service) {
      ++i;
      service.getIdByUser = function (user) {
        return authors.indexOf(user);
      };
      return service;
    });

    assert.equal(app.bottle.container.User, app.service('User'));

    assert.equal(app.service('User').getUserById(0), 'nswbmw');
    assert.equal(app.service('User').getUserById(1), 'john');
    assert.equal(app.service('User').getUserById(2), 'jack');
    assert.equal(app.service('User').getUserById(3), undefined);

    assert.equal(app.service('User').getIdByUser('nswbmw'), 0);
    assert.equal(app.service('User').getIdByUser('john'), 1);
    assert.equal(app.service('User').getIdByUser('jack'), 2);
    assert.equal(app.service('User').getIdByUser('tom'), -1);

    assert.equal(i, 1);
  });

  it('.middleware()', function () {
    const app = new Paloma();
    const authors = ['nswbmw', 'john', 'jack'];
    var i = 0;

    app.service('User', function () {
      this.getUserById = function (id) {
        return authors[id];
      };
    });

    app.middlewares(function (service) {
      ++i;
      return service;
    });

    assert.equal(app.bottle.container.User, app.service('User'));

    assert.equal(app.service('User').getUserById(0), 'nswbmw');
    assert.equal(app.service('User').getUserById(1), 'john');
    assert.equal(app.service('User').getUserById(2), 'jack');
    assert.equal(app.service('User').getUserById(3), undefined);

    assert.equal(i, 6);
  });
});
