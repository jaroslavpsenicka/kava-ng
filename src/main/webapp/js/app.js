
angular.module('kava', ['ui.bootstrap', 'ngRoute', 'ngResource', 'ngCookies', 'pascalprecht.translate', 'prismic.io'])

.config(['$routeProvider', '$controllerProvider', '$translateProvider', 'PrismicProvider',
	function ($routeProvider, $controllerProvider, $translateProvider, PrismicProvider) {
	$routeProvider.when("/", {
		templateUrl: "home.html",
		controller: "HomeCtrl"
	}).when("/b/:id/:slug", {
		templateUrl: "book.html",
		controller: "BookCtrl"
	}).when("/c/:uid", {
		templateUrl: "content.html",
		controller: "ContentCtrl"
	}).when("/t/:lang/:type", {
		templateUrl: "books.html",
		controller: "BookListCtrl"
	}).when("/t/:lang/", {
		templateUrl: "books.html",
		controller: "BookListCtrl"
	}).when("/new", {
		templateUrl: "books.html",
		controller: "NewBookListCtrl"
	}).when("/blog", {
		templateUrl: "blog.html",
		controller: "BlogCtrl"
	}).when("/esperanto", {
		redirectTo: '/t/eo',
		resolve: {
			esperanto: function($translate) {
				$translate.use('eo');
			}
		}
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
        },
        removeAll: function() {
        	cart.items = [];
        	cart.count = 0;
        }
    };
})

.factory('Order', function($resource) {
    return $resource('https://script.google.com/macros/s/AKfycbw96LknIA9mVLAh0lnSXU9ViXhjm4Ea3DTI2oEyS2lTocQqhWDa/exec', {
    	'callback': 'JSON_CALLBACK'
    }, {
        submit: {
            method: 'JSONP',
            callback: 'JSON_CALLBACK',
			headers: {
				'Content-Type': 'application/json'
			}
        }
    });
})

.factory('Newsletter', function($resource) {
    return $resource('https://script.google.com/macros/s/AKfycbz82DcyroSLRWBi0X22GZe9HEXMPEq6CI1GgvThO3tImDtI5qM/exec', {
    	'callback': 'JSON_CALLBACK'
    }, {
        subscribe: {
            method: 'JSONP',
            callback: 'JSON_CALLBACK',
			headers: {
				'Content-Type': 'application/json'
			}
        }
    });
})

.service('BookReader', function() {
	return {
		read: function(value, results, includeNew) {
			var abstract = value.getStructuredText('book.abstract');
			var image = value.getImage('book.image');
			if (includeNew || (!includeNew && value.tags.indexOf("new") == -1)) results.push({
				id: value.id,
				slug: value.slug,
				title: value.getText('book.title'),
				authors: value.getText('book.authors'),
				image: image ? image.views.thumbnail.asHtml() : '',
				abstract: abstract ? abstract.asHtml() : ''
			});
		}
	}
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

.directive('bookList', function() {
	"use strict";
	return {
		restrict: 'E',
		templateUrl: 'comp/book-list.html',
		link: function(scope, element, attrs) {}
	}
})

.directive('categories', function() {
	"use strict";
	return {
		restrict: 'E',
		templateUrl: 'comp/categories.html',
		link: function(scope, element, attrs) {}
	}
})

.directive('blogList', function() {
	"use strict";
	return {
		restrict: 'E',
		templateUrl: 'comp/blog-list.html',
		link: function(scope, element, attrs) {}
	}
})

.directive('search', function(BookReader) {
	"use strict";
	return {
		restrict: 'E',
		replace: false,
		templateUrl: 'comp/search.html',
		controller: function($scope, $routeParams, $window, $translate, Prismic) {
			$scope.search = function(query) {
				$scope.results = [];
				$scope.subtitle = ' - ' + query;
				$scope.nextPage = false;
				$scope.loading = true;
				var type = '[:d = at(document.type, "book")]';
				var tags = '[:d = at(my.book.lang, "' + $translate.use() + '")]';
				var search = '[:d = fulltext(document, "' + query + '")]';
				Prismic.query('[' + type + search + tags + ']', function(search) {
					return search.orderings('[my.book.index desc]');
				}).then(function(response) {
					$scope.nextPage = response.next_page ? response.page + 1 : undefined;
					$scope.loading = false;
					if (response.results_size > 0) {
						angular.forEach(response.results, function(value) {
							BookReader.read(value, $scope.results, true);
						});
					}
				});

				return false;
			}
		}
	}
})

.controller('HeaderCtrl', function ($scope, $translate, $route, Cart) {
	$scope.cart = Cart.cart;
	$scope.useLanguage = function(lang) {
		$translate.use(lang).then(function() {
			$route.reload();
		});
	};
})

.controller('HomeCtrl', function($scope, $routeParams, $window, $translate, $cookies, $uibModal, Prismic, BookReader) {

	var type = '[:d = at(document.type, "slide")]';
	var tags = '[:d = at(document.tags, ["' + $translate.use() + '"])]';
	Prismic.query('[' + type + tags + ']').then(function(response) {
		if (response.results_size > 0) {
			$scope.slides = [];
			angular.forEach(response.results, function(value) {
				$scope.slides.push({
					id: value.id,
					slug: value.slug,
					title: value.getText('slide.title'),
					url: value.getText('slide.url'),
					image: value.getImage('slide.image').url,
					text: value.getText('slide.text')
				});
			});
		}
	});

	$scope.loadPage = function(page) {
		var type = '[:d = at(document.type, "book")]';
		var tags = '[:d = at(my.book.lang, "' + $translate.use() + '")]';
		if (page == 1) $scope.results = [];
		Prismic.query('[' + type + tags + ']', function(search) {
			return search.page(page).orderings('[my.book.index desc]');
		}).then(function(response) {
			$scope.nextPage = response.next_page ? response.page + 1 : undefined;
			if (response.results_size > 0) {
				angular.forEach(response.results, function(value) {
					BookReader.read(value, $scope.results, false);
				});
			}
		});
	};

	$scope.showWelcome = function() {
		$uibModal.open({
			templateUrl: 'comp/welcome.tpl.html',
			controller: function ($scope, $uibModalInstance) {
                $scope.submit = function() {
                    $uibModalInstance.close();
                }
			}
		}).result.then(function(count) {
			$cookies.put('welcome', true);
		});
	};

	$scope.loadPage(1);
//	if (!$cookies.get('welcome')) {
//		$scope.showWelcome();
//	}

})

.controller('ContentCtrl', function($scope, $routeParams, $window, $location, $translate, Prismic) {
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
})

.controller('BookListCtrl', function($scope, $routeParams, $route, $window, $location, $translate, Prismic, BookReader) {

	$scope.loadPage = function(page) {
		var type = '[:d = at(document.type, "book")]';
		var tags = '[:d = at(document.tags, ["' + $routeParams.lang + ($routeParams.type ? '","' + $routeParams.type : '') + '"])]';
		var lang = '[:d = at(my.book.lang, "' + $translate.use() + '")]';
		var key = ($routeParams.type ? $routeParams.type + '-' : '') + $routeParams.lang;
		$translate('subtitle-' + key).then(function(translation) {
			$scope.subtitle = translation;
		});
		if (page == 1) $scope.results = [];
		$scope.loading = true;
		Prismic.query('[' + type + tags + lang + ']', function(search) {
			return search.page(page).orderings('[my.book.index desc]');
		}).then(function(response) {
			$scope.loading = false;
			$scope.nextPage = response.next_page ? response.page + 1 : undefined;
			if (response.results_size > 0) {
				angular.forEach(response.results, function(value) {
					BookReader.read(value, $scope.results, false);
				});
			} else {
				$translate('notfound-' + $translate.use() + '-' + $routeParams.lang).then(function(message) {
					$scope.message = message;
				});
			}
		});
	}

	$scope.fallback = function() {
		$translate.use($routeParams.lang);
		$route.reload();
	}

	$scope.loadPage(1);

})

.controller('NewBookListCtrl', function($scope, $routeParams, $route, $window, $location, $translate, Prismic, BookReader) {

	$scope.loadPage = function(page) {
		var type = '[:d = at(document.type, "book")]';
		var tags = '[:d = at(document.tags, ["new"])]';
		var lang = '[:d = at(my.book.lang, "' + $translate.use() + '")]';
		$translate('subtitle-new').then(function(translation) {
			$scope.subtitle = translation;
		});
		if (page == 1) $scope.results = [];
		$scope.loading = true;
		Prismic.query('[' + type + tags + lang + ']', function(search) {
			return search.page(page).orderings('[my.book.index desc]');
		}).then(function(response) {
			$scope.loading = false;
			$scope.nextPage = response.next_page ? response.page + 1 : undefined;
			if (response.results_size > 0) {
				angular.forEach(response.results, function(value) {
					BookReader.read(value, $scope.results, true);
				});
			} else {
				$translate('notfound-' + $translate.use() + '-' + $routeParams.lang).then(function(message) {
					$scope.message = message;
				});
			}
		});
	}

	$scope.fallback = function() {
		$translate.use($routeParams.lang);
		$route.reload();
	}

	$scope.loadPage(1);

})

.controller('BookCtrl', function($scope, $routeParams, $window, $location, $translate, $uibModal, Prismic, Cart) {

	Prismic.document($routeParams.id).then(function(response) {
		var image = response.getImage('book.image');
		var text = response.getSliceZone('book.text');
		var info = response.getStructuredText('book.info');
		$scope.book = {
			id: response.id,
			slug: response.slug,
			title: response.getText('book.title'),
			authors: response.getText('book.authors'),
			image: image ? image.asHtml() : 'No image.',
			text: text ? text.asHtml({
				linkResolver: function (ctx, doc) {
					var hash = (doc.type == 'book') ? 'b/' + doc.id + '/' + doc.slug : 'c/' + doc.uid;
					return window.location.pathname + '#/' + hash;
				}
			}) : 'No text.',
			info: info ? info.asHtml() : 'No info.',
			priceCZK: response.getText('book.priceCZK'),
			priceEUR: response.getText('book.priceEUR'),
			priceCES: response.getText('book.priceCES'),
			price: $scope.getText(response),
			currency: $translate.use() == 'cz' ? 'Kč' : 'EUR',
			available: response.tags.indexOf('new') == -1
		};
	});

	$scope.getText = function(response) {
		if ($translate.use() != 'cz') {
			var price = response.getText('book.priceEUR');
			return (price && /^\d+\.\d$/.test(price)) ? price + '0' : price;
		}

		return response.getText('book.priceCZK') + ',-';
	}

	$scope.buy = function(book) {
		$uibModal.open({
			templateUrl: 'comp/add-to-cart.tpl.html',
			controller: function ($scope, $uibModalInstance) {
				$scope.count = 1;
                $scope.submit = function() {
                    $uibModalInstance.close($scope.count);
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
})

.controller('BlogCtrl', function($scope, $routeParams, $window, $location, $translate, $uibModal, Prismic, Newsletter) {

	$scope.blogLang = $translate.use();
	$scope.chooseBlogLang = function(lang) {
		$scope.blogLang = lang;
	};

	$scope.loadPage = function(page) {
		var type = '[:d = at(document.type, "article")]';
		var tags = '[:d = at(document.tags, ["' + $translate.use() + '","blog"])]';
		Prismic.query('[' + type + tags + ']', function(search) {
			return search.page(page);
		}).then(function(response) {
			if (response.results_size > 0) {
				$scope.results = [];
				$scope.nextPage = response.next_page ? response.page + 1 : undefined;
				angular.forEach(response.results, function(value) {
					$scope.results.push({
						uid: value.uid,
						title: value.getText('article.title'),
						published: $scope.formatDate(value.getDate('article.published')),
						abstract: value.getStructuredText('article.abstract').asHtml()
					});
				});
			}
		});
	};

	$scope.subscribe = function(email) {
		var options = { email: email, lang: $scope.blogLang };
		Newsletter.subscribe({ options: options }, {}, function() {
			$uibModal.open({
				templateUrl: 'comp/subscribed.tpl.html',
				controller: function ($scope, $uibModalInstance) {
					$scope.email = email;
					$scope.submit = function() {
						$uibModalInstance.close();
					}
				}
			}).result.then(function(result) {
			});
		}, function(error) {
			$scope.handleError(error, items);
		});
	};

	$scope.formatDate = function(date) {
		return date.getDay() + '.' + date.getMonth() + '. ' + date.getFullYear();
	}

	$scope.handleError = function(error, items) {
		$uibModal.open({
			templateUrl: 'comp/subscription-error.tpl.html',
			controller: function ($scope, $uibModalInstance) {
				$scope.error = error;
                $scope.submit = function() {
                    $uibModalInstance.close();
                }
			}
		}).result.then(function(result) {
		});
	};

	$scope.loadPage(0);

})

.controller('CartCtrl', function($scope, $routeParams, $window, $location, $translate, $uibModal, $location, Cart, Order) {

	var chunkSize = 10;

	$scope.items = Cart.cart.items;
	$scope.lang = $translate.use();
	$scope.options = {
		lang: $scope.lang
	};

	$scope.price = function(book) {
		var price = $scope.lang == 'cz' ? $scope.options.ces ? book.priceCES ? book.priceCES : book.priceCZK : book.priceCZK : book.priceEUR;
		return (price * book.count) + ' ' + ($scope.lang == 'cz' ? 'Kč' : 'EUR');
	}

	$scope.remove = function(item) {
		Cart.cart.count -= item.count;
		$scope.items.splice($scope.items.indexOf(item), 1);
	}

	$scope.submit = function(options) {
		$uibModal.open({
			templateUrl: 'comp/submit-cart.tpl.html',
			controller: function ($scope, $uibModalInstance) {
                $scope.submit = function() {
                    $uibModalInstance.close();
                }
			}
		}).result.then(function() {
			var items = [];
			angular.forEach(Cart.cart.items, function(item) {
				items.push({
					count: item.count,
					title: item.title,
					price: $scope.price(item)
				});
			});
			for (var i = 0; i < items.length; i += chunkSize) {
				var chunk = items.slice(i, i + chunkSize);
				Order.submit({items: JSON.stringify(chunk), options: JSON.stringify(options)}, {}, function() {
					Cart.removeAll();
					$location.path('/c/order-' + $translate.use());
				}, function(error) {
					$scope.handleError(error, items);
				});
			}
		});
	}

	$scope.handleError = function(error, items) {
		var options = $scope.options;
		$uibModal.open({
			templateUrl: 'comp/error.tpl.html',
			controller: function ($scope, $uibModalInstance) {
				$scope.error = error;
				$scope.items = items;
				$scope.options = options;
                $scope.submit = function() {
                    $uibModalInstance.close();
                }
			}
		}).result.then(function(result) {
		});
	}
})

.run(function($rootScope, $location, $anchorScroll) {

  $rootScope.$on('$routeChangeSuccess', function(newRoute, oldRoute) {
    if($location.hash()) $anchorScroll();
  });

});


