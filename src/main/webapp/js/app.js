
angular.module('kava', ['ui.bootstrap', 'ngRoute', 'pascalprecht.translate', 'prismic.io'])

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

.filter('trusted', ['$sce', function($sce) {
    return function(text) {
        return $sce.trustAsHtml(text);
    };
}])

.controller('HeaderCtrl', ['$scope', '$translate', function ($scope, $translate) {
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
				// Angular doesn't repeat over collections created on the fly, so we have to create it here
				if (documents.total_pages > 1) $scope.paginationRange = _.range(1, documents.total_pages+1);
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

.controller('BookCtrl', ['$scope', '$routeParams', '$window', '$location', '$translate', 'Prismic',
	function($scope, $routeParams, $window, $location, $translate, Prismic) {
	Prismic.document($routeParams.id).then(function(response) {
		$scope.title = response.getText('book.title');
		$scope.image = response.getImage('book.image').asHtml();
		$scope.text = response.getSliceZone('book.text').asHtml();
	});
}]);

