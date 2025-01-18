const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // แก้ไข MongoDB URI ให้เป็นของ MongoDB Atlas
    await mongoose.connect('mongodb+srv://root:root1234@cluster0.rmbya.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected');
  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1);
  }
};


module.exports = connectDB;
