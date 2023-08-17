var env = {};
if (window){
    Object.assign(env, window.__env);
}

var app = angular.module("svApp", ['ngCookies']);
app.constant('__env', env);
app.directive('keydownEvents',
    function ($document, $rootScope) {
        return {
            restrict: 'A',
            link: function () {
                $document.bind('keydown', function (e) {
                    $rootScope.$broadcast('keydown', e, String.fromCharCode(e.which));
                });
            }
        }
  });

app.controller("svCtrl", function($scope, $rootScope, $timeout, $http, $window, $cookies) {
	$scope.user = '';
	$scope.image_data = __env.config.image_data;
	$scope.currentImageIdx = 0;
    $scope.currentImage = "";
	$scope.reachedEnd = false;
	$scope.reachedStart = false;
	$scope.load_time;
	$scope.project = __env.config.projectName;
	$scope.user = $cookies.get('user');
	$scope.signedIn = false; // ($scope.user !== undefined); //false;
	$scope.curationQuestion = __env.config.curationQandA.question;
	$scope.curationAnswers = [];
	$scope.additionalCurationItems = __env.config.additionalCuration;
	$scope.additionalCurationResponses = {};
    $scope.config = __env.config;
	$scope.selectedScore = false;

	for (key in __env.config.curationQandA.answers) {
		$scope.curationAnswers.push([key, __env.config.curationQandA.answers[key]]);
	}
	var reportFields = Object.values(__env.config.reportFields);

  $rootScope.$on('keydown', function (evt, obj, key) {
    if (obj['key'] == "ArrowRight") {
      $scope.next();
    }
    else if (obj['key'] == "ArrowLeft") {
      $scope.previous();
    }
    else if ($scope.image_data.length > 0) {
    		var option = '';
    		for (idx in $scope.curationAnswers) {
    			if ($scope.curationAnswers[idx][0] == obj['key']) {
    				$scope.saveScore(obj['key']);
    			}
    		}
    	}
    $scope.$apply();
  });

    // So it does not trigger the events bound to other keyboard
    // shortcuts when typing in the comment box.
	$scope.handleCommentKeydown = function(event) {
	  event.stopPropagation();
	};

	var init = function() {
		// Sign user in and store token
  	$scope.signedIn = true;
  	$cookies.put('user',$scope.user);

    //shuffle images and display first one
    $scope.image_data = $scope.image_data;

    // var storedCurrentImageIdx = $cookies.get('currentImageIdx');
	// $scope.currentImageIdx = storedCurrentImageIdx !== undefined ? parseInt(storedCurrentImageIdx) : 0; //0;
	$scope.currentImageIdx = 0;
    $scope.currentImage = $scope.image_data[$scope.currentImageIdx]["img_location"];
    $scope.load_time = Date.now();
	};

	var resetCurrent = function (change) {
		if ($scope.image_data.length > 0) {
			$scope.currentImageIdx += change;
			$timeout(function() {
				$scope.load_time = Date.now();
			}, 100);
		}
		if ($scope.image_data[$scope.currentImageIdx]['score']) {
			$scope.selectedScore = __env.config.curationQandA.answers[$scope.image_data[$scope.currentImageIdx]['score']];
		}
		else{
			$scope.selectedScore = false;
		}
	};

  $scope.saveScore = function(option, comment){
  	var now = Date.now();
  	$scope.image_data[$scope.currentImageIdx]['score'] = option;
  	$scope.image_data[$scope.currentImageIdx]['comment'] = comment;
    $scope.image_data[$scope.currentImageIdx]['response_time'] = now;
    $scope.image_data[$scope.currentImageIdx]['load_time'] = $scope.load_time;
	$scope.image_data[$scope.currentImageIdx]['user'] = $scope.user;
	$scope.image_data[$scope.currentImageIdx]['project'] = $scope.project;
    var rawBlob = new Blob([JSON.stringify($scope.image_data)], {
      type: 'application/json',
      name: "report"
    });
    $scope.rawReport = (window.URL || window.webkitURL).createObjectURL( rawBlob);
    $scope.comment = "";
    $scope.next();
  };

	$scope.previous = function () {
		$scope.reachedEnd = false;
		$scope.reachedStart = false;

		if ($scope.currentImageIdx -1 >= 0) {
			resetCurrent(-1);
		}
		else {
			$scope.reachedStart = true;
		}
	};

	$scope.next = function () {
		$scope.reachedEnd = false;
		$scope.reachedStart = false;

		if ($scope.image_data.length > $scope.currentImageIdx+1) {
			resetCurrent(1);
		}
		else {
			$scope.reachedEnd = true;
		}
	};

	$scope.beginning = function () {
		resetCurrent(-$scope.currentImageIdx);
		$scope.reachedStart = true;

		if ($scope.currentImageIdx +1 !== $scope.image_data.length) {
			$scope.reachedEnd = false;
		}
	};
	$scope.ending = function () {
			resetCurrent(($scope.image_data.length-1)-$scope.currentImageIdx);
			$scope.reachedEnd = true;

			if ($scope.currentImageIdx !== 0) {
				$scope.reachedStart = false;
			}
	};

	$scope.submit = function() {
		if ($scope.user != '') {
			init();
		}
	};

	$scope.signOut = function() {
			$cookies.remove('user');
			$window.location.reload();
	};
});
app.config(['$compileProvider',
    function ($compileProvider) {
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|tel|file|blob):/);
}]);
