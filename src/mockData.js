export const CITIES = ["Jaipur","Indore","Lucknow","Chandigarh","Bhopal","Nagpur","Prayagraj"];

export const INIT_EVENTS = [
  {id:1,title:"Morning coffee & cowork",type:"IRL",city:"Jaipur",location:"Brew & Bean, C-Scheme",date:"Mon Jun 2",time:"9:00 AM",attendees:14,tags:["cowork","casual"],host:"Ananya S.",going:false},
  {id:2,title:"Freelancers weekly hangout",type:"Virtual",city:"Indore",location:"Google Meet",date:"Wed Jun 4",time:"7:00 PM",attendees:8,tags:["networking","freelance"],host:"Rohan K.",going:false},
  {id:3,title:"WFH desk setup show & tell",type:"IRL",city:"Jaipur",location:"Third Wave Coffee, Vaishali",date:"Sat Jun 7",time:"11:00 AM",attendees:21,tags:["gear","setup"],host:"Priya D.",going:true},
  {id:4,title:"Startup ideas rapid fire",type:"IRL",city:"Lucknow",location:"91Springboard, Hazratganj",date:"Fri Jun 6",time:"6:00 PM",attendees:33,tags:["startup","ideas"],host:"Vikram G.",going:false},
  {id:5,title:"Deep work Friday",type:"Virtual",city:"Prayagraj",location:"Zoom",date:"Fri Jun 6",time:"10:00 AM",attendees:6,tags:["focus","pomodoro"],host:"Neha M.",going:false},
  {id:6,title:"Fitness & WFH balance talk",type:"IRL",city:"Bhopal",location:"Café Central, MP Nagar",date:"Sun Jun 8",time:"8:00 AM",attendees:12,tags:["wellness","fitness"],host:"Karan R.",going:false},
];

export const INIT_MEMBERS = [
  {id:1,name:"Ananya Singh",role:"Product Designer",city:"Jaipur",skills:["Figma","UX","Prototyping"],online:true,ini:"AS",bg:"#E1F5EE",tc:"#085041",conn:42,events:7,connected:false},
  {id:2,name:"Rohan Kapoor",role:"Full-stack Dev",city:"Indore",skills:["React","Node.js","Postgres"],online:false,ini:"RK",bg:"#EEEDFE",tc:"#3C3489",conn:28,events:4,connected:false},
  {id:3,name:"Priya Desai",role:"Freelance Writer",city:"Jaipur",skills:["Content","SEO","Copywriting"],online:true,ini:"PD",bg:"#FAEEDA",tc:"#633806",conn:61,events:11,connected:true},
  {id:4,name:"Vikram Gupta",role:"Startup Founder",city:"Lucknow",skills:["Strategy","B2B","Fundraising"],online:false,ini:"VG",bg:"#EAF3DE",tc:"#27500A",conn:89,events:15,connected:false},
  {id:5,name:"Neha Mehta",role:"UI Developer",city:"Prayagraj",skills:["React Native","Expo","CSS"],online:true,ini:"NM",bg:"#FBEAF0",tc:"#72243E",conn:19,events:3,connected:false},
  {id:6,name:"Karan Rao",role:"Growth Marketer",city:"Bhopal",skills:["SEO","Paid Ads","Analytics"],online:false,ini:"KR",bg:"#FAECE7",tc:"#712B13",conn:35,events:6,connected:false},
];

export const INIT_IDEAS = [
  {id:1,title:"Hyperlocal WFH spot aggregator",desc:"Community-driven map of cafés, libraries, cowork spaces in tier 2 cities. Rated by remote workers, for remote workers.",author:"Karan R.",city:"Bhopal",votes:67,stage:"Idea",tags:["product","local"],looking:["developer","designer"],upvoted:false},
  {id:2,title:"Remote visa aggregator for Indians",desc:"Single dashboard for digital nomad visas worldwide. Huge gap for Indian passport holders.",author:"Rohan K.",city:"Indore",votes:89,stage:"Validating",tags:["SaaS","travel"],looking:["co-founder","marketer"],upvoted:false},
  {id:3,title:"WFH ergonomics subscription box",desc:"Monthly curated box of ergonomic and focus products for home office workers under ₹999/mo.",author:"Priya D.",city:"Jaipur",votes:44,stage:"Idea",tags:["ecommerce","wellness"],looking:["operations"],upvoted:true},
  {id:4,title:"Async standup with city context",desc:"Daily async standups tied to your city's WFH community. See what others nearby are working on.",author:"Ananya S.",city:"Jaipur",votes:31,stage:"Building",tags:["SaaS","productivity"],looking:["developer"],upvoted:false},
];

export const INIT_THREADS = [
  {id:1,city:"Jaipur",title:"Best cafés with fast wifi in Jaipur?",body:"Looking for spots near Malviya Nagar or Vaishali with reliable wifi and power sockets. Third Wave gets packed by noon.",author:"Priya D.",time:"2h ago",replies:34,likes:89,liked:false,tags:["local","cafés"]},
  {id:2,city:"All",title:"How do you handle timezone fatigue?",body:"I work with a US client and my sleep is wrecked. Any sustainable routines you've built that don't destroy your personal life?",author:"Rohan K.",time:"5h ago",replies:21,likes:56,liked:false,tags:["remote work","burnout"]},
  {id:3,city:"All",title:"Share your morning routine 🌅",body:"I struggle to start work without a commute ritual. What do you all do to get into work mode?",author:"Ananya S.",time:"1d ago",replies:47,likes:112,liked:true,tags:["routine","productivity"]},
  {id:4,city:"Indore",title:"Anyone at CCD on Vijay Nagar Tuesdays?",body:"I'm there every Tuesday. Would love to bump into other remote workers and maybe make it a regular thing.",author:"Vikram G.",time:"3h ago",replies:9,likes:28,liked:false,tags:["Indore","cowork"]},
  {id:5,city:"All",title:"WFH ergonomics box — would you buy?",body:"Thinking of a curated monthly box of desk/focus/wellness items under ₹999. Does anyone feel this gap?",author:"Karan R.",time:"6h ago",replies:18,likes:44,liked:false,tags:["startup","ideas"]},
];

export const CHAT_DATA = {
  "Jaipur":[
    {user:"Priya D.",text:"Third Wave Coffee confirmed good wifi today ☕",time:"9:14 AM",bg:"#FAEEDA",tc:"#633806"},
    {user:"Ananya S.",text:"Heading there at 11! Anyone joining?",time:"9:22 AM",bg:"#E1F5EE",tc:"#085041"},
    {user:"Rohan K.",text:"Remote today but saving this for Thursday",time:"9:31 AM",bg:"#EEEDFE",tc:"#3C3489"},
    {user:"Vikram G.",text:"Does anyone have a charger adapter? Sockets are far from every seat",time:"9:45 AM",bg:"#EAF3DE",tc:"#27500A"},
    {user:"Priya D.",text:"Bring your own extension cord lol — learned the hard way 😅",time:"9:47 AM",bg:"#FAEEDA",tc:"#633806"},
  ],
  "Indore":[
    {user:"Rohan K.",text:"Anyone know a good spot near Vijay Nagar for today?",time:"10:02 AM",bg:"#EEEDFE",tc:"#3C3489"},
    {user:"Vikram G.",text:"Try Social — wifi is solid there on weekdays",time:"10:11 AM",bg:"#EAF3DE",tc:"#27500A"},
    {user:"Rohan K.",text:"Perfect, heading there at noon 👍",time:"10:19 AM",bg:"#EEEDFE",tc:"#3C3489"},
  ],
  "Lucknow":[
    {user:"Vikram G.",text:"Anyone at 91Springboard today? Getting a bit lonely here 😅",time:"11:00 AM",bg:"#EAF3DE",tc:"#27500A"},
    {user:"Neha M.",text:"Wish I were there! Remote from home today but planning to join Friday's event",time:"11:14 AM",bg:"#FBEAF0",tc:"#72243E"},
    {user:"Vikram G.",text:"Friday is going to be great — startup ideas rapid fire. Invite your friends!",time:"11:22 AM",bg:"#EAF3DE",tc:"#27500A"},
  ],
  "All cities":[
    {user:"Neha M.",text:"Anyone building in public? Looking for accountability partners 🙋",time:"10:02 AM",bg:"#FBEAF0",tc:"#72243E"},
    {user:"Karan R.",text:"I'm doing a 30-day indie hacker challenge, DM me 👋",time:"10:11 AM",bg:"#FAECE7",tc:"#712B13"},
    {user:"Ananya S.",text:"Would love a weekly check-in thread for this honestly",time:"10:19 AM",bg:"#E1F5EE",tc:"#085041"},
    {user:"Vikram G.",text:"Let's do it — I'll post one every Monday morning",time:"10:24 AM",bg:"#EAF3DE",tc:"#27500A"},
  ],
};
