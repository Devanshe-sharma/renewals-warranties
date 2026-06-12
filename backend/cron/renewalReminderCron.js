const cron = require("node-cron");
const Newrenewal = require("../models/Newrenewal");

const sendReminder1 = require("../utils/mailer/services/sendRenewalReminder1");
const sendReminder2 = require("../utils/mailer/services/sendRenewalReminder2");
const sendReminder3 = require("../utils/mailer/services/sendRenewalReminder3");

const sendRenewalUpdateCreatedMail = require("../utils/mailer/services/sendRenewalUpdateCreatedMail");

console.log("🚀 Renewal cron loaded");


function isSameDay(d1, d2) {
  return (
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear()
  );
}


function toMidnight(d) {
  const x = new Date(d);
  x.setHours(0,0,0,0);
  return x;
}


cron.schedule(
"0 9 * * *",
async()=>{

console.log("⏰ Renewal cron fired");


try {


const renewals = await Newrenewal.find({
 active:true,
 is_closed:false
}).lean();


const today = toMidnight(new Date());


for(const renewal of renewals){


const itemName = renewal.item_name;


const r1Date = renewal.reminder1_date
 ? toMidnight(renewal.reminder1_date)
 : null;


const r2Date = renewal.reminder2_date
 ? toMidnight(renewal.reminder2_date)
 : null;


const finalDate = renewal.reminder_final_date
 ? toMidnight(renewal.reminder_final_date)
 : null;


const endDate = renewal.end_date
 ? toMidnight(renewal.end_date)
 : null;



// ==================================
// RENEWAL COMPLETED
// ==================================

if(renewal.completed === true){

 console.log(
 `${itemName} renewal completed`
 );


 await sendRenewalUpdateCreatedMail(renewal);


 await Newrenewal.updateOne(
  {_id:renewal._id},
  {
   active:false,
   is_closed:true
  }
 );


 continue;

}





// ==================================
// EXPIRED
// ==================================

if(endDate && today > endDate){

 console.log(
 `${itemName} expired`
 );

 continue;

}





// ==================================
// 3RD REMINDER ESCALATION DAILY
// ==================================

if(
 finalDate &&
 today >= finalDate
){

 console.log(
 `🚨 ${itemName} escalation reminder`
 );


 await sendReminder3(renewal);


 continue;

}





// ==================================
// 2ND REMINDER DAILY
// ==================================

if(
 r2Date &&
 finalDate &&
 today >= r2Date &&
 today < finalDate
){

 console.log(
 `🔴 ${itemName} second reminder`
 );


 await sendReminder2(renewal);


 continue;

}





// ==================================
// 1ST REMINDER ONCE
// ==================================

if(
 r1Date &&
 isSameDay(today,r1Date)
){

 console.log(
 `🟡 ${itemName} first reminder`
 );


 await sendReminder1(renewal);


 continue;

}



console.log(
`${itemName} no reminder today`
);



}


}catch(err){

console.log(
"CRON ERROR",
err
);

}


},
{
timezone:"Asia/Kolkata"
}
);