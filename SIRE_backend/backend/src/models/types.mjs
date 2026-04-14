
/**
 * types.js
 * JSDoc typedefs for consistent data structures.
 */

/** @typedef {Object} TraineeRecord
 *  @property {string} socketId
 *  @property {string} displayName
 *  @property {string|null} role
 */

/** @typedef {Object} InjectRecord
 *  @property {string} id
 *  @property {string} message
 *  @property {string|null} originalMessage
 *  @property {string} severity
 *  @property {string|null} roleFilter
 *  @property {boolean} released
 *  @property {string|null} releasedAt
 *  @property {string|null} editedAt
 *  @property {string} createdAt
 */

/** @typedef {Object} ActionItemRecord
 *  @property {string} id
 *  @property {string} text
 *  @property {string|null} capturedBy
 *  @property {string|null} role
 *  @property {string|null} assignedTo
 *  @property {string} timestampIso
 */

/** @typedef {Object} SessionRecord
 *  @property {string} sessionCode
 *  @property {string} scenarioKey
 *  @property {string} instructorDisplayName
 *  @property {number} createdAtEpochMs
 *  @property {TraineeRecord[]} trainees
 *  @property {number} currentTimelineIndex
 *  @property {boolean} isActive
 *  @property {boolean} isPaused
 *  @property {number|null} pausedAtMs
 *  @property {InjectRecord[]} injectQueue
 *  @property {ActionItemRecord[]} actionItems
 */

