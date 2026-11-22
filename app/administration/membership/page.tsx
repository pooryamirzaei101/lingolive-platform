import Link from 'next/link';
import {isAdmin} from '@/lib/admin';
import {MembershipAdmin} from '@/components/membership-admin';
import {UsersAdmin} from '@/components/users-admin';
export const dynamic='force-dynamic';
export default async function PaymentAdmin(){if(!await isAdmin())return <section className="section shell"><h1>Administrator access required</h1><Link href="/">Go home</Link></section>;return <section className="section shell admin-page"><Link href="/administration" className="folder-back">← Administration</Link><span className="section-eyebrow">MEMBERSHIP & PAYMENTS</span><h1>Payments and Premium users.</h1><p>Manage prices and payment options, add learners, and grant, extend, change, or remove administrator-controlled Premium access.</p><MembershipAdmin/><div className="membership-settings-card"><span className="section-eyebrow">USER ACCESS</span><h2>Add users and manage Premium</h2><p>Paid memberships activate after verified payment. You can also activate Premium manually without charging the learner.</p><UsersAdmin/></div></section>}
