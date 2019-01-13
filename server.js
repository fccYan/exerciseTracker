const express = require("express");
const app = express();
const bodyParser = require("body-parser");

require("dotenv").config();
const cors = require("cors");

const models = require("./exercise.model");

const mongoose = require("mongoose");
mongoose.connect(
	process.env.MONGO_URI,
	{ useNewUrlParser: true }
);

app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static("public"));
app.get("/", (req, res) => {
	res.sendFile(__dirname + "/views/index.html");
});

// Error Handling middleware
app.use((err, req, res, next) => {
	let errCode, errMessage;

	if (err.errors) {
		// mongoose validation error
		errCode = 400; // bad request
		const keys = Object.keys(err.errors);
		// report the first validation error
		errMessage = err.errors[keys[0]].message;
	} else {
		// generic or custom error
		errCode = err.status || 500;
		errMessage = err.message || "Internal Server Error";
	}
	res
		.status(errCode)
		.type("txt")
		.send(errMessage);
});

app.post("/api/exercise/new-user", (req, res, next) => {
	const username = req.body.username;
	if (username) {
		let user = new models.User({ username });
		user.save();
		res.json(user);
		return next();
	} else {
		res.json({ error: "username not found" });
		return next();
	}
});

app.post("/api/exercise/add", validateId, (req, res, next) => {
	models.User.findById(req.body.userId).then((user)=>{
		if(!user) {
			res.json("User not found.");
			return next();
		} else {
			let exercise = new models.Exercise(req.body);
			user.exercises.push(req.body);
			return user.save();
		}
	}).then((user)=>{
		res.json(user);
		return next();
	}).catch(next);
	
});

const listener = app.listen(process.env.PORT || 3000, () => {
	console.log("Your app is listening on port " + listener.address().port);
});


function validateId(req, res, next) {
	if (!mongoose.Types.ObjectId.isValid(req.body.userId)) {
		next(new Error("Document not found"));
	} else {
		next();
	}
}
