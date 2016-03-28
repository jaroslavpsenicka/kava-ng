
angular.module('kava', ['ui.bootstrap', 'ngRoute', 'ngResource', 'pascalprecht.translate', 'prismic.io'])

.config(['$routeProvider', '$controllerProvider', '$translateProvider', 'PrismicProvider',
	function ($routeProvider, $controllerProvider, $translateProvider, PrismicProvider) {
	$routeProvider.when("/", {
		templateUrl: "/home.html",
		controller: "HomeCtrl"
	}).when("/b/:id/:slug", {
		templateUrl: "book.html",
		controller: "BookCtrl"
	}).when("/c/:uid", {
		templateUrl: "content.html",
		controller: "ContentCtrl"
	}).when("/t/:lang/:type", {
		templateUrl: "book-list.html",
		controller: "BookListCtrl"
	}).when("/cart", {
		templateUrl: "cart.html",
		controller: "CartCtrl"
	}).when("/404", {
		templateUrl: "404.html",
		controller: "PageCtrl"
	}).otherwise({
	   redirectTo: '/404'
	});;

  	$translateProvider.useLoader('messagesLoader', {});
	$translateProvider.preferredLanguage('cz');
	$translateProvider.useSanitizeValueStrategy(null);

	PrismicProvider.setApiEndpoint('https://kava.prismic.io/api');
	PrismicProvider.setAccessToken('');
	PrismicProvider.setClientId('');
	PrismicProvider.setClientSecret('');
	PrismicProvider.setLinkResolver(function(ctx, doc) {
		return '#/c/' + doc.id + '/' + doc.slug + ctx.maybeRefParam;
	});

}])

.factory('messagesLoader', function ($http, $q) {
    return function(options) {
		var deferred = $q.defer();
		$http({
			method:'GET',
			url: 'messages-' + options.key + '.json'
		}).success(function (data) {
			deferred.resolve(data);
		}).error(function () {
			deferred.reject(options.key);
		});

    	return deferred.promise;
    }
})

.factory('Cart', function($filter) {

	var cart = {
		count: 0,
		items: []
	};

    return {
    	cart: cart,
        add: function(item) {
        	var i = $filter('getById')(cart.items, item.id);
        	if (i) i.count++;
        	else cart.items.push(item);
        	cart.count = cart.count + item.count;
        }
    };
})

.factory('Order', function($resource) {
    return $resource('', {}, {
        submit: {
            method: 'JSONP',
            callback: 'JSON_CALLBACK',
            url: 'https://script.google.com/macros/s/AKfycbwsvEtKuVb6_u5SQgYv3YoHu5Ly05LzMgCVrrtVL_AZ/dev?callback=JSON_CALLBACK',
			headers: {
				'Content-Type': 'application/json'
			}
        }
    });
})

.filter('trusted', ['$sce', function($sce) {
    return function(text) {
        return $sce.trustAsHtml(text);
    };
}])

.filter('getById', function() {
	return function(input, id) {
    	var i=0, len=input.length;
    	for (; i<len; i++) {
      		if (input[i].id == id) {
        		return input[i];
      		}
    	}

    	return null;
  	}
})

.controller('HeaderCtrl', ['$scope', '$translate', 'Cart', function ($scope, $translate, Cart) {
	$scope.cart = Cart.cart;
	$scope.useLanguage = function(lang) {
		$translate.use(lang);
	};
}])

.controller('HomeCtrl', ['$scope', '$routeParams', '$window', 'Prismic', function($scope, $routeParams, $window, Prismic) {
	var page = parseInt($routeParams.page) || "1";
	Prismic.ctx().then(function(ctx){
		ctx.api.form('everything').page(page).ref(ctx.ref).submit(function(err, documents) {
			if (err) {
				$location.path('/');
			} else {
				$scope.documents = documents;
			}
		});
	});
}])

.controller('ContentCtrl', ['$scope', '$routeParams', '$window', '$location', '$translate', 'Prismic',
	function($scope, $routeParams, $window, $location, $translate, Prismic) {
	var key = $routeParams.uid + '-' + $translate.use();
	Prismic.query('[[:d = at(my.article.uid, "' + key + '")]]').then(function(response) {
		if (response.results_size > 0) {
        	$scope.title = response.results[0].getText('article.title');
        	$scope.content = response.results[0].getSliceZone('article.text').asHtml();
		} else {
			Prismic.query('[[:d = at(my.article.uid, "' + $routeParams.uid + '")]]').then(function(response) {
				if (response.results_size > 0) {
					$scope.title = response.results[0].getText('article.title');
					$scope.content = response.results[0].getSliceZone('article.text').asHtml();
				} else {
					$location.path('/404');
				}
			});
		}
	});
}])

.controller('BookListCtrl', ['$scope', '$routeParams', '$window', '$location', '$translate', 'Prismic',
	function($scope, $routeParams, $window, $location, $translate, Prismic) {

	var type = '[:d = at(document.type, "book")]';
	var tags = '[:d = at(document.tags, ["' + $routeParams.lang + '","' + $routeParams.type + '"])]';
	Prismic.query('[' + type + tags + ']').then(function(response) {
		if (response.results_size > 0) {
			$scope.results = [];
			angular.forEach(response.results, function(value) {
				$scope.results.push({
					id: value.id,
					slug: value.slug,
					title: value.getText('book.title'),
					image: value.getImage('book.image').views.thumbnail.asHtml(),
					abstract: value.getStructuredText('book.abstract').asHtml()
				});
			});
		}
	});
}])

.controller('BookCtrl', ['$scope', '$routeParams', '$window', '$location', '$translate', '$modal', 'Prismic', 'Cart',
	function($scope, $routeParams, $window, $location, $translate, $modal, Prismic, Cart) {

	Prismic.document($routeParams.id).then(function(response) {
		$scope.book = {
			id: response.id,
			slug: response.slug,
			title: response.getText('book.title'),
			image: response.getImage('book.image') ? response.getImage('book.image').asHtml() : 'No image.',
			text: response.getSliceZone('book.text') ? response.getSliceZone('book.text').asHtml() : 'No text.',
			info: response.getStructuredText('book.info') ? response.getStructuredText('book.info').asHtml() : 'No info.',
			priceCZK: response.getText('book.priceCZK'),
			priceEUR: response.getText('book.priceEUR'),
			priceCES: response.getText('book.priceCES'),
			price: response.getText($translate.use() == 'cz' ? 'book.priceCZK': 'book.priceEUR'),
			currency: $translate.use() == 'cz' ? 'Kč' : 'EUR'
		};
	});

	$scope.buy = function(book) {
		$modal.open({
			templateUrl: 'add-to-cart.tpl.html',
			controller: function ($scope, $modalInstance) {
				$scope.count = 1;
                $scope.submit = function () {
                    $modalInstance.close($scope.count);
                }
			}
		}).result.then(function(count) {
			Cart.add({
				id: book.id,
				slug: book.slug,
				title: book.title,
				priceCZK: book.priceCZK,
				priceEUR: book.priceEUR,
				priceCES: book.priceCES,
				currency: book.currency,
				count: count
			});
		});
	}

}])

.controller('CartCtrl', ['$scope', '$routeParams', '$window', '$location', '$translate', '$modal', 'Cart', 'Order',
	function($scope, $routeParams, $window, $location, $translate, $modal, Cart, Order) {

	$scope.items = Cart.cart.items;
	$scope.lang = $translate.use();
	$scope.options = {};

	$scope.price = function(book) {
		var price = $scope.lang == 'cz' ? book.priceCZK : book.priceEUR;
		return (price * book.count) + ' ' + ($scope.lang == 'cz' ? 'Kč' : 'EUR');
	}

	$scope.remove = function(item) {
		Cart.cart.count -= item.count;
		$scope.items.splice($scope.items.indexOf(item), 1);
	}

	$scope.submit = function(options) {
		$modal.open({
			templateUrl: 'submit-cart.tpl.html',
			controller: function ($scope, $modalInstance) {
                $scope.submit = function () {
                    $modalInstance.close();
                }
			}
		}).result.then(function() {
			var items = [];
			angular.forEach(Cart.cart.items, function(item) {
				items.push({
					count: item.count,
					title: item.title,
					price: $translate.use() == 'cz' ? item.priceCZK + ' Kč' : item.priceEUR + ' EUR'
				});
			});
			Order.submit({items: JSON.stringify(items), options: options}, {}, function(response) {
				alert(response);
			});
		});
	}

}]);


