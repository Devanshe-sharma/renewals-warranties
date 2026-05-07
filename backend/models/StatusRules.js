const mongoose = require('mongoose');

const StatusRulesSchema = new mongoose.Schema({
  rules_id: { type: String, default: 'global', unique: true },

  // descriptions
  done_description:         { type: String, default: 'Renewed before expiry date' },
  done_delayed_description: { type: String, default: 'Renewed after expiry date' },
  due_description:          { type: String, default: 'After 2nd reminder, before deadline' },
  overdue_description:      { type: String, default: 'Not renewed after deadline' },
  not_yet_due_description:  { type: String, default: 'Before 2nd reminder date' },

  // logic
  done_grace_days:      { type: Number, default: 0  },
  overdue_start_days:   { type: Number, default: 10 },

}, { collection: 'status_rules', timestamps: true });

module.exports = mongoose.model('StatusRules', StatusRulesSchema);