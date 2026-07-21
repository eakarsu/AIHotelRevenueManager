const express = require('express');
const crypto = require('crypto');
const pool = require('../db');
const { validateSnapshot, evaluateRecommendation, validateTransition } = require('../domain/revenuePolicy');
const router = express.Router();

function context(req, roles) {
  const tenantId = req.user?.tenant_id, actorId = Number(req.user?.id), role = req.user?.role;
  if (!tenantId || !Number.isInteger(actorId)) { const error = new Error('tenant-scoped identity required'); error.status = 403; throw error; }
  if (roles && !roles.includes(role)) { const error = new Error('insufficient revenue role'); error.status = 403; throw error; }
  return { tenantId, actorId, role, requestId: String(req.get('x-request-id') || crypto.randomUUID()) };
}
const hash = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');

router.get('/', async (req,res,next) => { try { const {tenantId}=context(req); const result=await pool.query('SELECT id,property_ref,stay_date,room_type,inventory,reservations,current_rate,recommended_rate,restrictions,data_as_of,evidence,status,measurement,version,updated_at FROM revenue_changes WHERE tenant_id=$1 ORDER BY stay_date,id LIMIT 200',[tenantId]); res.json({items:result.rows}); } catch(error){next(error);} });

router.post('/', async (req,res,next) => {
  const client=await pool.connect();
  try {
    const ctx=context(req,['analyst','revenue_manager','admin']);
    const key=String(req.get('idempotency-key')||'').trim(); if(!key) { const error=new Error('Idempotency-Key is required'); error.status=400; throw error; }
    const snapshot=validateSnapshot(req.body); const evaluation=evaluateRecommendation(req.body); const requestHash=hash(req.body);
    await client.query('BEGIN');
    const existing=await client.query('SELECT * FROM revenue_changes WHERE tenant_id=$1 AND idempotency_key=$2 FOR UPDATE',[ctx.tenantId,key]);
    if(existing.rows[0]) { if(existing.rows[0].request_hash!==requestHash) { const error=new Error('idempotency key payload conflict'); error.status=409; throw error; } await client.query('COMMIT'); return res.status(200).json(existing.rows[0]); }
    const result=await client.query(`INSERT INTO revenue_changes(tenant_id,property_ref,stay_date,room_type,inventory,reservations,current_rate,recommended_rate,restrictions,data_as_of,evidence,status,idempotency_key,request_hash,created_by)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'recommended',$12,$13,$14) RETURNING *`,[ctx.tenantId,req.body.property_ref,req.body.stay_date,req.body.room_type,req.body.inventory,req.body.reservations,req.body.current_rate,req.body.recommended_rate,req.body.restrictions||{},snapshot.data_as_of,[...(req.body.evidence||[]),{kind:'deterministic_evaluation',evaluation}],key,requestHash,ctx.actorId]);
    await client.query('INSERT INTO revenue_audit_events(tenant_id,actor_user_id,action,entity_id,before_state,after_state,request_id) VALUES($1,$2,$3,$4,$5,$6,$7)',[ctx.tenantId,ctx.actorId,'recommendation.created',String(result.rows[0].id),null,result.rows[0],ctx.requestId]);
    await client.query('COMMIT'); res.status(201).json(result.rows[0]);
  } catch(error){await client.query('ROLLBACK').catch(()=>{}); next(error);} finally{client.release();}
});

router.post('/:id/transition', async (req,res,next) => {
  const client=await pool.connect();
  try { const ctx=context(req); const expected=Number(req.body.expected_version); if(!Number.isInteger(expected)) { const error=new Error('expected_version is required'); error.status=400; throw error; }
    await client.query('BEGIN'); const found=await client.query('SELECT * FROM revenue_changes WHERE id=$1 AND tenant_id=$2 FOR UPDATE',[req.params.id,ctx.tenantId]); if(!found.rows[0]) { const error=new Error('revenue change not found'); error.status=404; throw error; } const before=found.rows[0]; if(before.version!==expected) { const error=new Error('version conflict'); error.status=409; throw error; }
    validateTransition(before.status,req.body.to,{role:ctx.role,actorId:ctx.actorId,createdBy:before.created_by,evidenceCount:before.evidence.length,dataAsOf:before.data_as_of,providerReceipt:req.body.provider_receipt,rollbackSnapshot:req.body.rollback_snapshot});
    const result=await client.query(`UPDATE revenue_changes SET status=$1,provider_receipt=COALESCE($2,provider_receipt),rollback_snapshot=COALESCE($3,rollback_snapshot),measurement=COALESCE($4,measurement),approved_by=CASE WHEN $1='approved' THEN $5 ELSE approved_by END,version=version+1,updated_at=NOW() WHERE id=$6 AND tenant_id=$7 AND version=$8 RETURNING *`,[req.body.to,req.body.provider_receipt||null,req.body.rollback_snapshot||null,req.body.measurement||null,ctx.actorId,before.id,ctx.tenantId,expected]);
    await client.query('INSERT INTO revenue_audit_events(tenant_id,actor_user_id,action,entity_id,before_state,after_state,request_id) VALUES($1,$2,$3,$4,$5,$6,$7)',[ctx.tenantId,ctx.actorId,`status.${req.body.to}`,String(before.id),before,result.rows[0],ctx.requestId]); await client.query('COMMIT'); res.json(result.rows[0]);
  } catch(error){await client.query('ROLLBACK').catch(()=>{}); next(error);} finally{client.release();}
});

router.post('/integration-runs', async(req,res,next)=>{ try{const ctx=context(req,['integration_operator','revenue_manager','admin']);const allowed=(process.env.REVENUE_PROVIDER_ALLOWLIST||'').split(',').filter(Boolean);if(!allowed.includes(req.body.provider)){const error=new Error('provider is not configured');error.status=503;throw error;}if(!['succeeded','failed','stale','partial'].includes(req.body.status))throw new Error('invalid integration status');const result=await pool.query('INSERT INTO revenue_integration_runs(tenant_id,provider,operation,status,data_as_of,external_reference,error_code,error_message) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',[ctx.tenantId,req.body.provider,req.body.operation,req.body.status,req.body.data_as_of||null,req.body.external_reference||null,req.body.error_code||null,req.body.error_message||null]);res.status(201).json(result.rows[0]);}catch(error){next(error);} });

router.use((error,req,res,next)=>{ if(res.headersSent)return next(error); res.status(error.status||400).json({error:error.message}); });
module.exports=router;
