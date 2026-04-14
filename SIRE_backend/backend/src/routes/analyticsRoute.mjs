/**
 * analyticsRoute.mjs
 * Author: Copilot
 * Last Update: 2026-04-14
 * Program-level analytics endpoint.
 *
 * GET /api/analytics  – returns aggregated KPI summary from all persisted session results.
 */
import { Router } from 'express'
import { sireDatabase } from '../models/sireDatabase.mjs'

const router = Router()

/** Display label map for role keys used across the platform. */
const ROLE_LABELS = {
  'it-secops':  'IT / SecOps',
  'legal':      'Legal',
  'comms':      'Communications / PR',
  'exec':       'Executive',
  'security':   'Security',
  'safety':     'Safety',
  'medical':    'Medical',
  'facilities': 'Facilities',
  'evacuation': 'Evacuation',
}

/**
 * Aggregate KPI data from persisted session results.
 * Returns program-level summary, per-role breakdown, recent sessions, and top gaps.
 */
function aggregateAnalytics(rows) {
  let totalParticipants = 0
  let accuracySum = 0
  let accuracyCount = 0
  let timeSum = 0
  let timeCount = 0
  let milestonesCompletedSum = 0
  let milestonesCompletedCount = 0

  const roleTotals = {}   // role → { accuracySum, accuracyCount, timeSum, timeCount, sessionCount }
  const recentSessions = []

  for (const row of rows) {
    let kpis = {}
    try { kpis = JSON.parse(row.json_data) } catch { /* ignore */ }

    totalParticipants += row.participant_count || 0

    if (typeof kpis.overallAccuracy === 'number') {
      accuracySum += kpis.overallAccuracy
      accuracyCount++
    }
    if (typeof kpis.avgTimeToDecisionMs === 'number') {
      timeSum += kpis.avgTimeToDecisionMs
      timeCount++
    }
    if (typeof kpis.milestonesCompleted === 'number') {
      milestonesCompletedSum += kpis.milestonesCompleted
      milestonesCompletedCount++
    }

    // Accumulate per-role breakdown across sessions
    const roleBreakdown = kpis.roleBreakdown || {}
    for (const [role, data] of Object.entries(roleBreakdown)) {
      if (!roleTotals[role]) {
        roleTotals[role] = { accuracySum: 0, accuracyCount: 0, timeSum: 0, timeCount: 0, sessionCount: 0 }
      }
      roleTotals[role].sessionCount++
      if (typeof data.accuracy === 'number') {
        roleTotals[role].accuracySum += data.accuracy
        roleTotals[role].accuracyCount++
      }
      if (typeof data.avgDecisionTimeMs === 'number') {
        roleTotals[role].timeSum += data.avgDecisionTimeMs
        roleTotals[role].timeCount++
      }
    }

    recentSessions.push({
      id: row.id,
      sessionCode: row.session_code,
      scenarioKey: row.scenario_key,
      startedAt: row.started_at,
      endedAt: row.ended_at,
      participantCount: row.participant_count,
      overallAccuracy: kpis.overallAccuracy ?? null,
      avgTimeToDecisionMs: kpis.avgTimeToDecisionMs ?? null,
      milestonesCompleted: kpis.milestonesCompleted ?? null,
      participationRate: kpis.participationRate ?? null,
      createdAt: row.created_at,
    })
  }

  const totalExercises = rows.length
  const avgParticipants = totalExercises > 0 ? totalParticipants / totalExercises : 0
  const avgAccuracy = accuracyCount > 0 ? accuracySum / accuracyCount : null
  const avgTimeToDecisionMs = timeCount > 0 ? Math.round(timeSum / timeCount) : null
  const avgMilestonesCompleted = milestonesCompletedCount > 0
    ? Math.round(milestonesCompletedSum / milestonesCompletedCount)
    : null

  // Build per-role summary
  const roleBreakdown = {}
  for (const [role, data] of Object.entries(roleTotals)) {
    roleBreakdown[role] = {
      label: ROLE_LABELS[role] || role,
      avgAccuracy: data.accuracyCount > 0 ? data.accuracySum / data.accuracyCount : null,
      avgDecisionTimeMs: data.timeCount > 0 ? Math.round(data.timeSum / data.timeCount) : null,
      sessionCount: data.sessionCount,
    }
  }

  // Top gaps: roles with lowest accuracy (min 1 session), sorted ascending
  const topGaps = Object.entries(roleBreakdown)
    .filter(([, v]) => v.avgAccuracy !== null)
    .sort(([, a], [, b]) => a.avgAccuracy - b.avgAccuracy)
    .slice(0, 3)
    .map(([role, v]) => ({ role, label: v.label, avgAccuracy: v.avgAccuracy }))

  return {
    summary: {
      totalExercises,
      avgParticipants: Math.round(avgParticipants * 10) / 10,
      avgAccuracy,
      avgTimeToDecisionMs,
      avgMilestonesCompleted,
    },
    recentSessions,
    roleBreakdown,
    topGaps,
  }
}

/** GET /api/analytics — returns program-level analytics from persisted session results. */
router.get('/analytics', (req, res) => {
  try {
    const rows = sireDatabase.listSessionResults()
    const analytics = aggregateAnalytics(rows)
    return res.json(analytics)
  } catch (err) {
    return res.status(500).json({ message: 'Unable to retrieve analytics' })
  }
})

export default router
