const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const prescriptionSchema = Schema({
    bookingid:{
        type:String,
        

    },


  clientName: {
    type: String,
   
  },
  doctorName: {
    type: String,
    
  },
  
  date: {
    type: String,
    required: true,
  },
  starting_time: {
    type: String,
    
   
  },
  diseases:{
    type:String,
   
  },
  
  medicines:{
    type:[String],
   
  },
  Dosages:{
    type:[String]
  },
  Days:{
    type:[String]
  },
  
 
});
module.exports = mongoose.model("Prescription", prescriptionSchema);