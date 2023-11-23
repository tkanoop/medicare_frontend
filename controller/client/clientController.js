const twilio = require("../../util/twilio");
const Client = require("../../models/client");
const Department = require("../../models/department");
const Doctor = require("../../models/doctor");
const Booking = require("../../models/booking");
const Prescription=require("../../models/prescription")
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const moment = require('moment');
const createToken = (_id) => {
  return jwt.sign({ _id }, process.env.SECRET, { expiresIn: "3d" });
};

module.exports = {
  addClient: async (req, res) => {
    try {
      const userData = req.body;
      console.log(userData);

      const number = req.body.mobile;
      const existUser = await Client.findOne({ mobile: userData.mobile });
      if (existUser) {
        res
          .status(401)
          .json({ message: "Mobile number already registered", state: false });
      } else {
        twilio.sendVerificationToken(number);
        res.status(200).json({ message: "OTP send" });
      }
      res.status(200).json("data received");
    } catch (error) {}
  },
  submit: async (req, res) => {
    try {
      const otp = req.body.OTP;
      const number = req.body.data.mobile;
      const userData = req.body.data;
      console.log(userData);
      const passwordHash = await bcrypt.hash(userData.password, 10);
      console.log(userData);
      const existUser = await Client.findOne({ mobile: userData.mobile });

      if (existUser) {
        res
          .status(201)
          .json({ message: "Mobile number already registered", state: false });
      } else {
        const twilioStatus = await twilio.checkVerificationToken(otp, number);
        if (twilioStatus) {
          const newClient = new Client({
            name: userData.name,
            age: userData.age,
            mobile: userData.mobile,
            email: userData.email,
            password: passwordHash,
            gender: userData.gender,
            address: userData.address,
          });
          await newClient.save();
          res.status(201).json();
        } else {
          res.status(401).json({ message: "OTP is invalid" });
        }
      }
    } catch (error) {
      console.log(error);
    }
  },

  login: async (req, res) => {
    try {
      const data = req.body;

      const existUser = await Client.findOne({ mobile: data.mobile });

      if (existUser) {
        

        const passwordMatch = await bcrypt.compare(
          data.password,
          existUser.password
        );

        if (existUser.status == true) {
          if (data.mobile == existUser.mobile && passwordMatch == true) {
            const token = createToken(existUser._id);

            res.status(200).json({ token });
            console.log("success");
          } else {
            res.status(401).json({ message: "Invalid Credentials" });
          }
        } else {
          res
            .status(401)
            .json({ err: "You have been blocked from accessing this Website" });
        }
      } else {
        res.status(401).json({ err: "User Doesn't Exist" });
      }
    } catch (error) {
      console.log(error);
    }
  },
  getDepartment: async (req, res) => {
    try {
      const departments = await Department.find({ status: true });
      console.log(departments);

      res.json(departments);
    } catch (error) {
      console.log("error ");
    }
  },
  getDoctors: async (req, res) => {
    try {
      const doctors = await Doctor.find({ status: true });
  
      const responseData = doctors.map((doctor) => {
        const { password, email, mobile, ...data } = doctor.toObject();
        return data;
      });
  
      res.json(responseData);
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  ,
  getDoctorsByDepartment: async (req, res) => {
    try {
      const id = req.params.id;
      console.log(id);
      const departments = await Department.findById({ _id: id });

      console.log(departments);
      const details = await Doctor.find({
        $and: [{ department: departments.department }, { status: true }],
      });
      const responseData = details.map((doctor) => {
        const { password, email, mobile, ...data } = doctor.toObject();
        return data;
      });
      res.json({ tokenverified: true, statusverified: true, responseData });
     
    } catch (error) {
      console.log("error");
    }
  },
  bookDoctor: async (req, res) => {
    try {
      const id = await Doctor.findById({ _id: req.params.id });
      console.log(id.name);

      const date = req.body.date;
      const time = req.body.time;
      let booked = await Booking.findOne({
        $and: [{ date: date }, { starting_time: time }, { doctor_id: id.name }],
      });

      console.log("fgdgf" + booked);

      if (booked) {
        res.json({ message: "Already Booked", booked });
        console.log("already booked");
      } else {
        res.json({ success: true });
        console.log("available");
      }
    } catch (error) {}
  },
  getdoctor: async (req, res) => {
    try {
      const id = req.params.id;
      const doctor = await Doctor.findById({ _id: id });
      const date = req.body.date;


const currentTime = new Date(); 
const currentHour = currentTime.getHours(); 
const currentMinute = currentTime.getMinutes(); 


const [day, month, year] = date.split('/').map(Number);
const selectedDate = new Date(year, month - 1, day); 


const availableTimeslots = doctor.timeslots.filter(timeslot => {
  const [hour, minute] = timeslot.split(':').map(Number);
  let convertedHour = hour;
  if (hour < 12 && timeslot.includes('PM')) {
    convertedHour += 12;
  } else if (hour === 12 && timeslot.includes('AM')) {
    convertedHour = 0;
  }

  // Compare the hours and minutes only
  if (
    (selectedDate.getTime() > currentTime.getTime()) ||
    (selectedDate.getTime() < currentTime.getTime() && convertedHour > currentHour) ||
    (selectedDate.getTime() === currentTime.getTime() && convertedHour === currentHour && minute > currentMinute)
  ) {
    return true; 
  }
  
  return false; 
});




  
      const { password, email, mobile, ...responseData } = doctor.toObject();
  
      responseData.timeslots = availableTimeslots; 
      res.json(responseData);
    } catch (error) {}
  },
  postbooking: async (req, res) => {
    try {
      const { authorization } = req.headers;
      const token = authorization;
      const { _id } = jwt.verify(token, process.env.SECRET);
      console.log(_id);
      const id = req.params.id;
      const departmentid = req.params.departmentid;
      console.log(id);
      console.log(departmentid);

      const date = req.body.date;
      const time = req.body.time;
  
      const doctor = await Doctor.findById({ _id: id });
      const department = await Department.findById({ _id: departmentid });
      const client = await Client.findById({ _id: _id });
      const newBooking = new Booking({
        client_id: client.name,
        doctor_id: doctor.name,
        department_id: department.department,
        date: date,
        starting_time: time,
        timebooked:[]

      });
      newBooking.timebooked.push(time)
      await newBooking.save().then(() => {
        res.json({ success: "Booked succesfully" });
      });
      console.log("booked");


    } catch (error) {
      console.log(error);
    }
  },
  getUser: async (req,res)=>{
    const { authorization } = req.headers;
    const token = authorization;
    const { _id } = jwt.verify(token, process.env.SECRET);
    console.log(_id);
    const user = await Client.findById({_id:_id})
    res.json(user)
    console.log(user.name);
  },
  getBooking: async (req,res)=>{
    const { authorization } = req.headers;
    const token = authorization;
    const { _id } = jwt.verify(token, process.env.SECRET);
    console.log(_id);
    const user = await Client.findById({_id:_id})
    const booking = await Booking.find({ client_id: user.name }).sort({date:-1, starting_time:1})
    
    console.log(booking);
    res.json(booking)
  },
  cancelBooking: async (req,res)=>{
    const id = req.params.id
    time =req.body.time
    date=req.body.date
    
   
    const booking= await Booking.findById({_id:id})
 
    console.log(booking.status);
    if(booking.status===true){
      const currentDate = moment().format('DD/MM/YYYY')
      const requestedDate = moment(date, 'DD/MM/YYYY').format('DD/MM/YYYY')
      const requestedTime = moment(time, 'hh:mm A').format('HH:mm')
      const timeNumber = parseInt(requestedTime.replace(':', ''), 10)
      
      
      
      
      
      const currentTime = moment().format('HH:mm');
      const currenttimeNumber = parseInt(currentTime.replace(':', ''), 10)
     
    
      
      const timeDifferenceHours = timeNumber - currenttimeNumber;

console.log(timeDifferenceHours);
console.log(currentDate);
console.log(requestedDate);

      
      
      // Check if the requested date is in the future and the time difference is greater than or equal to 1 hour
      if (moment(currentDate, 'DD/MM/YYYY').isBefore(moment(requestedDate, 'DD/MM/YYYY')) || (requestedDate==currentDate && timeDifferenceHours >= 100)) {
        // Perform the cancellation process
        await Booking.findByIdAndUpdate(id, {
          $set: { status: false },
          $pull: { timebooked: req.body.time }
        });
        res.json({ success: true });
      } else {
        res.json({ success: false, message: 'Cancellation Must Be Atleast One Hour Before Booked Time' });
      }



    }
},
getPrescription: async (req,res)=>{
  const id=req.params.id
  console.log(id);
  const prescription = await Prescription.findOne({bookingid:id})
  console.log(prescription);
  res.json(prescription)
},
bookedtimes:  async (req, res) => {
  try {
    const id = await Doctor.findById({ _id: req.params.id });
    

    const date = req.body.date;
    console.log(date);
    console.log(id.name);


    let booked = await Booking.find({
      $and: [{ date: date }, { doctor_id: id.name }],
    });
    console.log(booked);


    if (booked) {
      const bookedTimes = booked.map(booking => booking.timebooked).flat();
      res.json({ message: "Already Booked", bookedTimes });
      console.log(bookedTimes);
    } else {
      res.json({ success: true });
      console.log("available");
    }
  } catch (error) {
    // Handle the error appropriately
  }
},
}
