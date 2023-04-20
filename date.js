module.exports=date;
function date(){
var date = new Date();
var options={
  weekday:"long",
  day:"numeric",
  month:"long"
}
var day = date.toLocaleDateString("en-IN",options);
return day;
}