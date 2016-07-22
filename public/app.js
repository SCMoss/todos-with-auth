var app = angular.module("TodoApp", ["ngRoute", "TodoApp.Auth"]);

app.config(["$routeProvider", "$locationProvider", function ($routeProvider, $locationProvider) {
    $locationProvider.html5Mode(true);

    $routeProvider
        .when("/", {
            templateUrl: "components/home/home.html"
        })
        .when("/todos", {
            templateUrl: "components/todos/todos.html",
            controller: "TodoController"
        })
        .when("/profile", {
            templateUrl: "components/profile/profile.html",
            controller: "ProfileController"
        });
        // .otherwise({
        //     redirectTo: "/"
        // });
}]);
