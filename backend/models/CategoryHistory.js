const mongoose = require('mongoose');

const categoryHistorySchema = new mongoose.Schema({
  categoryId: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: { type: String, required: true },
  action: { type: String, enum: ['create', 'update', 'delete'], required: true },
  changeType: { type: String, enum: ['category', 'subcategory'], required: true },
  oldValue: { type: mongoose.Schema.Types.Mixed },
  newValue: { type: mongoose.Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now },
  details: { type: String }
});

module.exports = mongoose.model('CategoryHistory', categoryHistorySchema);
