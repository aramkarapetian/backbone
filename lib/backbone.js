var Backbone = require('backbone');
var _ = require('underscore');
var when = require('when');

var methodMap = {
	'create': 'POST',
	'update': 'PUT',
	'patch':  'PATCH',
	'delete': 'DELETE',
	'read':   'GET'
};

Backbone.sync = function(method, model, options) {
	// console.log(method, model, options);
	
	var _model = function(object) {
		if (object instanceof Backbone.Collection) {
			return object.model.prototype;
		}

		return object;
	};

	if (! options.url) {
      	options.url = _.result(_model(model), 'url');

      	if (!options.url) {
      		 throw new Error('Url is not provided');
      	}
    }

    var MongoClient = require('mongodb').MongoClient
    	, format = require('util').format
    	, ObjectID = require('mongodb').ObjectID;
	
	var connectionString = 'mongodb://127.0.0.1:27017/trainer';
	return when.promise(
		function(resolve, reject, notify) {
			MongoClient.connect(
				connectionString,
				function(err, db) {
					if(err) throw err;

					var collection = db.collection(options.url);

					switch (method) {
						case 'create':
							resolve(
								when.promise(
									function(resolve, reject, notify) {
										collection.insert(
											model.toJSON(options),
											function(err, docs) {
												if (err) {
													console.log(err);
													reject(err);
												}

												db.close();

												var idAttribute = _model(model).idAttribute;
												_.each(docs, function(doc) {
													doc[idAttribute] = doc._id.toString();
												});

												if (model instanceof Backbone.Collection) {
													options.success(docs);
												}
												else {
													options.success(docs.pop());
												}

												resolve(docs);
											}
										);
									}
								)
							);
						break;
						case 'update':
							resolve(
								when.promise(
									function(resolve, reject, notify) {
										var idAttribute = _model(model).idAttribute;
										collection.update(
											{_id: model.get(idAttribute)},
											model.toJSON(options),
											function(err, docs) {
												if (err) {
													console.log(err);
													reject(err);
												}

												db.close();

												options.success(docs);
												resolve(docs);
											}
										);
									}
								)
							);
						break;
						case 'delete':
							resolve(when.promise(function(resolve, reject, notify) {
								var filter = {_id: null};
								var idAttribute = _model(model).idAttribute;
								if (model instanceof Backbone.Collection) {
									model.each(function (item) {
										filter._id.push(item.get(idAttribute));
									});
								} else {
									filter._id = model.get(idAttribute);
								}
								
								collection.remove(filter, function(err, docs) {
									if (err) {
										options.error(err);
										reject(err);
									}
									
									db.close();

									options.success(docs);
									
									resolve(docs);
								});
							}));
						break;
						case 'read':
							resolve(when.promise(function(resolve, reject, notify) {
								collection.find(options.data || {}).toArray(function(err, docs) {
									if (err) {
										options.error(err);
										reject(err);
									}
									
									db.close();

									var idAttribute = _model(model).idAttribute;
									_.each(docs, function(doc) {
										doc[idAttribute] = doc._id.toString();
									});

									if (model instanceof Backbone.Collection) {
										options.success(docs);
									}
									else {
										options.success(docs.pop());
									}

									resolve(docs);
								});
							}));
						break;
					}
				}
			);
		}
	);
}

module.exports = Backbone;