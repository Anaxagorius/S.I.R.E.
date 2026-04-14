
/**
 * types.js
 * JSDoc typedefs for consistent data structures.
 */

/** @typedef {Object} TraineeRecord
 *  @property {string} socketId
 *  @property {string} displayName
 *  @property {string|null} role
 */

/** @typedef {Object} DeliveryEntry
 *  @property {string} channel          - 'in-app' | 'email'
 *  @property {string} recipient        - displayName of recipient
 *  @property {string|null} role        - role of recipient at delivery time
 *  @property {string} deliveredAt      - ISO timestamp
 */

/** @typedef {Object} AcknowledgementEntry
 *  @property {string} displayName
 *  @property {string|null} role
 *  @property {string} acknowledgedAt   - ISO timestamp
 */

/** @typedef {Object} InjectRecord
 *  @property {string} id
 *  @property {string} message
 *  @property {string|null} originalMessage
 *  @property {string} severity
 *  @property {string|null} roleFilter
 *  @property {'in-app'|'email'} channel
 *  @property {'media'|'regulator'|'customer'|null} pressureType
 *  @property {boolean} requiresApproval
 *  @property {string|null} approvalRole
 *  @property {string|null} approvedBy
 *  @property {string|null} approvedAt
 *  @property {boolean} released
 *  @property {string|null} releasedAt
 *  @property {string|null} editedAt
 *  @property {string} createdAt
 *  @property {DeliveryEntry[]} deliveryLog
 *  @property {AcknowledgementEntry[]} acknowledgements
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

