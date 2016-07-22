var app = angular.module("TodoApp.Auth", ["ngStorage"]);

app.config(["$routeProvider", function ($routeProvider) {
    $routeProvider
        .when("/signup", {
            templateUrl: "components/auth/signup/signup.html",
            controller: "SignupController"
        })
        .when("/login", {
            templateUrl: "components/auth/login/login.html",
            controller: "LoginController"
        })
        .when("/logout", {
            controller: "LogoutController",
            template: ""
        })
        .when("/forgot", {
            templateUrl: "components/auth/forgot/forgot.html",
            controller: "ForgotPasswordController"
        })
        .when("/reset/:resetToken", {
            templateUrl: "components/auth/reset/reset.html",
            controller: "PasswordResetController"
        })
}]);

app.service("UserService", ["$http", "$location", "TokenService", function ($http, $location, TokenService) {
    var self = this;
    this.currentUser = {};

    this.signup = function (user) {
        return $http.post("/auth/signup", user);
    };

    this.login = function (user) {
        return $http.post("/auth/login", user).then(function (response) {
            TokenService.setToken(response.data.token);
            self.currentUser = response.data.user;
            return response;
        });
    };

    this.logout = function () {
        TokenService.removeToken();
        $location.path("/");
    };

    this.changePassword = function (newPassword) {
        console.log(newPassword);
        return $http.post("/auth/change-password", {newPassword: newPassword}).then(function (response) {
            toastr.success("Password Changed Successfully!");
            return response.data;
        }, function (response) {
            toastr.error("Problem with the server");
        });
    };

    this.forgotPassword = function (email) {
        console.log("Sending an email to " + email);
        $http.post("/auth/forgot", {email: email}).then(function(response) {
            return response.data;
        })
    };
    
    this.resetForgottenPassword = function(password, resetToken) {
        return $http.post("/auth/reset/" + resetToken, {password: password}).then(function (response) {
            return response.data.message;
        });
    };

    this.isAuthenticated = function () {
        return TokenService.getToken();
    };
}]);

app.service("TokenService", ["$localStorage", function ($localStorage) {

    this.getToken = function () {
        return $localStorage.token;
    };

    this.setToken = function (token) {
        $localStorage.token = token;
    };

    this.removeToken = function () {
        delete $localStorage.token;
    };
}]);

app.factory("AuthInterceptor", ["$location", "$q", "TokenService", function ($location, $q, TokenService) {
    return {
        request: function (config) {
            var token = TokenService.getToken();
            if (token) {
                config.headers = config.headers || {};
                config.headers.Authorization = "Bearer " + token;
            }
            return config;
        },
        responseError: function (response) {
            if (response.status === 401) {
                TokenService.removeToken();
                $location.path("/login");
            }
            return $q.reject(response);
        }
    }
}]);


app.config(["$httpProvider", function ($httpProvider) {
    $httpProvider.interceptors.push("AuthInterceptor");
}]);