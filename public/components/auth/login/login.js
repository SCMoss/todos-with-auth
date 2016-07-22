var app = angular.module("TodoApp.Auth");

app.controller("LoginController", ["$scope", "$location", "UserService", function ($scope, $location, UserService) {
    $scope.login = function (user) {
        UserService.login(user).then(function(response) {
            $location.path("/todos");
        }, function(response) {
            toastr.error(response.data.message);
        });
    };
}]);