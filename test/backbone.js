var Backbone = require('../lib/backbone');
var when = require('when');
var assert = require('assert');

// test model
var TestModel = Backbone.Model.extend({
	url: 'tests',
    idAttribute: "_id"
});
var test = new TestModel({asd: 'qwe'});

test.save()
	.then(function() {
		assert(test.get('_id'));
		var then = false;
		test.save({ddd: 'zuiziu'})
			.then(function() {
				then = true;
			})
			.catch(function() {
				assert(false, 'This should not have happened');
			})
			.done(function() {
				assert(then, 'This should not have happened');

				test.destroy();
			});
	});

// test collection
var TestCollection = Backbone.Collection.extend({
	model: TestModel
});

var tests = new TestCollection();
var then = false;
tests.fetch()
.then(function() {
	then = true;
	assert(tests.length);
})
.done(function() {
	assert(then, 'This should not have happened');
	tests.each(function (item) {
		// console.log(item.toJSON());
	});
});

var zuiziu = new TestModel({ddd: 'zuiziu'});
var then = false;
zuiziu.save()
.then(function() {
	return tests.fetch({data: {ddd: 'zuiziu'}});
})
.then(function() {
	then = true;
	assert(tests.length);

	tests.each(function(item) {
		assert.equal(item.get('ddd'), 'zuiziu');
	});
})
.done(function() {
	assert(then, 'This should not have happened');
});

tests.fetch().then(function() {
	console.log(tests.length);
	tests.each(function(model) {
		model.destroy();
	});
});