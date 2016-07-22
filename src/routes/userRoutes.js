var express = require("express");
var userRouter = express.Router();
var User = require("../models/user");

userRouter.get("/", function (req, res) {
    User.findOne({username: req.user.username}, function (err, user) {
        if (err) {
            res.status(500).send(err);
        } else if (!user) {
            res.status(404).send({success: false, message: "No user with that username found"})
        } else {
            res.send({success: true, user: user.withoutPassword()});
        }
    });
});

module.exports = userRouter;