import { PGlite } from "@electric-sql/pglite";
const db=new PGlite("file://local-data/pglite");await db.waitReady;const now=Date.now();
const users=[
 ["local-super-admin","pooryamirzaei101@gmail.com","Poorya Mirzaei","IR","advanced","business",1],
 ["seed-user-01","sara.ahmadi@gmail.com","Sara Ahmadi","IR","intermediate","ielts",1],
 ["seed-user-02","amir.hosseini@gmail.com","Amir Hosseini","IR","beginner","travel",0],
 ["seed-user-03","maryam.karimi@gmail.com","Maryam Karimi","IR","advanced","business",1],
 ["seed-user-04","ali.rahimi@gmail.com","Ali Rahimi","IR","intermediate","fun",1],
 ["seed-user-05","neda.moradi@gmail.com","Neda Moradi","IR","beginner","study",0],
 ["seed-user-06","reza.nouri@gmail.com","Reza Nouri","IR","advanced","ielts",1],
 ["seed-user-07","leila.jafari@gmail.com","Leila Jafari","IR","intermediate","travel",0],
 ["seed-user-08","navid.azizi@gmail.com","Navid Azizi","IR","beginner","business",1],
 ["seed-user-09","mina.sadeghi@gmail.com","Mina Sadeghi","IR","advanced","fun",0],
 ["seed-user-10","arash.farhadi@gmail.com","Arash Farhadi","IR","intermediate","study",1]
];
for(let i=0;i<users.length;i++){const [id,email,name,country,level,purpose,newsletter]=users[i];await db.query(`insert into learner_profiles (user_id,is_pending,pending_email,email,display_name,country,level,purpose,newsletter_consent,newsletter_consent_at,completed_at,created_at,updated_at,last_seen_at) values ($1,0,null,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) on conflict (user_id) do update set email=excluded.email,display_name=excluded.display_name,country=excluded.country,level=excluded.level,purpose=excluded.purpose,newsletter_consent=excluded.newsletter_consent,newsletter_consent_at=excluded.newsletter_consent_at,updated_at=excluded.updated_at`,[id,email,name,country,level,purpose,newsletter,newsletter?now-i*86400000:null,now-i*86400000,now-(i+5)*86400000,now,now-i*3600000]);}
for(const id of ["seed-user-01","seed-user-03","seed-user-06","seed-user-09"]){await db.query(`insert into premium_grants (user_id,expires_at,granted_by,updated_at) values ($1,$2,'local-super-admin',$3) on conflict (user_id) do update set expires_at=excluded.expires_at,granted_by=excluded.granted_by,updated_at=excluded.updated_at`,[id,now+180*86400000,now]);}
console.log("admin-users-seed=ready admin=1 learners=10 premium=4 subscribers=7");await db.close();