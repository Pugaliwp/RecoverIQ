import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Brain, Activity, ShieldAlert, CheckCircle2, XCircle, 
  Clock, RotateCcw, AlertTriangle, Zap, Server
} from 'lucide-react';
import { getOpportunity, analyzeOpportunity, createRecoveryAction, approveRecoveryAction, rejectRecoveryAction, recordRecoveryOutcome } from '../services/api';
import { StateWrapper } from '../components/StateWrapper';
import { cn } from '../components/RiskBadge';

const formatINR = (value) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
};

export function OpportunityDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [actionLoading, setActionLoading] = useState(false);
  const [opp, setOpp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [analysis, setAnalysis] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(true);
  const [analysisError, setAnalysisError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getOpportunity(id);
      setOpp(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalysis = async () => {
    try {
      setAnalysisLoading(true);
      setAnalysisError(null);
      const data = await analyzeOpportunity(id);
      setAnalysis(data);
    } catch (err) {
      setAnalysisError(err.message);
    } finally {
      setAnalysisLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchAnalysis();
  }, [id]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Eligible': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'Pending': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'In Progress': return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
      case 'Failed': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const handleReviewRecommendation = async () => {
    try {
      setActionLoading(true);
      await createRecoveryAction(id);
      await fetchData();
    } catch (err) {
      alert(`Creation failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async (actionId) => {
    try {
      setActionLoading(true);
      await approveRecoveryAction(actionId);
      await fetchData();
    } catch (err) {
      alert(`Approval failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (actionId) => {
    try {
      setActionLoading(true);
      await rejectRecoveryAction(actionId);
      await fetchData();
    } catch (err) {
      alert(`Rejection failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordOutcome = async (actionId, outcome) => {
    try {
      setActionLoading(true);
      await recordRecoveryOutcome(actionId, outcome);
      await fetchData();
    } catch (err) {
      alert(`Outcome recording failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const latestAction = opp?.actions?.length > 0 ? opp.actions[opp.actions.length - 1] : null;

  return (
    <StateWrapper loading={loading} error={error} onRetry={fetchData}>
    {opp && (
    <div className="p-8 space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto">
      <button 
        onClick={() => navigate('/opportunities')}
        className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-100 transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Opportunities
      </button>

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-bold text-slate-100">{opp.opportunity_id}</h2>
            <span className={cn("px-2.5 py-1 text-xs font-medium rounded-full border", getStatusColor(opp.status))}>
              {opp.status}
            </span>
          </div>
          <p className="text-slate-400">Transaction: {opp.transaction_id}</p>
        </div>
        
        <div className="flex gap-3">
          {!latestAction && (
            <button 
              disabled={actionLoading || opp.status === 'Failed'}
              onClick={handleReviewRecommendation}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
              Review Recommendation
            </button>
          )}

          {latestAction?.action_status === 'PENDING_APPROVAL' && (
            <div className="flex gap-2 items-center">
              <span className="text-sm font-medium text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded border border-amber-500/20 mr-2">
                Status: PENDING APPROVAL
              </span>
              <button 
                disabled={actionLoading}
                onClick={() => handleApprove(latestAction.id)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {actionLoading ? <RotateCcw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Approve
              </button>
              <button 
                disabled={actionLoading}
                onClick={() => handleReject(latestAction.id)}
                className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {actionLoading ? <RotateCcw className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                Reject
              </button>
            </div>
          )}

          {latestAction?.action_status === 'APPROVED' && !latestAction.result && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-400 bg-slate-800 px-3 py-1.5 rounded border border-slate-700 mr-2">
                SYNTHETIC DEMO OUTCOME
              </span>
              <button 
                disabled={actionLoading}
                onClick={() => handleRecordOutcome(latestAction.id, 'RECOVERED')}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                Mark Recovered
              </button>
              <button 
                disabled={actionLoading}
                onClick={() => handleRecordOutcome(latestAction.id, 'NOT_RECOVERED')}
                className="flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                Mark Not Recovered
              </button>
            </div>
          )}

          {latestAction?.action_status === 'COMPLETED' && (
            <div className="flex flex-col gap-2 p-4 bg-slate-900 border border-slate-700 rounded-lg text-sm min-w-[300px]">
               <div className="flex items-center justify-between font-medium">
                  <span className="text-slate-400">Synthetic Outcome:</span>
                  <span className={latestAction.result === 'RECOVERED' ? 'text-emerald-400' : 'text-rose-400'}>
                    {latestAction.result === 'RECOVERED' ? 'Recovery Successful' : 'Recovery Failed'}
                  </span>
               </div>
               <p className="text-xs text-slate-500 mb-2 border-b border-slate-700/50 pb-2">(Recorded demo outcome)</p>
               <div className="flex items-center justify-between">
                  <span className="text-slate-400">Predicted Probability:</span>
                  <span className="text-slate-200">
                    {analysis ? `${(analysis.recovery_probability * 100).toFixed(1)}%` : '...'}
                  </span>
               </div>
               <div className="flex items-center justify-between">
                  <span className="text-slate-400">Predicted Class:</span>
                  <span className="text-slate-200">
                    {analysis ? (analysis.recovery_probability >= 0.5 ? 'RECOVERED' : 'NOT_RECOVERED') : '...'}
                  </span>
               </div>
               <div className="flex items-center justify-between">
                  <span className="text-slate-400">Actual Outcome:</span>
                  <span className={latestAction.result === 'RECOVERED' ? 'text-emerald-400' : 'text-rose-400'}>
                    {latestAction.result === 'RECOVERED' ? 'RECOVERED' : 'NOT_RECOVERED'}
                  </span>
               </div>
               <div className="flex items-center justify-between pt-2 mt-1 border-t border-slate-700 font-bold uppercase tracking-wider">
                  <span className="text-slate-400 text-xs">Prediction Assessment:</span>
                  {analysis && (
                     <span className={(analysis.recovery_probability >= 0.5 ? 'RECOVERED' : 'NOT_RECOVERED') === latestAction.result ? 'text-emerald-400' : 'text-rose-400'}>
                       {(analysis.recovery_probability >= 0.5 ? 'RECOVERED' : 'NOT_RECOVERED') === latestAction.result ? 'CORRECT' : 'INCORRECT'}
                     </span>
                  )}
               </div>
            </div>
          )}

          {latestAction?.action_status === 'REJECTED' && (
            <div className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-lg">
              <XCircle className="w-5 h-5" />
              <span className="font-medium">Action Rejected</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface border border-border rounded-xl p-6 flex flex-col justify-center items-center text-center">
          <p className="text-slate-400 text-sm mb-1">Amount at Risk</p>
          <h3 className="text-3xl font-bold text-rose-400 mb-4">{formatINR(opp.amount_at_risk)}</h3>
          <p className="text-slate-400 text-sm mb-1">Root Cause</p>
          <p className="text-slate-200 font-medium">{opp.root_cause}</p>
        </div>
        
        <div className="bg-surface border border-border rounded-xl p-6 flex flex-col justify-center items-center text-center">
          <p className="text-slate-400 text-sm mb-1">Recovery Probability</p>
          <h3 className="text-3xl font-bold text-emerald-400 mb-1">
            {analysisLoading ? (
              <span className="text-xl text-slate-500 animate-pulse">Calculating...</span>
            ) : analysis ? (
              `${(analysis.recovery_probability * 100).toFixed(1)}%`
            ) : (
              `${opp.recovery_probability}%`
            )}
          </h3>
          <p className="text-slate-500 text-xs mb-4">AI estimate based on transaction and customer features.</p>
          <p className="text-slate-400 text-sm mb-1">Expected Recovery</p>
          <p className="text-slate-200 font-medium">
            {analysisLoading ? (
              "..."
            ) : analysis ? (
              formatINR(opp.amount_at_risk * analysis.recovery_probability)
            ) : (
              formatINR(opp.amount_at_risk * (opp.recovery_probability / 100))
            )}
          </p>
        </div>

        <div className="bg-surface border border-border rounded-xl p-6 flex flex-col justify-center items-center text-center">
          <p className="text-slate-400 text-sm mb-1">AI Recommended Action</p>
          <div className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-4 py-2 rounded-lg font-medium text-lg mb-4">
            {analysis ? analysis.recommended_action?.replace(/_/g, ' ') : opp.recommended_action?.replace(/_/g, ' ')}
          </div>
          <p className="text-slate-400 text-sm flex items-center gap-1">
            <Clock className="w-3 h-3" /> Detected {new Date(opp.created_at).toLocaleTimeString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* AI Decision Analysis Card */}
        <div className="bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-500/30 rounded-xl p-6 lg:col-span-1 shadow-lg shadow-indigo-900/20">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-indigo-500/20 p-2 rounded-lg">
              <Brain className="w-5 h-5 text-indigo-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 uppercase tracking-wide">AI Recovery Analysis</h3>
          </div>
          
          {analysisLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
              <p className="text-slate-400 text-sm">Loading AI analysis...</p>
            </div>
          ) : analysisError ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <XCircle className="w-8 h-8 text-rose-400" />
              <p className="text-rose-400 text-sm text-center">Unable to load AI analysis.</p>
              <button onClick={fetchAnalysis} className="text-indigo-400 text-sm hover:underline">Retry</button>
            </div>
          ) : analysis ? (
            <div className="space-y-6">
              {/* Probability & Risk Band */}
              <div>
                <div className="flex items-end justify-between mb-2">
                  <span className="text-sm text-slate-400">Recovery Probability</span>
                  <span className="text-2xl font-bold text-emerald-400">{(analysis.recovery_probability * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 mb-2">
                  <div className="bg-emerald-400 h-2 rounded-full" style={{ width: `${analysis.recovery_probability * 100}%` }}></div>
                </div>
                <span className={cn("px-2 py-0.5 text-[10px] font-bold rounded uppercase", 
                  analysis.risk_band === 'HIGH' ? 'bg-emerald-500/20 text-emerald-400' : 
                  analysis.risk_band === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' : 
                  'bg-rose-500/20 text-rose-400'
                )}>
                  {analysis.risk_band} RISK
                </span>
              </div>
              
              {/* Recommended Action */}
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-3">
                <span className="text-xs text-indigo-300 uppercase tracking-wider font-semibold block mb-1">Recommended Action</span>
                <span className="text-lg font-bold text-indigo-400 flex items-center gap-2">
                  🔔 {analysis.recommended_action.replace(/_/g, ' ')}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-700/50 pb-4">
                <span>Confidence: <span className="text-slate-200 font-medium">{analysis.confidence}</span></span>
                <span>Model v{analysis.model_version}</span>
              </div>
              
              {/* Factors */}
              <div className="space-y-4">
                {analysis?.explanation?.positive_factors?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-emerald-400 uppercase flex items-center gap-1 mb-2">
                      <CheckCircle2 className="w-3 h-3" /> Positive Factors
                    </h4>
                    <ul className="space-y-1.5">
                      {analysis.explanation.positive_factors.map((factor, i) => (
                        <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                          <span className="text-emerald-500 mt-0.5">•</span> {factor}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {analysis?.explanation?.negative_factors?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-rose-400 uppercase flex items-center gap-1 mb-2">
                      <XCircle className="w-3 h-3" /> Negative Factors
                    </h4>
                    <ul className="space-y-1.5">
                      {analysis.explanation.negative_factors.map((factor, i) => (
                        <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                          <span className="text-rose-500 mt-0.5">•</span> {factor}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              {/* Policy Checks */}
              {analysis?.policy_checks?.length > 0 && (
                <div className="pt-2 border-t border-slate-700/50">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase mb-3">Policy Checks</h4>
                  <ul className="space-y-2">
                    {analysis.policy_checks.map((check, i) => (
                      <li key={i} className="text-xs flex items-start gap-2 bg-slate-800/40 p-2 rounded border border-slate-700/50">
                        {check.allowed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        )}
                        <div>
                          <span className={cn("font-medium block mb-0.5", check.allowed ? "text-emerald-400" : "text-rose-400")}>
                            {check.action} — {check.allowed ? 'Allowed' : 'Blocked'}
                          </span>
                          <span className="text-slate-400 block">{check.reason}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : null}
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:col-span-2">
        {/* AI Decision Explanation */}
        <div className="bg-gradient-to-b from-indigo-950/40 to-surface border border-indigo-500/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-indigo-500/20 p-2 rounded-lg">
              <Brain className="w-5 h-5 text-indigo-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-100">Why this recommendation?</h3>
          </div>
          
          <div className="space-y-4">
             {analysisLoading ? (
               <div className="flex items-center gap-3 text-slate-400">
                 <RotateCcw className="w-4 h-4 animate-spin" />
                 <span className="text-sm">Loading explanation factors...</span>
               </div>
             ) : analysis ? (
               <>
                 <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 mb-4">
                   <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Key Factors</h4>
                   <ul className="space-y-2">
                     {analysis.explanation?.positive_factors?.map((f, i) => (
                       <li key={`pos-${i}`} className="text-sm text-slate-200 flex items-start gap-2">
                         <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                         {f}
                       </li>
                     ))}
                     {analysis.explanation?.negative_factors?.map((f, i) => (
                       <li key={`neg-${i}`} className="text-sm text-slate-200 flex items-start gap-2">
                         <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                         {f}
                       </li>
                     ))}
                   </ul>
                   {(!analysis.explanation?.positive_factors?.length && !analysis.explanation?.negative_factors?.length) && (
                     <p className="text-sm text-slate-400">No explanation factors available.</p>
                   )}
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                   <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                     <span className="text-xs text-slate-400 block mb-1">Expected Recovery</span>
                     <span className="text-sm font-medium text-emerald-400">
                       {formatINR(opp.amount_at_risk * analysis.recovery_probability)}
                     </span>
                   </div>
                   <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                     <span className="text-xs text-slate-400 block mb-1">Confidence Score</span>
                     <span className="text-sm font-medium text-indigo-400">
                       {analysis.confidence}
                     </span>
                   </div>
                 </div>
                 
                 {analysis.policy_checks?.length > 0 && (
                   <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 mt-4">
                     <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <ShieldAlert className="w-3 h-3 text-indigo-400" />
                        Policy Guardrails Applied
                     </h4>
                     <ul className="space-y-2">
                       {analysis.policy_checks.map((check, i) => (
                         <li key={i} className="flex flex-col text-sm border-l-2 pl-2 border-slate-600">
                           <span className={cn("font-medium", check.allowed ? "text-slate-200" : "text-rose-400")}>
                             {check.action}
                           </span>
                           <span className="text-slate-400 text-xs">{check.reason}</span>
                         </li>
                       ))}
                     </ul>
                   </div>
                 )}
               </>
             ) : (
               <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-400 text-sm">
                 No explanation factors available.
               </div>
             )}
          </div>
        </div>

        {/* Workflow Timeline */}
        <div className="bg-surface border border-border rounded-xl p-6">
           <h3 className="text-lg font-semibold text-slate-100 mb-6">Recovery Workflow Timeline</h3>
           
           <div className="relative border-l border-slate-700 ml-3 space-y-8 py-2">
              <div className="relative pl-6">
                 <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-background"></div>
                 <h4 className="text-sm font-medium text-slate-200">Revenue Risk Detected</h4>
                 <p className="text-xs text-slate-500 mt-1">Amount: {formatINR(opp.amount_at_risk)} | Reason: {opp.root_cause}</p>
              </div>
              
              <div className="relative pl-6">
                 <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-background"></div>
                 <h4 className="text-sm font-medium text-slate-200">Root Cause Diagnosed</h4>
                 <p className="text-xs text-slate-500 mt-1">{opp.details ? opp.details.split('.')[0] : opp.root_cause}</p>
              </div>

              <div className="relative pl-6">
                 <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-background"></div>
                 <h4 className="text-sm font-medium text-slate-200">AI Recommendation</h4>
                 <p className="text-xs text-slate-500 mt-1">AI picked: {analysis ? analysis.recommended_action : opp.recommended_action}</p>
              </div>

              <div className="relative pl-6">
                 <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-background"></div>
                 <h4 className="text-sm font-medium text-slate-200">Policy Check</h4>
                 <p className="text-xs text-slate-500 mt-1">Automated guardrails verified.</p>
              </div>

              {!latestAction ? (
                <div className="relative pl-6 opacity-50">
                   <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-slate-600 ring-4 ring-background"></div>
                   <h4 className="text-sm font-medium text-slate-200">Awaiting Approval</h4>
                   <p className="text-xs text-slate-500 mt-1">Review recommendation to proceed.</p>
                </div>
              ) : (
                <>
                  <div className="relative pl-6">
                     <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-background"></div>
                     <h4 className="text-sm font-medium text-slate-200">
                       {latestAction.action_status === 'PENDING_APPROVAL' ? 'Pending Approval' : 
                        latestAction.action_status === 'REJECTED' ? 'Rejected' : 'Approved'}
                     </h4>
                     <p className="text-xs text-slate-500 mt-1">
                       {latestAction.action_status === 'PENDING_APPROVAL' ? 'Waiting for human review.' :
                        latestAction.action_status === 'REJECTED' ? 'Recommendation was rejected.' : 'Recommendation was approved.'}
                     </p>
                  </div>
                  
                  {latestAction.action_status === 'APPROVED' && !latestAction.result && (
                    <div className="relative pl-6 opacity-50">
                       <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-slate-600 ring-4 ring-background"></div>
                       <h4 className="text-sm font-medium text-slate-200">Synthetic Recovery Attempt</h4>
                       <p className="text-xs text-slate-500 mt-1">Awaiting synthetic outcome...</p>
                    </div>
                  )}

                  {latestAction.result && (
                    <div className="relative pl-6">
                       <div className={cn("absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full ring-4 ring-background", latestAction.result === 'RECOVERED' ? 'bg-emerald-500' : 'bg-rose-500')}></div>
                       <h4 className="text-sm font-medium text-slate-200">Synthetic Outcome: {latestAction.result === 'RECOVERED' ? 'Recovery Successful' : 'Recovery Failed'}</h4>
                       <p className="text-xs text-slate-500 mt-1">Recorded demo outcome.</p>
                    </div>
                  )}
                </>
              )}
           </div>
        </div>
        </div>
      </div>
    </div>
    )}
    </StateWrapper>
  );
}
