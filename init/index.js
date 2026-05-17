const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing =  require("../models/listing.js");

const Mongo_URL = "mongodb://localhost:27017/Nestify";
main().then(()=>{
    console.log("Database Connected!");
})
.catch((err)=>{
    console.log("Database Error: "+err);
});

async function main() {
    await mongoose.connect(Mongo_URL);
}

const initDB =  async ()=>{
    await Listing.deleteMany({});
    await Listing.insertMany(initData.data);

}

initDB()
.then(()=>{
    console.log("data was inititalized.");
})
.catch((err)=>{
    console.log("some error occured: ",err.message);
})