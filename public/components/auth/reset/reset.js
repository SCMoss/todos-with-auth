var app = angular.module("TodoApp.Auth");

app.controller("PasswordResetController", ["$scope", "$location", "$routeParams", "UserService", function ($scope, $location, $routeParams, UserService) {
    $scope.resetForgottenPassword = function(password, passwordRepeat) {
        if (password === passwordRepeat) {
            UserService.resetForgottenPassword(password, $routeParams.resetToken).then(function(message) {
                alert(message);
                $location.path("/login");
            });
        }
    };
}]);