const mongoose = require("mongoose");


const exerciseSchema = new mongoose.Schema({
	description: {
		type: String,
		required: true
	},
	duration: {
		type: Number,
		required: true
	},
	date: {
		type: Date,
		default: new Date()
	}
});


const userSchema = new mongoose.Schema({
	username: {
		type: String,
		required: true
	},
	exercises: [exerciseSchema]
});

const User = mongoose.model("User", userSchema);
const Exercise = mongoose.model("Exercise", exerciseSchema);

module.exports = {
	User,
	Exercise
};
