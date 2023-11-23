const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const bookingSchema = Schema({
  client_id: {
    type: String,
   
  },
  doctor_id: {
    type: String,
    
  },
  department_id: {
    type: String,
   
  },
  date: {
    type: String,
    required: true,
  },
  timebooked: {
    type: [String],
   
    
   
  },
  starting_time: {
    type:String,
    required:true
  },

  status: {
    type: Boolean,
    default: true,
  },
});
module.exports = mongoose.model("Booking", bookingSchema);
