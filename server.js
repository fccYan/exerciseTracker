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
		models.User.findOne({ username })
			.then((user) => {
				if (user) {
					res.json({ error: "Username already taken.", user });
					return next();
				} else {
					let user = new models.User({ username });
					user.save();
					res.json(user);
					return next();
				}
			})
			.catch(next);
	} else {
		res.json({ error: "Username not provided." });
		return next();
	}
});

app.post("/api/exercise/add", validateId, (req, res, next) => {
	models.User.findById(req.body.userId)
		.then((user) => {
			if (!user) {
				res.json({error: "User not found."});
				return next();
			} else {
				let date;
				try {
					date = req.body.date ? new Date(req.body.date) : undefined; //this make the schema auto create the date in case it is not provided
				} catch (err) {
					res.json({ error: "Invalid date." });
					return next(err);
				}
				let exercise = {
					description: req.body.description,
					duration: req.body.duration,
					date: date
				};
				user.exercises.push(new models.Exercise(exercise));
				return user.save();
			}
		})
		.then((user) => {
			res.json(user);
			return next();
		})
		.catch(next);
});

app.get("/api/exercise/log", validateId, (req, res, next) => {
	models.User.findById(req.query.userId)
		.then((user) => {
			if (!user) {
				res.json({error: "User not found."});
				return next();
			} else {
				let limit;
				let fromDate;
				let toDate;
				if (req.query.limit) {
					limit = req.query.limit;
				}
				try {
					if (req.query.from) {
						fromDate = new Date(req.query.from);
					}
					if (req.query.to) {
						toDate = new Date(req.query.to);
					}
				} catch (err) {
					res.json({ error: "Error while converting provided dates." });
					return next(err);
				}
				let exercises = user.exercises;
				if (toDate) {
					exercises = exercises.filter((exercise) => {
						return exercise.date >= fromDate && exercise.date <= toDate;
					});
				} else if (fromDate) {
					exercises = exercises.filter((exercise) => {
						return exercise.date >= fromDate;
					});
				}
				if (!isNaN(limit)) {
					exercises = exercises.slice(0, limit);
				}
				res.json(exercises);
				return next();
			}
		})
		.catch(next);
});

const listener = app.listen(process.env.PORT || 3000, () => {
	console.log("Your app is listening on port " + listener.address().port);
});

function validateId(req, res, next) {
	if (!mongoose.Types.ObjectId.isValid(req.body.userId) && !mongoose.Types.ObjectId.isValid(req.query.userId)) {
		next(new Error("User not found"));
	} else {
		next();
	}
}
