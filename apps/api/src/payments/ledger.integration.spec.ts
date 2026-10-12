import { config } from 'dotenv';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { Db, balance } from '../db';
import { MockProvider } from './mock';
import { PaymentsService } from './payments.service';
import { encrypt, phoneHash } from '../security';
config({path:resolve(__dirname,'../../../../.env'),quiet:true});
const run = process.env.DATABASE_URL ? describe : describe.skip;
run('real PostgreSQL money invariants',()=>{
 let db:Db;let payments:PaymentsService;let potId:string;let contributionId:string;
 beforeAll(async()=>{
  db=new Db();await db.$connect();payments=new PaymentsService(db,new MockProvider(db));
  const organizer=await db.organizer.create({data:{name:'Invariant test',email:`${randomUUID()}@test.local`,phoneEnc:encrypt('233241234560'),phoneHash:phoneHash(randomUUID()),passwordHash:'not-a-login',phoneVerifiedAt:new Date(),verificationStatus:'VERIFIED'}});
  const pot=await db.pot.create({data:{name:'Invariant test pot',code:randomUUID().slice(0,8).toUpperCase(),slug:'test',story:'Testing money safety',organizerId:organizer.id,payoutMsisdnEnc:encrypt('233241234560'),payoutAccountName:'Test',payoutMode:'ON_CLOSE'}});potId=pot.id;
  const result=await payments.contribute(pot.code,{amountMinor:10000,phone:'0241234567',consent:true,isAnonymous:false},randomUUID());contributionId=result.id;
  await db.mockTransaction.update({where:{reference:result.reference},data:{createdAt:new Date(Date.now()-60000)}});
 },30000);
 afterAll(async()=>{await db.$disconnect();});
 test('duplicate callback counts a contribution once',async()=>{
  const c=await db.contribution.findUniqueOrThrow({where:{id:contributionId}});
  await Promise.all(Array.from({length:5},()=>payments.callback(c.providerReference)));
  expect(await db.ledgerEntry.count({where:{potId,type:'CONTRIBUTION'}})).toBe(1);
  expect(await db.$transaction(tx=>balance(tx,potId))).toBe(10000);
 });
 test('ledger UPDATE and DELETE are rejected by PostgreSQL',async()=>{
  const entry=await db.ledgerEntry.findFirstOrThrow({where:{potId}});
  await expect(db.ledgerEntry.update({where:{id:entry.id},data:{amountMinor:1}})).rejects.toThrow();
  await expect(db.ledgerEntry.delete({where:{id:entry.id}})).rejects.toThrow();
 });
 test('amount, reference and terminal state cannot be rewritten',async()=>{
  await expect(db.contribution.update({where:{id:contributionId},data:{amountMinor:1}})).rejects.toThrow();
  await expect(db.contribution.update({where:{id:contributionId},data:{providerReference:randomUUID()}})).rejects.toThrow();
  await expect(db.contribution.update({where:{id:contributionId},data:{status:'PENDING'}})).rejects.toThrow();
 });
 test('a rolled back database transaction adds no money',async()=>{
  await expect(db.$transaction(async tx=>{await tx.ledgerEntry.create({data:{potId,type:'RECOVERY',amountMinor:9999,refType:'test',refId:randomUUID()}});throw new Error('simulated database failure');})).rejects.toThrow();
  expect(await db.$transaction(tx=>balance(tx,potId))).toBe(10000);
 });
 test('concurrent payout requests cannot reserve more than the balance',async()=>{
  await Promise.all(Array.from({length:4},()=>payments.reservePayout(potId)));
  const jobs=await db.payout.findMany({where:{potId}});
  expect(jobs.reduce((s,j)=>s+j.amountMinor,0)).toBe(10000);
  expect(await db.$transaction(tx=>balance(tx,potId))).toBe(0);
 });
 test('crash after claim recovers with the persisted reference',async()=>{
  const job=await db.payout.findFirstOrThrow({where:{potId}});
  await db.payout.update({where:{id:job.id},data:{status:'SENT'}});
  await payments.processTransfer('payout',job.id);
  const mock=await db.mockTransaction.findUniqueOrThrow({where:{reference:job.providerReference}});
  await db.mockTransaction.update({where:{reference:mock.reference},data:{createdAt:new Date(Date.now()-60000)}});
  await payments.processTransfer('payout',job.id);
  await payments.processTransfer('payout',job.id);
  expect(await db.ledgerEntry.count({where:{potId,type:'PAYOUT'}})).toBe(1);
  expect(await db.$transaction(tx=>balance(tx,potId))).toBe(0);
 });
 test('post-payout refunds await recovery before spending funds',async()=>{
  await payments.cancel(potId);
  expect(await db.refund.count({where:{contribution:{potId}}})).toBe(0);
  const recovery=await db.recovery.findUniqueOrThrow({where:{potId}});
  expect(recovery.amountMinor).toBe(10000);
 });
});
