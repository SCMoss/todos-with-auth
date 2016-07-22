var express = require("express");
var authRouter = express.Router();
var User = require("../models/user");
var jwt = require("jsonwebtoken");
var config = require("../config");
var async = require("async");
var crypto = require("crypto");
var bcrypt = require("bcrypt");

authRouter.post("/login", function (req, res) {
    User.findOne({username: req.body.username}, function (err, user) {
        if (err) res.status(500).send(err);
        if (!user) {
            res.status(401).send({success: false, message: "User with the provided username was not found"});
        } else {
            user.checkPassword(req.body.password, function (err, match) {
                if (err) {
                    res.status(500).send(err);
                } else if (!match) {
                    res.status(401).send({success: false, message: "Incorrect password"});
                } else {
                    var token = jwt.sign(user.toObject(), config.secret);
                    res.send({success: true, token: token, user: user.withoutPassword(), message: "Here's your token!"});
                }
            });
        }
    });
});

authRouter.post("/signup", function (req, res) {
    User.findOne({username: req.body.username}, function (err, existingUser) {
        if (err) res.status(500).send(err);
        if (existingUser) res.status(418).send({success: false, message: "That username is already taken. And I'm a teapot."});
        else {
            var newUser = new User(req.body);
            newUser.save(function (err, user) {
                if (err) res.status(500).send(err);
                else res.send({success: true, user: user, message: "Successfully created new user"});
            });
        }
    });
});

authRouter.post("/change-password", function (req, res) {
    console.log(req.user);
    User.findById(req.user._id, function (err, user) {

        if (err) {
            res.status(500).send(err);
        } else {
            user.password = req.body.newPassword || user.password;
            user.save(function (err, user) {
                res.send({success: true, user: user.withoutPassword()});
            });
        }
    });
});

authRouter.post("/reset/:resetToken", function (req, res) {
    User.findOne({resetPasswordToken: req.params.resetToken}, function (err, user) {
        if (err) {
            res.status(500).send(err);
        } else {
            user.password = req.body.password || user.password;
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function (err, user) {
                res.send({success: true, message: "Password successfully reset!"});
            });
        }
    });
});

authRouter.post("/forgot", function (req, res, next) {
    async.waterfall([
        function (done) {
            crypto.randomBytes(20, function (err, buffer) {
                var token = buffer.toString("hex");
                console.log("Token:", token);
                done(err, token);
            });
        },
        function (token, done) {
            User.findOne({email: req.body.email}, function (err, user) {
                if (err) return res.send(err);
                else if (!user) {
                    return res.status(404).send({
                        success: false,
                        message: "The email " + req.body.email + "isn't registered in the system"
                    });
                }
                user.resetPasswordToken = token;
                user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

                user.save(function (err) {
                    console.log("Saved user");
                    done(err, token, user);
                });
            });
        },
        function (token, user, done) {
            console.log("starting email send");
            var helper = require("sendgrid").mail;
            var from_email = new helper.Email("noreply@todosapp.io");
            var to_email = new helper.Email(user.email);
            var subject = "Your TodoApp password reset link is here!";
            // var html = "<h3>Click the link below to reset your password!</h3><a href='http://" + req.headers.host + "/reset/" + token + "'>";
            var content = new helper.Content("text/plain", 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
                'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                'http://' + req.headers.host + '/#/reset/' + token + '\n\n' +
                'If you did not request this, please ignore this email and your password will remain unchanged.\n');
            var mail = new helper.Mail(from_email, subject, to_email, content);

            var sendgrid = require("sendgrid").SendGrid(config.sendgridAPIKey);
            var requestBody = mail.toJSON();
            var request = sendgrid.emptyRequest();
            request.method = 'POST';
            request.path = '/v3/mail/send';
            request.body = requestBody;
            sendgrid.API(request, function (response) {
                // console.log(response);
                done(null, "done");
            });
        }
    ], function (err, result) {
        if (err) console.log(err);
        console.log(result);
        res.status(202).send({success: true, message: "Mail sent successfully!"});
    });
});

module.exports = authRouter;