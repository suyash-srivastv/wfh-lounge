export const ROLES=["Designer","Developer","Freelancer","Founder","Product Manager","Marketer","Writer","Other"];
export const STATUSES=["Open to work","Building something","Available for freelance","Looking for co-founder","Not available"];
export const CHANNELS=[
  {id:"general",  label:"General",  icon:"ti-messages",    desc:"Open discussion"},
  {id:"tech",     label:"Tech",     icon:"ti-code",        desc:"Dev, design, tools"},
  {id:"non-tech", label:"Non-tech", icon:"ti-books",       desc:"Business, ideas, life"},
  {id:"casual",   label:"Casual",   icon:"ti-mood-smile",  desc:"Chill & off-topic"},
];

export const AVATAR_PALETTE=[
  {bg:"#EEEDFE",tc:"#3C3489"},{bg:"#E1F5EE",tc:"#085041"},
  {bg:"#FAEEDA",tc:"#633806"},{bg:"#EAF3DE",tc:"#27500A"},
  {bg:"#FBEAF0",tc:"#72243E"},{bg:"#FAECE7",tc:"#712B13"},
];
export function avatarColors(uid=""){
  const i=uid.split("").reduce((s,c)=>s+c.charCodeAt(0),0)%AVATAR_PALETTE.length;
  return AVATAR_PALETTE[i];
}

export function firebaseErrMsg(code){
  const map={
    "auth/user-not-found":"No account with this email.",
    "auth/wrong-password":"Wrong password.",
    "auth/invalid-credential":"Wrong email or password.",
    "auth/email-already-in-use":"Email already registered. Log in instead.",
    "auth/weak-password":"Password must be at least 6 characters.",
    "auth/invalid-email":"Invalid email address.",
    "auth/too-many-requests":"Too many attempts. Try again later.",
    "auth/unauthorized-domain":"This domain isn't authorized. Add it in Firebase Console → Authentication → Authorized domains.",
    "auth/operation-not-supported-in-this-environment":"Google sign-in isn't supported in this browser.",
    "auth/web-storage-unsupported":"Your browser blocks storage needed for sign-in. Try disabling private/incognito mode.",
    "auth/network-request-failed":"Network error. Check your connection and try again.",
  };
  return map[code]||(code?`Sign-in failed (${code}).`:"Something went wrong. Try again.");
}

export function timeAgo(date){
  if(!date)return "";
  const s=Math.floor((Date.now()-date.getTime())/1000);
  if(s<60)return "just now";
  if(s<3600)return `${Math.floor(s/60)}m ago`;
  if(s<86400)return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}
