const mongoose = require('mongoose');

const searchSchema = new mongoose.Schema({

    userId: {
        type: String,
        required: true,
        index: true
    },
    postId: {
        type: String,
        required: true,
        unique: true,
    },
    content: {
        type: String,
        required: true,
    },
    createdAt: {
        required: true,
        type: Date,
    },
}, { timestamps: true });

searchSchema.index({ content: 'text' })
searchSchema.index({ createdAt: -1 })

const Search = mongoose.model('Search', searchSchema);
module.exports = Search;