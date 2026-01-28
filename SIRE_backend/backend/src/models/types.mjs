
/**
 * types.js
 * JSDoc typedefs for consistent data structures.
 */

/** @typedef {Object} TraineeRecord
 *  @property {string} socketId
 *  @property {string} displayName
 */

/** @typedef {Object} SessionRecord
 *  @property {string} sessionCode
 *  @property {string} scenarioKey
 *  @property {string} instructorDisplayName
 *  @property {number} createdAtEpochMs
 *  @property {TraineeRecord[]} trainees
 *  @property {number} currentTimelineIndex
 *  @property {boolean} isActive
 */

